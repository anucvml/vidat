// Modified based on https://github.com/w3c/webcodecs/tree/main/samples/mp4-decode
import MP4Box from 'mp4box'

class Writer {
  constructor (size) {
    this.data = new Uint8Array(size)
    this.idx = 0
    this.size = size
  }

  getData () {
    if (this.idx !== this.size)
      throw 'Mismatch between size reserved and sized used'

    return this.data.slice(0, this.idx)
  }

  writeUint8 (value) {
    this.data.set([value], this.idx)
    this.idx++
  }

  writeUint16 (value) {
    const arr = new Uint16Array(1)
    arr[0] = value
    const buffer = new Uint8Array(arr.buffer)
    this.data.set([buffer[1], buffer[0]], this.idx)
    this.idx += 2
  }

  writeUint8Array (value) {
    this.data.set(value, this.idx)
    this.idx += value.length
  }
}

const getConfig = (info, mp4File) => {
  const track = info.videoTracks[0]
  const avccBox = mp4File.moov.traks[0].mdia.minf.stbl.stsd.entries[0].avcC
  let i
  let size = 7
  for (i = 0; i < avccBox.SPS.length; i++) {
    size += 2 + avccBox.SPS[i].length
  }
  for (i = 0; i < avccBox.PPS.length; i++) {
    size += 2 + avccBox.PPS[i].length
  }
  const writer = new Writer(size)
  writer.writeUint8(avccBox.configurationVersion)
  writer.writeUint8(avccBox.AVCProfileIndication)
  writer.writeUint8(avccBox.profile_compatibility)
  writer.writeUint8(avccBox.AVCLevelIndication)
  writer.writeUint8(avccBox.lengthSizeMinusOne + (63 << 2))
  writer.writeUint8(avccBox.nb_SPS_nalus + (7 << 5))
  for (i = 0; i < avccBox.SPS.length; i++) {
    writer.writeUint16(avccBox.SPS[i].length)
    writer.writeUint8Array(avccBox.SPS[i].nalu)
  }
  writer.writeUint8(avccBox.nb_PPS_nalus)
  for (i = 0; i < avccBox.PPS.length; i++) {
    writer.writeUint16(avccBox.PPS[i].length)
    writer.writeUint8Array(avccBox.PPS[i].nalu)
  }

  return {
    codec: track.codec,
    codedHeight: track.track_height,
    codedWidth: track.track_width,
    description: writer.getData()
  }
}

const probeUnit = 512 * 1024

onmessage = async (event) => {
  try {
    // demux and decode the video
    const mp4File = MP4Box.createFile()
    let decoder
    const offscreen = new OffscreenCanvas(0, 0)
    const ctx = offscreen.getContext('2d')
    let isMoovFound = false
    mp4File.onReady = info => {
      isMoovFound = true
      const videoTrack = info.tracks.find(track => track.type === 'video')
      const { id, track_width, track_height, nb_samples, movie_duration, movie_timescale } = videoTrack
      offscreen.width = track_width
      offscreen.height = track_height
      const duration = movie_duration / movie_timescale
      const probeFps = nb_samples / duration
      const probeFrames = nb_samples
      const fps = probeFps < event.data.defaultFps ? probeFps : event.data.defaultFps
      const frames = Math.floor(fps * duration)
      postMessage({
        videoTrackInfo: {
          width: track_width,
          height: track_height,
          duration: duration,
          frames,
          fps
        }
      })
      const frameIndexList = []
      for (let i = 0; i < frames; i++) {
        frameIndexList.push(Math.floor(i * probeFrames / frames))
      }
      let currentFrameIndex = 0
      decoder = new VideoDecoder({
        output: frame => {
          const _currentFrameIndex = currentFrameIndex
          if (frameIndexList.includes(_currentFrameIndex)) {
            ctx.drawImage(frame, 0, 0)
            offscreen.convertToBlob({ type: 'image/jpeg' }).then(blob => {
              postMessage({ frame: blob, frameIndex: frameIndexList.indexOf(_currentFrameIndex) })
            })
            if (frameIndexList.indexOf(_currentFrameIndex) >= frameIndexList.length - 3) { // TODO: hack, safe margin
              postMessage({ done: true })
            }
          }
          frame.close()
          currentFrameIndex += 1
        },
        error: error => console.error('VideoDecoder: ', error)
      })
      decoder.configure(getConfig(info, mp4File))
      mp4File.setExtractionOptions(id)
      mp4File.start()
    }
    mp4File.onError = error => {
      console.error('MP4Box: ', error)
    }
    mp4File.onSamples = (id, user, samples) => {
      for (let sample of samples) {
        const type = sample.is_sync ? 'key' : 'delta'
        const chunk = new EncodedVideoChunk({
          type: type,
          timestamp: sample.cts,
          duration: sample.duration,
          data: sample.data
        })
        decoder.decode(chunk)
      }
    }
    let leftOffset = 0
    let rightOffset = 0
    let contentLength = 0
    const fetchVideo = async (isLeft) => {
      try {
        const abortController = new AbortController()
        const headers = {}
        if (isLeft) {
          headers['Range'] = `bytes=${leftOffset}-`
        } else {
          headers['Range'] = `bytes=${rightOffset}-${rightOffset + probeUnit -
          1}`
        }
        const response = await fetch(event.data.src, {
          signal: abortController.signal,
          headers
        })
        if (!response.ok) throw { type: 'fetch', status: response.status, statusText: response.statusText }
        if (isLeft && contentLength === 0) {
          contentLength = response.headers.get('Content-Length')
          rightOffset = contentLength - probeUnit
        }
        const reader = response.body.getReader()
        let offset = isLeft ? leftOffset : rightOffset
        const initOffset = offset
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            if (isLeft && isMoovFound) {
              mp4File.flush()
              return true
            } else if (isLeft && !isMoovFound) {
              console.error('Error')
              return false
            } else if (!isLeft && isMoovFound) {
              return true
            } else {
              return false
            }
          }
          const buffer = value.buffer
          buffer.fileStart = isLeft ? leftOffset : offset
          offset += buffer.byteLength
          if (isLeft) leftOffset += buffer.byteLength
          mp4File.appendBuffer(buffer)
          if (!isMoovFound && buffer.fileStart - initOffset > probeUnit) {
            abortController.abort()
          }
        }
      } catch (e) {
        if (e.toString() === 'AbortError: The user aborted a request.') return false
        else throw e
      }
    }
    let found = false
    let isLeft = true
    while (!found && rightOffset - leftOffset > -probeUnit) {
      found = await fetchVideo(isLeft)
      if (!found && !isLeft) rightOffset -= probeUnit
      isLeft = !isLeft
    }
    if (isLeft) {
      await fetchVideo(isLeft)
    }
  } catch (e) {
    postMessage({ error: e })
  }
}
