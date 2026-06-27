// V3 video loader worker: Mediabunny (demux) + WebCodecs (hardware decode).
//
// Local files are read with BlobSource. Remote files are read with UrlSource,
// allowing Mediabunny to use ranged/on-demand reads when the server supports it.
// Frames are decoded by timestamp via VideoSampleSink, which internally seeks to
// the nearest keyframe and decodes forward. Decoded frames are sent back to the
// main thread as zero-copy ImageBitmaps.
//
// Frame indexing uses a fixed-fps resampling grid (time = index / fps). Because
// we retrieve frames *by timestamp* rather than by counting decoded frames, this
// is inherently correct for variable-frame-rate (VFR) videos.
import { ALL_FORMATS, BlobSource, Input, UrlSource, VideoSampleSink } from 'mediabunny'

let input = null
let sink = null
let fps = 1
let firstTimestamp = 0

const reset = () => {
  try {
    input?.dispose?.()
  } catch (e) {
    /* ignore */
  }
  input = null
  sink = null
}

const open = async ({ src, file, sourceType, defaultFps }) => {
  reset()

  const source = sourceType === 'file' && file ? new BlobSource(file) : new UrlSource(src)
  input = new Input({ formats: ALL_FORMATS, source })
  const track = await input.getPrimaryVideoTrack()
  if (!track) {
    postMessage({ type: 'error', kind: 'no-video', message: 'No video track found in this file.' })
    return
  }

  const codec = await track.getCodec()
  // Capability probe: can this browser/device actually decode this codec?
  const decodable = await track.canDecode()
  if (!decodable) {
    postMessage({ type: 'error', kind: 'unsupported', message: `This browser cannot decode the "${codec}" codec.` })
    return
  }

  firstTimestamp = await track.getFirstTimestamp()
  const duration = (await track.computeDuration()) - firstTimestamp
  let nativeFps = defaultFps
  try {
    const stats = await track.computePacketStats(100)
    if (stats?.averagePacketRate) nativeFps = stats.averagePacketRate
  } catch (e) {
    /* fall back to defaultFps */
  }
  fps = Math.min(nativeFps, defaultFps)
  if (!fps || !isFinite(fps) || fps <= 0) fps = defaultFps
  const frames = Math.max(1, Math.floor(fps * duration))

  sink = new VideoSampleSink(track)

  postMessage({
    type: 'meta',
    width: await track.getDisplayWidth(),
    height: await track.getDisplayHeight(),
    duration,
    fps,
    frames,
    codec
  })
}

const getFrame = async ({ index, time, thumb }) => {
  if (!sink) return
  const t = firstTimestamp + (typeof time === 'number' ? time : index / fps)
  const sample = await sink.getSample(t)
  if (!sample) {
    postMessage({ type: 'frameMiss', index })
    return
  }
  const frame = sample.toVideoFrame()
  const options = thumb ? { resizeWidth: thumb.w, resizeHeight: thumb.h, resizeQuality: 'low' } : undefined
  const bitmap = await createImageBitmap(frame, options)
  frame.close()
  sample.close()
  postMessage({ type: 'frame', index, bitmap }, [bitmap])
}

onmessage = async (event) => {
  const msg = event.data
  try {
    if (msg.type === 'open') {
      await open(msg)
    } else if (msg.type === 'getFrame') {
      await getFrame(msg)
    } else if (msg.type === 'close') {
      reset()
    }
  } catch (err) {
    postMessage({ type: 'error', kind: 'exception', message: String((err && err.message) || err) })
  }
}
