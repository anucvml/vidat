<template>
  <div
    class="action-indicator"
    :style="{ 'background-color': q.dark.isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' }"
  >
    <div
      :title="`Action: ${action.action}\nStart: ${action.start}\nEnd: ${action.end}\nDuration: ${
        action.end - action.start
      }\nDescription: ${action.description}`"
      class="action"
      v-for="(action, index) in actionIndicatorList"
      :style="{
        left: action.leftPercent,
        right: action.rightPercent,
        'background-color': action.color
      }"
      @click="handleClick(index)"
    ></div>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { computed } from 'vue'

import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'

const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()
const q = useQuasar()

const actionIndicatorList = computed(() => {
  if (!annotationStore.video.frames) {
    return []
  }
  return annotationStore.actionAnnotationList.map((action) => {
    const markerWidthUnit = 100 / (annotationStore.video.frames - 1)
    const leftFrame = utils.time2index(action.start)
    const rightFrame = utils.time2index(action.end)
    const leftPercent = (leftFrame - 0.5) * markerWidthUnit + '%'
    const rightPercent = (annotationStore.video.frames - rightFrame - 1.5) * markerWidthUnit + '%'
    return {
      ...action,
      leftPercent,
      rightPercent
    }
  })
})

const handleClick = (index) => {
  const action = annotationStore.actionAnnotationList[index]
  annotationStore.leftCurrentFrame = utils.time2index(action.start)
  annotationStore.rightCurrentFrame = utils.time2index(action.end)
  if (configurationStore.actionLabelData.find((label) => label.id === action.action).thumbnail) {
    annotationStore.currentThumbnailAction = annotationStore.currentThumbnailAction === action ? null : action
  } else {
    annotationStore.currentThumbnailAction = null
  }
}
</script>

<style>
.action-indicator {
  position: relative;
  height: 8px;
}

.action-indicator .action {
  position: absolute;
  height: 100%;
  background-blend-mode: multiply;
  cursor: pointer;
}

.action-indicator .action:hover {
  transform: scaleY(1.5);
  transition: transform 0.2s ease-in-out;
}
</style>
