<template>
  <AnnotationSkeleton v-if="!annotationStore.hasVideo"/>
  <q-card
      flat
      v-else
  >
    <KeyframePanel/>
    <div class="row justify-center">
      <div class="col-12 col-md">
        <CanvasPanel position="left"/>
      </div>
      <ControlPanel v-show="!mainStore.zoom"/>
      <div
          class="col-12 col-md"
          v-show="!mainStore.zoom"
      >
        <CanvasPanel position="right"/>
      </div>
    </div>
    <ActionTable/>
  </q-card>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import ActionTable from '~/pages/annotation/ActionTable.vue'
import CanvasPanel from '~/pages/annotation/CanvasPanel.vue'
import ControlPanel from '~/pages/annotation/ControlPanel.vue'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { useMainStore } from '~/store/index.js'
import { usePreferenceStore } from '~/store/preference.js'
import KeyframePanel from './KeyframePanel.vue'

const AnnotationSkeleton = defineAsyncComponent(() => import('./components/AnnotationSkeleton.vue'))

const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()
const preferenceStore = usePreferenceStore()
const mainStore = useMainStore()
</script>
