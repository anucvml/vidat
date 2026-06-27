<template></template>

<script setup>
import { onUnmounted, watch } from 'vue'

import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { usePreferenceStore } from '~/store/preference.js'
import VideoLoaderWorker from '~/worker/video-loader-worker.js?worker'

const props = defineProps({
  fallback: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['failed'])

const annotationStore = useAnnotationStore()
const preferenceStore = usePreferenceStore()

let worker = null
let hasFailed = false
const pending = new Map() // frame index -> Promise<ImageBitmap | null> in flight
const lru = [] // insertion order of cached frame indices (bounded cache)
const MAX_CACHED = 600

const evictIfNeeded = () => {
  while (lru.length > MAX_CACHED) {
    const old = lru.shift()
    // never evict the two frames currently on screen
    if (old === annotationStore.leftCurrentFrame || old === annotationStore.rightCurrentFrame) {
      lru.push(old)
      continue
    }
    const bitmap = annotationStore.cachedFrameList[old]
    if (bitmap && typeof bitmap.close === 'function') bitmap.close()
    delete annotationStore.cachedFrameList[old]
  }
}

const resolvePending = (value = null) => {
  for (const { resolve } of pending.values()) {
    resolve(value)
  }
  pending.clear()
}

// Decode (or read from cache) the frame at the given index. Concurrent requests
// for the same index are de-duplicated. The decoded ImageBitmap is stored in
// cachedFrameList (which the canvas watches) and also returned.
const requestFrame = (index) => {
  if (index === undefined || index === null || index < 0) return Promise.resolve(null)
  const cached = annotationStore.cachedFrameList[index]
  if (cached) return Promise.resolve(cached)
  if (pending.has(index)) return pending.get(index).promise
  if (!worker) return Promise.resolve(null)
  let resolve
  const promise = new Promise((res) => {
    resolve = res
  }).then((bitmap) => {
    pending.delete(index)
    if (bitmap) {
      annotationStore.cachedFrameList[index] = bitmap
      lru.push(index)
      evictIfNeeded()
    }
    return bitmap
  })
  pending.set(index, { promise, resolve })
  worker.postMessage({ type: 'getFrame', index, time: utils.index2time(index) })
  return promise
}

const requestVisibleFrames = () => {
  requestFrame(annotationStore.leftCurrentFrame)
  requestFrame(annotationStore.rightCurrentFrame)
}

const fail = (message, kind = 'exception', shouldReset = !props.fallback) => {
  if (hasFailed) return
  hasFailed = true
  annotationStore.isCaching = false
  resolvePending()
  console.error('VideoLoaderV3:', kind, message)
  if (worker) {
    worker.terminate()
    worker = null
  }
  if (props.fallback) {
    emit('failed', { loader: 'v3', message })
    return
  }
  if (kind === 'fetch') {
    utils.notify(`Could not fetch the video: ${annotationStore.video.src}: ${message}`, 'negative')
  } else {
    utils.notify(`Could not load the video: ${message}`, 'negative')
  }
  if (shouldReset) annotationStore.reset()
}

const requestInitialFrames = async () => {
  const frames = await Promise.all([
    requestFrame(annotationStore.leftCurrentFrame),
    requestFrame(annotationStore.rightCurrentFrame)
  ])
  if (!frames.some((frame) => frame)) {
    fail('Could not decode the initial frame.', 'initial-frame')
  } else {
    utils.notify('Video loaded successfully!', 'positive')
  }
}

const startWorker = (src) => {
  if (worker) worker.terminate()
  worker = new VideoLoaderWorker()
  hasFailed = false
  annotationStore.cachedFrameList = []
  lru.length = 0
  resolvePending()
  annotationStore.isCaching = true

  worker.onerror = (e) => fail(e.message || 'VideoLoader V3 worker failed.', 'worker')
  worker.onmessage = (event) => {
    const msg = event.data
    if (msg.type === 'meta') {
      if (!annotationStore.video.duration) annotationStore.video.duration = msg.duration
      if (!annotationStore.video.width) annotationStore.video.width = msg.width
      if (!annotationStore.video.height) annotationStore.video.height = msg.height
      if (!annotationStore.video.fps) annotationStore.video.fps = msg.fps
      if (!annotationStore.video.frames) annotationStore.video.frames = msg.frames
      if (annotationStore.keyframeList.length === 0) {
        const keyframeList = []
        for (let i = 0; i < annotationStore.video.frames; i += preferenceStore.defaultFpk) {
          keyframeList.push(i)
        }
        annotationStore.keyframeList = keyframeList
      }
      annotationStore.isCaching = false
      if (props.fallback) {
        requestInitialFrames()
      } else {
        utils.notify('Video loaded successfully!', 'positive')
        requestVisibleFrames()
      }
    } else if (msg.type === 'frame') {
      pending.get(msg.index)?.resolve(msg.bitmap)
    } else if (msg.type === 'frameMiss') {
      pending.get(msg.index)?.resolve(null)
    } else if (msg.type === 'error') {
      fail(msg.message, msg.kind)
    }
  }

  const srcURL = new URL(src, window.location.href).href
  const file = annotationStore.videoFile
  worker.postMessage({
    type: 'open',
    sourceType: file ? 'file' : 'url',
    file,
    src: srcURL,
    defaultFps: preferenceStore.defaultFps
  })
}

annotationStore.setFrameRequester(requestFrame)

watch(
  () => annotationStore.video.src,
  (newValue) => {
    if (newValue) {
      startWorker(newValue)
    } else if (worker) {
      worker.terminate()
      worker = null
      resolvePending()
    }
  },
  { immediate: true }
)

// Decode the two on-screen frames on demand whenever the view moves.
watch(() => [annotationStore.leftCurrentFrame, annotationStore.rightCurrentFrame], requestVisibleFrames)

onUnmounted(() => {
  annotationStore.setFrameRequester(null)
  if (worker) worker.terminate()
  worker = null
  resolvePending()
})
</script>
