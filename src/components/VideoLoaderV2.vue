<template></template>

<script setup>
import { onMounted, onUnmounted, watch } from 'vue'

import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useMainStore } from '~/store/index.js'
import { usePreferenceStore } from '~/store/preference.js'
import VideoProcessWorker from '~/worker/video-process-worker.js?worker'

const props = defineProps({
  fallback: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['failed'])

const annotationStore = useAnnotationStore()
const mainStore = useMainStore()
const preferenceStore = usePreferenceStore()
let worker

const fail = (message, error) => {
  if (error) console.error(error)
  annotationStore.isCaching = false
  if (worker) worker.terminate()
  worker = null
  if (props.fallback) {
    emit('failed', { loader: 'v2', message })
    return
  }
  utils.notify(`Could not load the video: ${message}`, 'negative')
  annotationStore.reset()
}

onMounted(() => {
  watch(
    () => annotationStore.video.src,
    (newValue) => {
      if (worker) {
        worker.terminate()
      }
      if (!newValue) return

      const isSupported = window.VideoDecoder && window.EncodedVideoChunk && window.OffscreenCanvas
      if (!isSupported) {
        fail('WebCodecs or OffscreenCanvas is not supported by this browser.')
        return
      }
      if (mainStore.videoFormat && mainStore.videoFormat !== 'mp4') {
        fail(`VideoLoader V2 only supports MP4 files, not "${mainStore.videoFormat}".`)
        return
      }

      worker = new VideoProcessWorker()
      // Parse the src into a full URL (the worker does not know the current web root)
      const srcURL = new URL(newValue, window.location.href).href
      worker.postMessage({ src: srcURL, defaultFps: preferenceStore.defaultFps })
      annotationStore.cachedFrameList = []
      annotationStore.isCaching = true
      worker.onmessage = (event) => {
        if (event.data.videoTrackInfo) {
          const videoTrackInfo = event.data.videoTrackInfo
          if (!annotationStore.video.duration) annotationStore.video.duration = videoTrackInfo.duration
          if (!annotationStore.video.width) annotationStore.video.width = videoTrackInfo.width
          if (!annotationStore.video.height) annotationStore.video.height = videoTrackInfo.height
          if (!annotationStore.video.fps) annotationStore.video.fps = videoTrackInfo.fps
          if (!annotationStore.video.frames) annotationStore.video.frames = videoTrackInfo.frames
          const keyframeList = []
          if (annotationStore.keyframeList.length === 0) {
            for (let i = 0; i < annotationStore.video.frames; i += preferenceStore.defaultFpk) {
              keyframeList.push(i)
            }
            annotationStore.keyframeList = keyframeList
          }
          utils.notify('Video loaded successfully!', 'positive')
        } else if (event.data.frame) {
          annotationStore.cachedFrameList[event.data.frameIndex] = event.data.frame
        } else if (event.data.done) {
          annotationStore.isCaching = false
        } else if (event.data.error) {
          if (event.data.error.type === 'fetch') {
            fail(`Could not fetch the video: ${newValue}: ${event.data.error.statusText} (${event.data.error.status})`)
          } else {
            fail(String(event.data.error), event.data.error)
          }
        }
      }
      worker.onerror = (event) => {
        fail(event.message || 'VideoLoader V2 worker failed.', event)
      }
    },
    {
      immediate: true
    }
  )
})

onUnmounted(() => {
  if (worker) worker.terminate()
  worker = null
})
</script>
