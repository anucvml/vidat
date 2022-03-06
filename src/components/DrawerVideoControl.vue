<template>
  <div class="q-pt-sm">
    <div class="q-px-md q-pb-sm text-h6">Video</div>
    <div
        v-if="annotationStore.hasVideo"
        class="row q-px-md q-pb-sm"
    >
      <div class="col">Duration</div>
      <div class="col">
        <span v-if="video.duration && video.fps">{{ utils.toFixed2(video.duration) }}s @ {{ video.fps }}fps</span>
        <span v-else>-</span>
      </div>
    </div>
    <div
        v-if="annotationStore.hasVideo"
        class="row q-px-md q-pb-sm"
    >
      <div class="col">Size</div>
      <div class="col">
        <span v-if="video.width && video.height && video.frames">{{ video.width }} &times; {{ video.height }}px &times; {{
            video.frames
          }}
      </span>
        <span v-else>-</span>
      </div>
    </div>
    <div class="q-px-md q-pb-md">
      <q-btn-group
          spread
          flat
      >
        <q-btn
            outline
            icon="movie"
            @click="handleOpen"
            label="open"
        ></q-btn>
        <q-btn
            outline
            icon="close"
            @click="handleClose"
            v-if="annotationStore.hasVideo"
            label="close"
        ></q-btn>
      </q-btn-group>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useVideo } from '~/hooks/video.js'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'

const annotationStore = useAnnotationStore()
const { video } = storeToRefs(annotationStore)
const { handleOpen, handleClose } = useVideo()
</script>
