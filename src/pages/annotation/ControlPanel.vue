<template>
  <q-list :class="{'flex justify-evenly full-width': q.screen.lt.md}">
    <div v-if="annotationStore.mode !== 'action'">
      <q-item dense>
        <q-item-section class="text-center">
          Copy
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-btn-group
              spread
              flat
          >
            <q-btn
                outline
                icon="arrow_back"
                @click="handleCopyLeft"
            >
              <q-tooltip>copy from right to left</q-tooltip>
            </q-btn>
            <q-btn
                outline
                icon="arrow_forward"
                @click="handleCopyRight"
            >
              <q-tooltip>copy from left to right</q-tooltip>
            </q-btn>
          </q-btn-group>
        </q-item-section>
      </q-item>

      <q-item>
        <q-item-section>
          <q-btn-group
              spread
              flat
          >
            <q-btn
                outline
                icon="first_page"
                @click="handleReplaceLeft"
            >
              <q-tooltip>replace left with right</q-tooltip>
            </q-btn>
            <q-btn
                outline
                icon="last_page"
                @click="handleReplaceRight"
            >
              <q-tooltip>replace right with left</q-tooltip>
            </q-btn>
          </q-btn-group>
        </q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-btn-group
              spread
              flat
          >
            <q-btn
                outline
                icon="double_arrow"
                label="fill"
                @click="handleInterpolate"
            >
              <q-tooltip>interpolate between with same instance id</q-tooltip>
            </q-btn>
          </q-btn-group>
        </q-item-section>
      </q-item>
    </div>
    <div>
      <q-item dense>
        <q-item-section class="text-center">Mode</q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-select
              v-model="annotationStore.mode"
              outlined
              stack-label
              dense
              options-dense
              :options="modeOptions"
              :readonly="modeOptions.length === 1"
          ></q-select>
        </q-item-section>
      </q-item>
      <q-item v-if="annotationStore.mode === 'skeleton'">
        <q-item-section>
          <q-select
              v-model="annotationStore.skeletonTypeId"
              outlined
              stack-label
              dense
              options-dense
              map-options
              :options="skeletonTypeOptions"
          ></q-select>
        </q-item-section>
      </q-item>
      <q-item v-if="q.platform.has.touch">
        <q-item-section>
          <q-toggle
              v-model="delMode"
              label="Delete"
          ></q-toggle>
          <q-toggle
              v-model="copyMode"
              label="Copy"
          ></q-toggle>
          <q-toggle
              v-if="annotationStore.mode === 'region'"
              v-model="addPointMode"
              label="Add Point"
          ></q-toggle>
          <q-toggle
              v-if="annotationStore.mode === 'region'"
              v-model="delPointMode"
              label="Del Point"
          ></q-toggle>
          <q-toggle
              v-if="annotationStore.mode === 'skeleton'"
              v-model="indicatingMode"
              label="Indicate"
          ></q-toggle>
        </q-item-section>
      </q-item>
    </div>
    <div v-if="annotationStore.mode !== 'action'">
      <q-item dense>
        <q-item-section class="text-center">Operation</q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-btn
              outline
              label="bulk"
              icon="delete_forever"
              @click="handleBulkClear"
          >
            <q-tooltip>Clear all annotations between left and right frame</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
    </div>
    <div>
      <q-item dense>
        <q-item-section class="text-center">Options</q-item-section>
      </q-item>
      <q-item>
        <q-item-section>
          <q-toggle
              v-model="preferenceStore.grayscale"
              label="Grayscale"
          ></q-toggle>
          <q-toggle
              v-if="!q.platform.has.touch && annotationStore.mode !== 'action'"
              v-model="preferenceStore.showPopup"
              label="Show popup"
          ></q-toggle>
        </q-item-section>
      </q-item>
    </div>
  </q-list>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { computed, watch } from 'vue'
import { ObjectAnnotation, RegionAnnotation, SkeletonAnnotation } from '~/libs/annotationlib.js'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { useMainStore } from '~/store/index.js'
import { usePreferenceStore } from '~/store/preference.js'

const mainStore = useMainStore()
const preferenceStore = usePreferenceStore()
const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()
const q = useQuasar()

const annotationListMap = computed(() => annotationStore[annotationStore.mode + 'AnnotationListMap'])

const clone = annotationList => {
  return annotationList.map(annotation => annotation.clone())
}

// copy
const handleCopyLeft = () => {
  if (annotationStore.leftCurrentFrame === annotationStore.rightCurrentFrame) {
    utils.notify('Cannot copy from itself.', 'warning')
    return
  }
  if (annotationListMap.value[annotationStore.rightCurrentFrame].length === 0) {
    utils.notify('There is nothing to copy.', 'warning')
    return
  }
  annotationListMap.value[annotationStore.leftCurrentFrame].push(
      ...clone(annotationListMap.value[annotationStore.rightCurrentFrame])
  )
}
const handleCopyRight = () => {
  if (annotationStore.leftCurrentFrame === annotationStore.rightCurrentFrame) {
    utils.notify('Cannot copy from itself.', 'warning')
    return
  }
  if (annotationListMap.value[annotationStore.leftCurrentFrame].length === 0) {
    utils.notify('There is nothing to copy.', 'warning')
    return
  }
  annotationListMap.value[annotationStore.rightCurrentFrame].push(
      ...clone(annotationListMap.value[annotationStore.leftCurrentFrame])
  )
}
const handleReplaceLeft = () => {
  if (annotationStore.leftCurrentFrame === annotationStore.rightCurrentFrame) {
    utils.notify('Cannot replace with itself.', 'warning')
    return
  }
  if (annotationListMap.value[annotationStore.rightCurrentFrame].length === 0) {
    utils.notify('There is nothing to replace.', 'warning')
    return
  }
  if (annotationListMap.value[annotationStore.leftCurrentFrame].length === 0) {
    annotationListMap.value[annotationStore.leftCurrentFrame] = clone(
        annotationListMap.value[annotationStore.rightCurrentFrame]
    )
  } else {
    utils.confirm('Are you sure to replace? This would remove ALL annotations in the LEFT panel!').onOk(() => {
      annotationListMap.value[annotationStore.leftCurrentFrame] = clone(
          annotationListMap.value[annotationStore.rightCurrentFrame]
      )
    })
  }
}
const handleReplaceRight = () => {
  if (annotationStore.leftCurrentFrame === annotationStore.rightCurrentFrame) {
    utils.notify('Cannot replace with itself.', 'warning')
  }
  if (annotationListMap.value[annotationStore.leftCurrentFrame].length === 0) {
    utils.notify('There is nothing to replace.', 'warning')
    return
  }
  if (annotationListMap.value[annotationStore.rightCurrentFrame].length === 0) {
    annotationListMap.value[annotationStore.rightCurrentFrame] = clone(
        annotationListMap.value[annotationStore.leftCurrentFrame]
    )
  } else {
    utils.confirm('Are you sure to replace? This would remove ALL annotations in the RIGHT panel!').onOk(() => {
      annotationListMap.value[annotationStore.rightCurrentFrame] = clone(
          annotationListMap.value[annotationStore.leftCurrentFrame]
      )
    })
  }
}
const handleInterpolate = () => {
  const leftAnnotationList = annotationListMap.value[annotationStore.leftCurrentFrame]
  const rightAnnotationList = annotationListMap.value[annotationStore.rightCurrentFrame]
  const interpolateList = []
  for (const leftAnnotation of leftAnnotationList) {
    let cnt = 0
    for (const rightAnnotation of rightAnnotationList) {
      if (
          rightAnnotation.instance !== null &&
          leftAnnotation.instance !== null &&
          rightAnnotation.instance === leftAnnotation.instance &&
          ((annotationStore.mode === 'object' || annotationStore.mode === 'region') && rightAnnotation.labelId ===
              leftAnnotation.labelId) ||
          (annotationStore.mode === 'skeleton' && rightAnnotation.typeId === leftAnnotation.typeId)
      ) {
        // same number of points only
        if (annotationStore.mode === 'region') {
          if (leftAnnotation.pointList.length !== rightAnnotation.pointList.length) {
            utils.notify('Interpolating between different #points regions is not supported!', 'warning')
            continue
          }
        }
        cnt += 1
        if (cnt > 1) {
          utils.notify('Can not interpolate from one to many.', 'warning')
          continue
        }
        interpolateList.push({
          leftAnnotation,
          rightAnnotation
        })
      }
    }
  }
  if (interpolateList.length === 0) {
    utils.notify('There is nothing to interpolate.', 'warning')
    return
  }
  for (const interpolate of interpolateList) {
    const leftAnnotation = interpolate.leftAnnotation
    const rightAnnotation = interpolate.rightAnnotation
    let i = 1
    const nFrames = annotationStore.rightCurrentFrame - annotationStore.leftCurrentFrame - 1
    for (let frame = annotationStore.leftCurrentFrame + 1; frame < annotationStore.rightCurrentFrame; frame++) {
      const ratio = i / nFrames
      i += 1
      const originalAnnotationList = annotationListMap.value[frame] || []
      // remove archive interpolations
      for (let k = 0; k < originalAnnotationList.length; k++) {
        if (
            originalAnnotationList[k].instance === leftAnnotation.instance &&
            (
                (
                    (annotationStore.mode === 'object' || annotationStore.mode === 'region') &&
                    originalAnnotationList[k].labelId === leftAnnotation.labelId
                )
                ||
                (
                    annotationStore.mode === 'skeleton' &&
                    originalAnnotationList[k].typeId === leftAnnotation.typeId
                )
            )
        ) {
          originalAnnotationList.splice(k, 1)
        }
      }
      // interpolate from left to right
      if (annotationStore.mode === 'object') {
        originalAnnotationList.push(new ObjectAnnotation(
            leftAnnotation.x * (1 - ratio) + rightAnnotation.x * ratio,
            leftAnnotation.y * (1 - ratio) + rightAnnotation.y * ratio,
            leftAnnotation.width * (1 - ratio) + rightAnnotation.width * ratio,
            leftAnnotation.height * (1 - ratio) + rightAnnotation.height * ratio,
            leftAnnotation.labelId,
            leftAnnotation.color,
            leftAnnotation.instance,
            leftAnnotation.score
        ))
      } else if (annotationStore.mode === 'region') {
        const newPointList = []
        for (let k = 0; k < leftAnnotation.pointList.length; k++) {
          const leftPoint = leftAnnotation.pointList[k]
          const rightPoint = rightAnnotation.pointList[k]
          newPointList.push({
            x: leftPoint.x * (1 - ratio) + rightPoint.x * ratio,
            y: leftPoint.y * (1 - ratio) + rightPoint.y * ratio
          })
        }
        originalAnnotationList.push(new RegionAnnotation(
            newPointList,
            leftAnnotation.labelId,
            leftAnnotation.color,
            leftAnnotation.instance,
            leftAnnotation.score
        ))
      } else if (annotationStore.mode === 'skeleton') {
        const newPointList = []
        for (let k = 0; k < leftAnnotation.pointList.length; k++) {
          const leftPoint = leftAnnotation.pointList[k]
          const rightPoint = rightAnnotation.pointList[k]
          newPointList.push({
            id: leftPoint.id,
            name: leftPoint.name,
            x: leftPoint.x * (1 - ratio) + rightPoint.x * ratio,
            y: leftPoint.y * (1 - ratio) + rightPoint.y * ratio
          })
        }
        const newSkeletonAnnotation = new SkeletonAnnotation(
            leftAnnotation.centerX * (1 - ratio) + rightAnnotation.centerX * ratio,
            leftAnnotation.centerY * (1 - ratio) + rightAnnotation.centerY * ratio,
            leftAnnotation.typeId,
            leftAnnotation.color,
            leftAnnotation.instance,
            leftAnnotation.score
        )
        newSkeletonAnnotation.ratio = leftAnnotation.ratio * (1 - ratio) + rightAnnotation.ratio * ratio
        newSkeletonAnnotation.pointList = newPointList
        originalAnnotationList.push(newSkeletonAnnotation)
      }
      annotationListMap.value[frame] = originalAnnotationList
    }
  }
  utils.notify('Interpolate successfully.', 'positive')
}

// mode
const modeOptions = computed(() => {
  const ret = []
  if (preferenceStore.objects) ret.push('object')
  if (preferenceStore.regions) ret.push('region')
  if (preferenceStore.skeletons) ret.push('skeleton')
  return ret
})
const skeletonTypeOptions = computed(
    () => configurationStore.skeletonTypeData.map(type => {
      return {
        label: type.name,
        value: type.id
      }
    })
)

/// mode for mobile
const delMode = computed({
  get: () => annotationStore.delMode,
  set: newValue => {
    if (newValue) {
      annotationStore.delMode = true
      annotationStore.copyMode = false
      annotationStore.addPointMode = false
      annotationStore.delPointMode = false
      annotationStore.indicatingMode = false
    } else {
      annotationStore.delMode = false
    }
  }
})
const copyMode = computed({
  get: () => annotationStore.copyMode,
  set: newValue => {
    if (newValue) {
      annotationStore.delMode = false
      annotationStore.copyMode = true
      annotationStore.addPointMode = false
      annotationStore.delPointMode = false
      annotationStore.indicatingMode = false
    } else {
      annotationStore.copyMode = false
    }
  }
})
const addPointMode = computed({
  get: () => annotationStore.addPointMode,
  set: newValue => {
    if (newValue) {
      annotationStore.delMode = false
      annotationStore.copyMode = false
      annotationStore.addPointMode = true
      annotationStore.delPointMode = false
      annotationStore.indicatingMode = false
    } else {
      annotationStore.addPointMode = false
    }
  }
})
const delPointMode = computed({
  get: () => annotationStore.delPointMode,
  set: newValue => {
    if (newValue) {
      annotationStore.delMode = false
      annotationStore.copyMode = false
      annotationStore.addPointMode = false
      annotationStore.delPointMode = true
      annotationStore.indicatingMode = false
    } else {
      annotationStore.delPointMode = false
    }
  }
})
const indicatingMode = computed({
  get: () => annotationStore.indicatingMode,
  set: newValue => {
    if (newValue) {
      annotationStore.delMode = false
      annotationStore.copyMode = false
      annotationStore.addPointMode = false
      annotationStore.delPointMode = false
      annotationStore.indicatingMode = true
    } else {
      annotationStore.indicatingMode = false
    }
  }
})
watch(() => annotationStore.mode,
    () => {
      annotationStore.delMode = false
      annotationStore.copyMode = false
      annotationStore.addPointMode = false
      annotationStore.delPointMode = false
      annotationStore.indicatingMode = false
    }
)

// operation
const handleBulkClear = () => {
  utils.confirm(
      `Are you sure to REMOVE ALL ${annotationStore.mode} annotations between frame ${annotationStore.leftCurrentFrame} to ${annotationStore.rightCurrentFrame}?`).
      onOk(() => {
        for (let frame = annotationStore.leftCurrentFrame; frame <= annotationStore.rightCurrentFrame; frame += 1) {
          annotationListMap.value[frame] = []
        }
        utils.notify('Bulk clear successful!', 'positive')
      })
}
</script>
