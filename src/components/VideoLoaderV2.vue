<template>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { usePreferenceStore } from '~/store/preference.js'
import VideoProcessWorker from '../worker/video-process-worker.js?worker'

const annotationStore = useAnnotationStore()
const preferenceStore = usePreferenceStore()
let worker
onMounted(() => {
  watch(() => annotationStore.video.src, (newValue) => {
    if (worker) {
      worker.terminate()
    }
    if (newValue) {
      worker = new VideoProcessWorker()
      worker.postMessage({ src: newValue, defaultFps: preferenceStore.defaultFps })
      annotationStore.cachedFrameList = []
      annotationStore.isCaching = true
      worker.onmessage = event => {
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
            utils.notify(
                `Could not load video: ${newValue}: ${event.data.error.statusText} (${event.data.error.status})`,
                'negative')
          }
          console.error(event.data.error)
          annotationStore.isCaching = false
          annotationStore.reset()
          worker.terminate()
        }
      }
    }
  }, {
    immediate: true
  })
})
</script>
