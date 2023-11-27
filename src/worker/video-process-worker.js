// Modified based on https://github.com/w3c/webcodecs/tree/main/samples/mp4-decode
import MP4Box from 'mp4box'

const getConfig = (info, mp4File) => {
  const track = info.videoTracks[0]
  // get description, adapted from
  // https://github.com/w3c/webcodecs/blob/main/samples/video-decode-display/demuxer_mp4.js#L64
  let description = undefined
  for (const entry of mp4File.moov.traks[0].mdia.minf.stbl.stsd.entries) {
    if (entry.avcC || entry.hvcC) {
      const stream = new MP4Box.DataStream(undefined, 0, MP4Box.DataStream.BIG_ENDIAN)
      if (entry.avcC) {
        entry.avcC.write(stream)
      } else {
        entry.hvcC.write(stream)
      }
      description = new Uint8Array(stream.buffer, 8) // Remove the box header.
    }
  }
  return {
    codec: track.codec,
    codedHeight: track.track_height,
    codedWidth: track.track_width,
    description: description
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
    mp4File.onReady = (info) => {
      isMoovFound = true
      const videoTrack = info.tracks.find((track) => track.type === 'video')
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
        frameIndexList.push(Math.floor((i * probeFrames) / frames))
      }
      let currentFrameIndex = 0
      decoder = new VideoDecoder({
        output: (frame) => {
          const _currentFrameIndex = currentFrameIndex
          if (frameIndexList.includes(_currentFrameIndex)) {
            ctx.drawImage(frame, 0, 0)
            offscreen.convertToBlob({ type: 'image/jpeg' }).then((blob) => {
              postMessage({
                frame: blob,
                frameIndex: frameIndexList.indexOf(_currentFrameIndex)
              })
            })
            if (frameIndexList.indexOf(_currentFrameIndex) >= frameIndexList.length - 3) {
              // TODO: hack, safe margin
              postMessage({ done: true })
            }
          }
          frame.close()
          currentFrameIndex += 1
        },
        error: (error) => console.error('VideoDecoder: ', error)
      })
      decoder.configure(getConfig(info, mp4File))
      mp4File.setExtractionOptions(id)
      mp4File.start()
    }
    mp4File.onError = (error) => {
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
          headers['Range'] = `bytes=${rightOffset}-${rightOffset + probeUnit - 1}`
        }
        const response = await fetch(event.data.src, {
          signal: abortController.signal,
          headers
        })
        if (!response.ok) {
          throw {
            type: 'fetch',
            status: response.status,
            statusText: response.statusText
          }
        }
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
            } else return !isLeft && isMoovFound
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
        if (e.toString().includes('AbortError')) return false
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
