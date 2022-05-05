<template>
  <q-page-sticky
      class="z-top"
      v-if="annotationStore.currentThumbnailActionId !== null"
      :offset="offset"
  >
    <div class="relative-position">
      <img
          class="block shadow-1 rounded-borders"
          :style="{'max-width': imgMaxWidth + 'px'}"
          style="transition: max-width 0.1s;"
          :src="thumbnailSrc"
          alt="thumbnail"
          draggable="false"
          v-touch-pan.prevent.mouse="handleMove"
          @wheel.prevent="handleResize"
      />
      <q-btn
          class="absolute-left text-black"
          style="bottom: 36px;"
          flat
          icon="arrow_back"
          @click="handlePrevThumbnail"
      >
        <q-tooltip>Previous thumbnail preview</q-tooltip>
      </q-btn>
      <q-btn
          class="absolute-right text-black"
          style="bottom: 36px;"
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
            @click="annotationStore.currentThumbnailActionId = null"
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
  return configurationStore.actionLabelData.find(label => label.id ===
      annotationStore.actionAnnotationList[annotationStore.currentThumbnailActionId].action
  ).thumbnail
})

// draggable
const offset = ref([16, 16])
const handleMove = event => {
  offset.value = [
    offset.value[0] - event.delta.x,
    offset.value[1] - event.delta.y
  ]
}
// resizable
const imgMaxWidth = ref(400)
const imgMinWidth = 400
const handleResize = event => {
  const delta = event.deltaY / -5
  if (imgMaxWidth.value + delta >= imgMinWidth) {
    imgMaxWidth.value += delta
  }
}
// buttons
const handlePrevThumbnail = () => {
  for (let i = annotationStore.currentThumbnailActionId - 1; i >= 0; i--) {
    if (configurationStore.actionLabelData.find(
        label => label.id === annotationStore.actionAnnotationList[i].action).thumbnail) {
      annotationStore.currentThumbnailActionId = i
      return
    }
  }
}
const handleNextThumbnail = () => {
  for (let i = annotationStore.currentThumbnailActionId + 1; i < annotationStore.actionAnnotationList.length; i++) {
    if (configurationStore.actionLabelData.find(
        label => label.id === annotationStore.actionAnnotationList[i].action).thumbnail) {
      annotationStore.currentThumbnailActionId = i
      return
    }
  }
}
const handleLocate = () => {
  const currentAction = annotationStore.actionAnnotationList[annotationStore.currentThumbnailActionId]
  if (typeof (currentAction.start) === 'number') {
    annotationStore.leftCurrentFrame = utils.time2index(currentAction.start)
  }
  if (typeof (currentAction.end) === 'number') {
    annotationStore.rightCurrentFrame = utils.time2index(currentAction.end)
  }
}
const handleSet = () => {
  const currentAction = annotationStore.actionAnnotationList[annotationStore.currentThumbnailActionId]
  currentAction.start = utils.index2time(annotationStore.leftCurrentFrame)
  currentAction.end = utils.index2time(annotationStore.rightCurrentFrame)
}
</script>
