<template>
  <video
      id="video-player"
      :class="['full-width', {'grayscale': preferenceStore.grayscale}]"
      style="display: none;"
      preload="auto"
      :src="annotationStore.video.src"
      :muted="preferenceStore.muted"
  />
</template>

<script setup>
import { useAnnotationStore } from '~/store/annotation.js'
import { usePreferenceStore } from '~/store/preference.js'

const annotationStore = useAnnotationStore()
const preferenceStore = usePreferenceStore()
</script>
