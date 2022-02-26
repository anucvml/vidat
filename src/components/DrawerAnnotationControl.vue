<template>
  <div
      class="q-pt-sm"
  >
    <div class="q-px-md q-pb-sm text-h6">Annotations</div>
    <div class="q-px-md q-pb-md">
      <q-btn-group
          spread
          flat
      >
        <q-btn
            outline
            icon="file_upload"
            @click="handleLoad"
            label="load"
        ></q-btn>
        <q-btn
            v-if="annotationStore.hasVideo"
            outline
            icon="file_download"
            @click="handleSave"
            label="save"
        ></q-btn>
      </q-btn-group>
    </div>
    <div
        v-if="annotationStore.hasVideo && submitURL"
        class="q-px-md q-pb-md"
    >
      <q-btn-group
          spread
          flat
      >
        <q-btn
            outline
            icon="cloud_upload"
            label="submit"
            :loading="submitLoading"
            @click="handleSubmit"
        ></q-btn>
      </q-btn-group>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useAnnotation } from '~/hooks/annotation.js'
import { useAnnotationStore } from '../store/annotation.js'
import { useMainStore } from '../store/index.js'

const { submitURL } = storeToRefs(useMainStore())
const annotationStore = useAnnotationStore()

const { handleLoad, handleSave, handleSubmit, submitLoading } = useAnnotation()
</script>
