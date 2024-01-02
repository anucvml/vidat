<template>
  <q-page-sticky
    class="z-top"
    v-if="annotationStore.currentThumbnailAction !== null"
    :offset="offset"
  >
    <div class="relative-position rounded-borders overflow-hidden">
      <div
        class="text-center"
        :style="{ 'background-color': annotationStore.currentThumbnailAction.color }"
      >
        {{ thumbnailActionName }}
      </div>
      <img
        class="block shadow-1"
        :style="{ 'max-width': imgMaxWidth + 'px' }"
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
          icon="gps_fixed"
          @click="handleLocate"
        >
          <q-tooltip>Locate to this action</q-tooltip>
        </q-btn>
        <q-btn
          class="text-black"
          flat
          icon="edit_location_alt"
          @click="handleSet"
        >
          <q-tooltip>Set current left / right frame as this action's start / end</q-tooltip>
        </q-btn>
        <q-btn
          class="text-black"
          flat
          icon="cancel"
          @click="annotationStore.currentThumbnailAction = null"
        >
          <q-tooltip>Close thumbnail preview</q-tooltip>
        </q-btn>
      </q-btn-group>
    </div>
  </q-page-sticky>
</template>

<script setup>
import { computed, ref } from 'vue'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { useMainStore } from '~/store/index.js'

const mainStore = useMainStore()
const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()

// thumbnail src
const thumbnailSrc = computed(() => {
  return configurationStore.actionLabelData.find((label) => label.id === annotationStore.currentThumbnailAction.action)
    .thumbnail
})

const thumbnailActionName = computed(() => {
  return configurationStore.actionLabelData.find((label) => label.id === annotationStore.currentThumbnailAction.action)
    .name
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
  const newImgMaxWidth = imgMaxWidth.value + delta
  if (newImgMaxWidth >= imgMinWidth) {
    const offsetX = offset.value[0] - delta / 2
    const offsetY = offset.value[1] - delta / 2
    if (offsetX >= 0 && offsetY >= 0) {
      offset.value = [offsetX, offsetY]
      imgMaxWidth.value = newImgMaxWidth
    }
  }
}
// buttons
const handlePrevThumbnail = () => {
  const currentIndex = annotationStore.currentSortedActionList.indexOf(annotationStore.currentThumbnailAction)
  if (currentIndex > 0) {
    annotationStore.currentThumbnailAction = annotationStore.currentSortedActionList[currentIndex - 1]
  }
}
const handleNextThumbnail = () => {
  const currentIndex = annotationStore.currentSortedActionList.indexOf(annotationStore.currentThumbnailAction)
  if (currentIndex < annotationStore.currentSortedActionList.length - 1) {
    annotationStore.currentThumbnailAction = annotationStore.currentSortedActionList[currentIndex + 1]
  }
}
const handleLocate = () => {
  const currentAction = annotationStore.currentThumbnailAction
  if (typeof currentAction.start === 'number') {
    annotationStore.leftCurrentFrame = utils.time2index(currentAction.start)
  }
  if (typeof currentAction.end === 'number') {
    annotationStore.rightCurrentFrame = utils.time2index(currentAction.end)
  }
}
const handleSet = () => {
  const currentAction = annotationStore.currentThumbnailAction
  currentAction.start = utils.index2time(annotationStore.leftCurrentFrame)
  currentAction.end = utils.index2time(annotationStore.rightCurrentFrame)
}
</script>
