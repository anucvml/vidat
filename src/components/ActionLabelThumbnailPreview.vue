<template>
  <q-page-sticky
    class="z-top"
    v-if="configurationStore.currentThumbnailActionLabelId !== null"
    :offset="offset"
  >
    <div class="relative-position">
      <img
        class="block shadow-1 rounded-borders"
        :style="{ 'max-width': imgMaxWidth + 'px' }"
        style="transition: max-width 0.1s"
        :src="thumbnailSrc"
        alt="thumbnail"
        draggable="false"
        v-touch-pan.prevent.mouse="handleMove"
        @wheel.prevent="handleResize"
      />
      <q-btn
        class="absolute-left text-black"
        style="bottom: 36px"
        flat
        icon="arrow_back"
        @click="handlePrevThumbnail"
      >
        <q-tooltip>Previous thumbnail preview</q-tooltip>
      </q-btn>
      <q-btn
        class="absolute-right text-black"
        style="bottom: 36px"
        flat
        icon="arrow_forward"
        @click="handleNextThumbnail"
      >
        <q-tooltip>Next thumbnail preview</q-tooltip>
      </q-btn>
      <q-btn-group
        flat
        class="absolute-bottom"
        spread
      >
        <q-btn
          class="text-black"
          flat
          icon="cancel"
          @click="configurationStore.currentThumbnailActionLabelId = null"
        >
          <q-tooltip>Close thumbnail preview</q-tooltip>
        </q-btn>
      </q-btn-group>
    </div>
  </q-page-sticky>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { useMainStore } from '~/store/index.js'

const mainStore = useMainStore()
const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()

// thumbnail src
const thumbnailSrc = computed(() => {
  return configurationStore.actionLabelData.find(
    (label) => label.id === configurationStore.currentThumbnailActionLabelId
  ).thumbnail
})

// draggable
const offset = ref([16, 16])
const handleMove = (event) => {
  offset.value = [offset.value[0] - event.delta.x, offset.value[1] - event.delta.y]
}
// resizable
const imgMaxWidth = ref(400)
const imgMinWidth = 400
const handleResize = (event) => {
  const delta = event.deltaY / -5
  if (imgMaxWidth.value + delta >= imgMinWidth) {
    imgMaxWidth.value += delta
  }
}
// buttons
const handlePrevThumbnail = () => {
  const currentIndex = configurationStore.actionLabelData.findIndex(
    (label) => label.id === configurationStore.currentThumbnailActionLabelId
  )
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (configurationStore.actionLabelData[i].thumbnail) {
      configurationStore.currentThumbnailActionLabelId = configurationStore.actionLabelData[i].id
      return
    }
  }
}
const handleNextThumbnail = () => {
  const currentIndex = configurationStore.actionLabelData.findIndex(
    (label) => label.id === configurationStore.currentThumbnailActionLabelId
  )
  for (let i = currentIndex + 1; i < configurationStore.actionLabelData.length; i++) {
    if (configurationStore.actionLabelData[i].thumbnail) {
      configurationStore.currentThumbnailActionLabelId = configurationStore.actionLabelData[i].id
      return
    }
  }
}
</script>
