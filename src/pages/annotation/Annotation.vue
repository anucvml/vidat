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
    <ActionTable v-if="preferenceStore.actions"/>
  </q-card>
</template>

<script setup>
import ActionTable from '~/pages/annotation/ActionTable.vue'
import CanvasPanel from '~/pages/annotation/CanvasPanel.vue'
import ControlPanel from '~/pages/annotation/ControlPanel.vue'
import AnnotationSkeleton from './components/AnnotationSkeleton.vue'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { useMainStore } from '~/store/index.js'
import { usePreferenceStore } from '~/store/preference.js'
import KeyframePanel from './KeyframePanel.vue'

const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()
const preferenceStore = usePreferenceStore()
const mainStore = useMainStore()
</script>
