<template>
  <video
      class="full-width hidden"
      v-if="annotationStore.hasVideo"
      ref="video"
      preload="auto"
      controls
      muted
      :src="annotationStore.video.src"
      @loadeddata="handleLoadeddata"
      @seeked="handleSeeked"
      @error="handleError"
  >
    Sorry, your browser doesn't support embedded videos.
  </video>
</template>

<script setup>
import { nextTick } from 'vue'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { usePreferenceStore } from '~/store/preference.js'

const annotationStore = useAnnotationStore()
const preferenceStore = usePreferenceStore()
const handleLoadeddata = (event) => {
  utils.notify('Video loaded successfully!', 'positive')
  if (!annotationStore.video.duration) annotationStore.video.duration = event.target.duration
  if (!annotationStore.video.width) annotationStore.video.width = event.target.videoWidth
  if (!annotationStore.video.height) annotationStore.video.height = event.target.videoHeight
  if (!annotationStore.video.fps) annotationStore.video.fps = preferenceStore.defaultFps
  if (!annotationStore.video.frames) annotationStore.video.frames = Math.round(
      annotationStore.video.fps * annotationStore.video.duration)
  const keyframeList = []
  if (annotationStore.keyframeList.length === 0) {
    // init keyframe list
    for (let i = 0; i < annotationStore.video.frames; i += preferenceStore.defaultFpk) {
      keyframeList.push(i)
    }
    annotationStore.keyframeList = keyframeList
  }
  const interval = parseFloat((1 / annotationStore.video.fps).toFixed(3))
  // add keyframe to priorityQueue
  for (const keyframe of keyframeList) {
    if (keyframe !== 0) {
      annotationStore.priorityQueue.push(keyframe)
    }
  }
  // add frame index into the backendQueue
  // 1. every one second
  annotationStore.backendQueue = []
  for (let i = 1.0; i < annotationStore.video.duration; i++) {
    const index = utils.time2index(i)
    if (keyframeList.indexOf(index) === -1) {
      annotationStore.backendQueue.push(index)
    }
  }
  // 2. every 1 / fps second
  annotationStore.priorityQueue = []
  for (let i = interval; i < annotationStore.video.duration; i += interval) {
    if (i.toFixed(1) % 1 !== 0) {
      annotationStore.backendQueue.push(utils.time2index(i))
    }
  }
  annotationStore.cachedFrameList = []
  nextTick(() => {
    event.target.currentTime = 0.0
  })
}
const handleSeeked = (event) => {
  if (annotationStore.hasVideo) {
    const videoElement = event.target
    const currentTime = videoElement.currentTime
    const currentIndex = utils.time2index(currentTime)
    if (!annotationStore.cachedFrameList[currentIndex]) {
      annotationStore.isCaching = true
      // get the image
      const canvas = document.createElement('canvas')
      canvas.width = annotationStore.video.width
      canvas.height = annotationStore.video.height
      let ctx = canvas.getContext('2d')
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)
      // save to cachedFrames
      canvas.toBlob((blob => {
        annotationStore.cachedFrameList[currentIndex] = blob
      }), 'image/jpeg')
    }
    // trigger next frame
    if (!annotationStore.cachedFrameList[annotationStore.leftCurrentFrame]) {
      videoElement.currentTime = utils.index2time(annotationStore.leftCurrentFrame)
    } else if (!annotationStore.cachedFrameList[annotationStore.rightCurrentFrame]) {
      videoElement.currentTime = utils.index2time(annotationStore.rightCurrentFrame)
    } else if (annotationStore.priorityQueue.length !== 0) {
      videoElement.currentTime = utils.index2time(annotationStore.priorityQueue.shift())
    } else if (annotationStore.backendQueue.length !== 0) {
      videoElement.currentTime = utils.index2time(annotationStore.backendQueue.shift())
    } else {
      annotationStore.isCaching = false
    }
  }
}
const handleError = (event) => {
  console.error(event)
  utils.notify(`Could not load video: ${annotationStore.video.src}: ${event.target.error.message}`, 'negative')
  annotationStore.reset()
}
</script>
