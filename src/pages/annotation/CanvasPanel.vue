<template>
  <FilmStrip/>
  <div class="relative-position">
    <canvas
        ref="background"
        class="full-width block"
        :style="{'filter': preferenceStore.grayscale ? 'grayscale(100%)' : 'none'}"
        :width="CANVAS_WIDTH"
        :height="canvasHeight"
    />
    <VideoPlayer
        v-if="position === 'left'"
        class="absolute-top"
    />
    <canvas
        ref="canvas"
        style="inset: 0;"
        :style="{'cursor': cursor}"
        class="full-width block absolute"
        :width="CANVAS_WIDTH"
        :height="canvasHeight"
        @mousemove.prevent="handleMousemove"
        @mouseout.prevent="handleMouseupAndMouseout"
        @mousedown.prevent="handleMousedown"
        @mouseup.prevent="handleMouseupAndMouseout"
        @mouseenter.prevent="handleMouseenter"
        @touchstart.prevent="handleTouchstart"
        @touchmove.prevent="handleTouchmove"
        @touchend.prevent="handleTouchend"
    />
    <q-btn
        v-if="position === 'left'"
        class="bg-blue-grey-1 text-black absolute"
        style="top: 5px; right: 5px;"
        round
        flat
        :icon="mainStore.zoom ? 'zoom_out' : 'zoom_in'"
        @click="handleZoomClick"
    ></q-btn>
    <div
        class="absolute bg-black text-white"
        v-if="actionList && actionList.length"
        style="bottom: 0; padding: 4px; font-size: 20px; opacity: 0.8"
    >Action: <span
        v-for="(action, index) in actionList"
        :style="{color: action.color}"
    >{{ action.name }}<span
        v-if="actionList.length !== 1 && index !== actionList.length - 1"
        class="text-white"
    >, </span></span>
    </div>
    <q-badge
        class="bg-black text-white"
        v-if="preferenceStore.actions && status"
        :style="statusStyle"
    >
      <span v-if="status.keydown">{{ status.keydown }},</span>
      <span v-if="status.message">{{ status.message }},</span>
      <span>{{ utils.toFixed2(status.x) }},{{ utils.toFixed2(status.y) }}</span>
    </q-badge>
    <div
        v-if="preferenceStore.showPopup && showPopup && annotationList.length && popup.x && popup.y"
        class="absolute"
        :style="{top: popup.y + 'px', left: popup.x + 'px'}"
    >
      <q-popup-proxy
          no-parent-event
          v-model="showPopup"
      >
        <q-card
            flat
            class="q-py-sm q-px-md"
            style="min-width: 200px;"
        >
          <div class="q-py-sm">
            New {{ annotationStore.mode }}
          </div>
          <q-select
              ref="select"
              dense
              options-dense
              borderless
              emit-value
              map-options
              :options="labelOption"
              v-if="annotationList.length && (annotationStore.mode === 'object' || annotationStore.mode === 'region')"
              v-model="annotationList.at(-1).labelId"
              @update:model-value="handleSelectInput"
          ></q-select>
          <q-input
              ref="input"
              dense
              flat
              label="instance"
              v-model="annotationList.at(-1).instance"
              @keydown.enter="showPopup = false"
          ></q-input>
          <q-input
              dense
              flat
              label="score"
              v-model="annotationList.at(-1).score"
              @keydown.enter="showPopup = false"
          ></q-input>
          <q-btn
              dense
              outline
              class="full-width q-mt-sm"
              @click="showPopup = false"
              color="primary"
              label="confirm"
          ></q-btn>
        </q-card>
      </q-popup-proxy>
    </div>
  </div>
  <FilmStrip/>
  <ObjectTable
      v-if="annotationStore.mode === 'object' && preferenceStore.objects"
      ref="table"
      :position="position"
  />
  <RegionTable
      v-else-if="annotationStore.mode === 'region' && preferenceStore.regions"
      ref="table"
      :position="position"
  />
  <SkeletonTable
      v-else-if="annotationStore.mode === 'skeleton' && preferenceStore.skeletons"
      ref="table"
      :position="position"
  />
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ObjectAnnotation, RegionAnnotation, SkeletonAnnotation } from '~/libs/annotationlib.js'
import utils from '~/libs/utils.js'
import FilmStrip from '~/pages/annotation/components/FilmStrip.vue'
import VideoPlayer from '~/pages/annotation/components/VideoPlayer.vue'
import ObjectTable from '~/pages/annotation/ObjectTable.vue'
import RegionTable from '~/pages/annotation/RegionTable.vue'
import SkeletonTable from '~/pages/annotation/SkeletonTable.vue'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { useMainStore } from '~/store/index.js'
import { usePreferenceStore } from '~/store/preference.js'

// common
const CANVAS_WIDTH = 1920
const canvasHeight = computed(() => CANVAS_WIDTH * annotationStore.video.height / annotationStore.video.width)
const props = defineProps({
  position: {
    type: String,
    required: true
  }
})
const mainStore = useMainStore()
const annotationStore = useAnnotationStore()
const preferenceStore = usePreferenceStore()
const configurationStore = useConfigurationStore()
const currentFrame = computed(() => annotationStore[props.position + 'CurrentFrame'])

// background
const background = ref()
onMounted(() => {
  const ctxBMR = background.value.getContext('bitmaprenderer')
  watch(
      () => annotationStore.cachedFrameList[annotationStore[props.position + 'CurrentFrame']],
      (frame) => {
        if (frame) createImageBitmap(frame).then(image => {
          ctxBMR.transferFromImageBitmap(image)
        })
      },
      {
        immediate: true
      }
  )
})

// canvas
const canvas = ref()
const cursor = ref('')

/// annotationLists
const annotationList = computed(() => {
  if (annotationStore.mode === 'action') return []
  if (!annotationStore[annotationStore.mode + 'AnnotationListMap'][currentFrame.value]) {
    annotationStore[annotationStore.mode + 'AnnotationListMap'][currentFrame.value] = []
  }
  return annotationStore[annotationStore.mode + 'AnnotationListMap'][currentFrame.value]
})
const objectAnnotationList = computed(() => {
  if (!annotationStore.objectAnnotationListMap[currentFrame.value]) {
    annotationStore.objectAnnotationListMap[currentFrame.value] = []
  }
  return annotationStore.objectAnnotationListMap[currentFrame.value]
})
const regionAnnotationList = computed(() => {
  if (!annotationStore.regionAnnotationListMap[currentFrame.value]) {
    annotationStore.regionAnnotationListMap[currentFrame.value] = []
  }
  return annotationStore.regionAnnotationListMap[currentFrame.value]
})
const skeletonAnnotationList = computed(() => {
  if (!annotationStore.skeletonAnnotationListMap[currentFrame.value]) {
    annotationStore.skeletonAnnotationListMap[currentFrame.value] = []
  }
  return annotationStore.skeletonAnnotationListMap[currentFrame.value]
})

/// contexts
let createContext
let dragContext
let activeContext

/// action indicator
const actionList = computed(
    () => annotationStore.actionAnnotationList.filter(action =>
        currentFrame.value >= utils.time2index(action.start)
        && currentFrame.value <= utils.time2index(action.end)
    ).map(action => {
      return {
        name: configurationStore.actionLabelData.find(label => label.id === action.action).name,
        color: action.color
      }
    })
)

/// status
const status = ref()
const statusStyle = ref()
const statusBaseStyle = {
  position: 'absolute',
  opacity: 0.6
}

/// popup
const popup = ref()
const showPopup = ref(false)
const labelOption = computed(() => configurationStore.objectLabelData.map(label => {
  return {
    label: label.name,
    value: label.id,
    color: label.color
  }
}))
const handleSelectInput = (labelId) => {
  annotationList.value[annotationList.value.length - 1].color = configurationStore.objectLabelData.find(label => label.id === labelId).color
}

/// autofocus
const select = ref()
const input = ref()
const table = ref()
const autoFocus = () => {
  if (preferenceStore.showPopup) {
    if (annotationStore.mode === 'object' || annotationStore.mode === 'region') {
      nextTick(() => {
        select.value.showPopup()
      })
    } else if (annotationStore.mode === 'skeleton') {
      nextTick(() => {
        input.value.select()
      })
    }
  } else {
    table.value.focusLast()
  }
}

/// drawing
const draw = (ctx) => {
  if (preferenceStore.objects) objectAnnotationList.value.map(annotation => annotation.draw(ctx))
  if (preferenceStore.regions) regionAnnotationList.value.map(annotation => annotation.draw(ctx))
  if (preferenceStore.skeletons) skeletonAnnotationList.value.map(annotation => annotation.draw(ctx))
}
const clear = (ctx) => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, canvasHeight.value)
}
onMounted(() => {
  const ctx = canvas.value.getContext('2d')
  watch(
      annotationList,
      () => {
        clear(ctx)
        draw(ctx)
      },
      {
        immediate: true,
        deep: true
      }
  )
})

/// key bindings
const shiftDown = ref(false)
const backspaceDown = ref(false)
const altDown = ref(false)
const handleKeyup = event => {
  event.stopPropagation()
  if (event.target.nodeName.toLowerCase() === 'input') { // see: https://github.com/anucvml/vidat/issues/91
    return false
  } else if (event.code === 'Delete') {
    if (activeContext) {
      annotationList.value.splice(activeContext.index, 1)
    }
  } else if (event.code === 'Escape') {
    if (createContext) {
      activeContext = undefined
      createContext = undefined
      annotationList.value.pop()
    }
  } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    shiftDown.value = false
    if (status.value) status.value.keydown = undefined
  } else if (annotationStore.mode === 'region' && event.code === 'Backspace') {
    if (status.value) status.value.keydown = undefined
    backspaceDown.value = false
  } else if (annotationStore.mode === 'region' && (event.code === 'AltLeft' || event.code === 'AltRight')) {
    if (status.value) status.value.keydown = undefined
    altDown.value = false
  }
}
const handleKeydown = event => {
  event.stopPropagation()
  if (event.target.nodeName.toLowerCase() === 'input') {
    return false
  } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    shiftDown.value = true
    if (status.value) status.value.keydown = 'copy'
  } else if (annotationStore.mode === 'region' && event.code === 'Backspace') {
    backspaceDown.value = true
    if (status.value) status.value.keydown = 'delete'
  } else if (annotationStore.mode === 'region' && (event.code === 'AltLeft' || event.code === 'AltRight')) {
    altDown.value = true
    if (status.value) status.value.keydown = 'add'
  }
}
onMounted(() => {
  document.addEventListener('keyup', handleKeyup, true)
  document.addEventListener('keydown', handleKeydown, true)
})
onUnmounted(() => {
  document.removeEventListener('keyup', handleKeyup, true)
  document.removeEventListener('keydown', handleKeydown, true)
})

/// get helpers
const getCurrentObjectAnnotation = (mouseX, mouseY) => {
  let currentObjectAnnotation
  let index
  let type
  for (let i = 0; i < annotationList.value.length; i++) {
    let objectAnnotation = annotationList.value[i]
    if (!currentObjectAnnotation) {
      if (objectAnnotation.nearTopLeftAnchor(mouseX, mouseY) ||
          objectAnnotation.nearTopRightAnchor(mouseX, mouseY) ||
          objectAnnotation.nearBottomLeftAnchor(mouseX, mouseY) ||
          objectAnnotation.nearBottomRightAnchor(mouseX, mouseY)) {
        type = 'cornerSizing'
        currentObjectAnnotation = objectAnnotation
        index = i
        objectAnnotation.highlight = true
      } else if (objectAnnotation.nearTopAnchor(mouseX, mouseY)) {
        type = 'topSizing'
        currentObjectAnnotation = objectAnnotation
        index = i
        objectAnnotation.highlight = true
      } else if (objectAnnotation.nearBottomAnchor(mouseX, mouseY)) {
        type = 'bottomSizing'
        currentObjectAnnotation = objectAnnotation
        index = i
        objectAnnotation.highlight = true
      } else if (objectAnnotation.nearLeftAnchor(mouseX, mouseY)) {
        type = 'leftSizing'
        currentObjectAnnotation = objectAnnotation
        index = i
        objectAnnotation.highlight = true
      } else if (objectAnnotation.nearRightAnchor(mouseX, mouseY)) {
        type = 'rightSizing'
        currentObjectAnnotation = objectAnnotation
        index = i
        objectAnnotation.highlight = true
      } else if (objectAnnotation.nearBoundary(mouseX, mouseY)) {
        type = 'moving'
        currentObjectAnnotation = objectAnnotation
        index = i
        objectAnnotation.highlight = true
      } else {
        objectAnnotation.highlight = false
      }
    } else {
      objectAnnotation.highlight = false
    }
  }
  return [currentObjectAnnotation, index, type]
}
const getCurrentRegionAnnotation = (mouseX, mouseY) => {
  let currentRegionAnnotation
  let index
  let type
  let nearPoint
  let nearPointIndex
  for (let i = 0; i < annotationList.value.length; i++) {
    const regionAnnotation = annotationList.value[i]
    if (!currentRegionAnnotation) {
      for (let j = 0; j < regionAnnotation.pointList.length; j++) {
        const point = regionAnnotation.pointList[j]
        if (regionAnnotation.nearPoint(mouseX, mouseY, point)) {
          nearPoint = point
          type = 'sizing'
          currentRegionAnnotation = regionAnnotation
          index = i
          nearPointIndex = j
          regionAnnotation.highlight = true
          break
        }
      }
      if (!currentRegionAnnotation && regionAnnotation.nearBoundary(mouseX, mouseY)) {
        type = 'moving'
        currentRegionAnnotation = regionAnnotation
        index = i
        regionAnnotation.highlight = true
      } else {
        regionAnnotation.highlight = false
      }
    } else {
      regionAnnotation.highlight = false
    }
  }
  return [currentRegionAnnotation, index, nearPoint, nearPointIndex, type]
}
const getCurrentSkeletonAnnotation = (mouseX, mouseY) => {
  let currentSkeletonAnnotation
  let index
  let nearPoint
  let type
  for (let i = 0; i < annotationList.value.length; i++) {
    let skeletonAnnotation = annotationList.value[i]
    if (!currentSkeletonAnnotation) {
      for (const point of skeletonAnnotation.pointList) {
        if (skeletonAnnotation.nearPoint(mouseX, mouseY, point)) {
          currentSkeletonAnnotation = skeletonAnnotation
          index = i
          nearPoint = point
          type = nearPoint && nearPoint.name !== 'center' ? 'sizing' : 'moving'
          skeletonAnnotation.highlight = true
        }
      }
    } else {
      skeletonAnnotation.highlight = false
    }
  }
  return [currentSkeletonAnnotation, index, nearPoint, type]
}

/// handlers for desktop
const getMouseLocation = event => {
  const mouseX = event.offsetX / canvas.value.clientWidth * annotationStore.video.width
  const mouseY = event.offsetY / canvas.value.clientHeight * annotationStore.video.height
  return [mouseX, mouseY]
}
const handleMousemove = event => {
  canvas.value.focus()
  const [mouseX, mouseY] = getMouseLocation(event)
  if (status.value) {
    status.value.x = mouseX
    status.value.y = mouseY
  } else {
    status.value = {
      x: mouseX,
      y: mouseY
    }
  }
  if (mouseX > annotationStore.video.width / 2 && mouseY > annotationStore.video.height / 2) {
    statusStyle.value = {
      ...statusBaseStyle,
      top: '1px',
      left: '1px'
    }
  } else {
    statusStyle.value = {
      ...statusBaseStyle,
      bottom: '1px',
      right: '1px'
    }
  }
  if (annotationStore.mode === 'object' && preferenceStore.objects) {
    // creating an object
    if (createContext) {
      const activeAnnotation = annotationList.value[createContext.index]
      const deltaX = mouseX - createContext.mousedownX
      const deltaY = mouseY - createContext.mousedownY
      activeAnnotation.resize(
          createContext.x,
          createContext.y,
          deltaX,
          deltaY
      )
    }
    // drag the object
    if (dragContext) {
      const activeAnnotation = annotationList.value[dragContext.index]
      const deltaX = mouseX - dragContext.mousedownX
      const deltaY = mouseY - dragContext.mousedownY
      if (dragContext.type === 'moving') {
        activeAnnotation.resize(
            dragContext.x + deltaX,
            dragContext.y + deltaY
        )
      } else if (dragContext.type === 'cornerSizing') {
        const oppositeAnchor = dragContext.oppositeAnchor
        activeAnnotation.resize(
            oppositeAnchor.x,
            oppositeAnchor.y,
            (oppositeAnchor.x > dragContext.x ? -dragContext.width : dragContext.width) + deltaX,
            (oppositeAnchor.y > dragContext.y ? -dragContext.height : dragContext.height) + deltaY
        )
      } else if (dragContext.type === 'topSizing') {
        activeAnnotation.resize(
            undefined,
            mouseY,
            undefined,
            dragContext.height - deltaY
        )
      } else if (dragContext.type === 'bottomSizing') {
        activeAnnotation.resize(
            undefined,
            mouseY > dragContext.y ? dragContext.y : mouseY,
            undefined,
            mouseY > dragContext.y ? dragContext.height + deltaY : dragContext.y - mouseY
        )
      } else if (dragContext.type === 'leftSizing') {
        activeAnnotation.resize(
            mouseX,
            undefined,
            dragContext.width - deltaX
        )
      } else if (dragContext.type === 'rightSizing') {
        activeAnnotation.resize(
            mouseX > dragContext.x ? dragContext.x : mouseX,
            undefined,
            mouseX > dragContext.x ? dragContext.width + deltaX : dragContext.x - mouseX
        )
      }
    }
    // highlight the object
    let found
    for (let i = 0; i < annotationList.value.length; i++) {
      const objectAnnotation = annotationList.value[i]
      if (!found && objectAnnotation.nearTopLeftAnchor(mouseX, mouseY)) {
        if (!dragContext) cursor.value = 'nw-resize'
        objectAnnotation.highlight = true
        found = i
      } else if (!found && objectAnnotation.nearTopAnchor(mouseX, mouseY)) {
        if (!dragContext) cursor.value = 'n-resize'
        objectAnnotation.highlight = true
        found = i
      } else if (!found && objectAnnotation.nearTopRightAnchor(mouseX, mouseY)) {
        if (!dragContext) cursor.value = 'ne-resize'
        objectAnnotation.highlight = true
        found = i
      } else if (!found && objectAnnotation.nearLeftAnchor(mouseX, mouseY)) {
        if (!dragContext) cursor.value = 'w-resize'
        objectAnnotation.highlight = true
        found = i
      } else if (!found && objectAnnotation.nearRightAnchor(mouseX, mouseY)) {
        if (!dragContext) cursor.value = 'e-resize'
        objectAnnotation.highlight = true
        found = i
      } else if (!found && objectAnnotation.nearBottomLeftAnchor(mouseX, mouseY)) {
        if (!dragContext) cursor.value = 'sw-resize'
        objectAnnotation.highlight = true
        found = i
      } else if (!found && objectAnnotation.nearBottomAnchor(mouseX, mouseY)) {
        if (!dragContext) cursor.value = 's-resize'
        objectAnnotation.highlight = true
        found = i
      } else if (!found && objectAnnotation.nearBottomRightAnchor(mouseX, mouseY)) {
        if (!dragContext) cursor.value = 'se-resize'
        objectAnnotation.highlight = true
        found = i
      } else if (!found && objectAnnotation.nearBoundary(mouseX, mouseY)) {
        if (!dragContext) cursor.value = 'grab'
        objectAnnotation.highlight = true
        found = i
      } else {
        objectAnnotation.highlight = false
      }
    }
    if (typeof (found) === 'number') {
      activeContext = {
        index: found
      }
    } else {
      activeContext = undefined
      cursor.value = 'crosshair'
    }
  } else if (annotationStore.mode === 'region' && preferenceStore.regions) {
    // creating a region
    if (createContext) {
      const activeAnnotation = createContext.regionAnnotation
      const lastPoint = activeAnnotation.pointList[activeAnnotation.pointList.length - 1]
      lastPoint.x = mouseX
      lastPoint.y = mouseY
    }
    // drag the region
    if (dragContext) {
      const activeAnnotation = dragContext.regionAnnotation
      const deltaX = mouseX - dragContext.mousedownX
      const deltaY = mouseY - dragContext.mousedownY
      dragContext.mousedownX = mouseX
      dragContext.mousedownY = mouseY
      if (dragContext.type === 'moving') {
        activeAnnotation.move(deltaX, deltaY)
      } else if (dragContext.type === 'sizing') {
        const point = dragContext.nearPoint
        point.x = mouseX
        point.y = mouseY
      }
    }
    // highlight the region
    let found
    for (let i = 0; i < annotationList.value.length; i++) {
      const regionAnnotation = annotationList.value[i]
      if (!found && regionAnnotation.nearPoints(mouseX, mouseY)) {
        cursor.value = 'move'
        regionAnnotation.highlight = true
        found = i
      } else if (!found && regionAnnotation.nearBoundary(mouseX, mouseY)) {
        cursor.value = 'grab'
        regionAnnotation.highlight = true
        found = i
      } else {
        regionAnnotation.highlight = false
      }
    }
    if (typeof (found) === 'number') {
      activeContext = {
        index: found
      }
    } else {
      activeContext = undefined
      cursor.value = 'crosshair'
    }
  } else if (annotationStore.mode === 'skeleton' && preferenceStore.skeletons) {
    // create a skeleton
    if (createContext) {
      createContext.skeletonAnnotation.ratio = Math.sqrt(
          (mouseX - createContext.mouseDownX) ** 2 + (mouseY - createContext.mouseDownY) ** 2) / 10
    }
    // drag the skeleton
    if (dragContext) {
      const skeletonAnnotation = dragContext.skeletonAnnotation
      const deltaX = mouseX - dragContext.mousedownX
      const deltaY = mouseY - dragContext.mousedownY
      dragContext.mousedownX = mouseX
      dragContext.mousedownY = mouseY
      if (dragContext.type === 'moving') {
        skeletonAnnotation.move(deltaX, deltaY)
      } else if (dragContext.type === 'sizing') {
        const point = dragContext.nearPoint
        point.x = mouseX
        point.y = mouseY
      }
    }
    // highlight the skeleton
    let found
    for (let i = 0; i < annotationList.value.length; i++) {
      const skeletonAnnotation = annotationList.value[i]
      let nearPoint
      for (const point of skeletonAnnotation.pointList) {
        if (skeletonAnnotation.nearPoint(mouseX, mouseY, point)) {
          nearPoint = point
          status.value.message = point.name
          break
        }
      }
      if (!found && nearPoint) {
        if (nearPoint.name === 'center') {
          cursor.value = 'grab'
        } else {
          cursor.value = 'move'
        }
        skeletonAnnotation.highlight = true
        found = i
      } else {
        skeletonAnnotation.highlight = false
      }
    }
    if (typeof (found) === 'number') {
      activeContext = {
        index: found
      }
    } else {
      status.value.message = ''
      activeContext = undefined
      cursor.value = 'crosshair'
    }
  }
}
const handleMousedown = event => {
  const [mouseX, mouseY] = getMouseLocation(event)
  if (annotationStore.mode === 'object' && preferenceStore.objects) {
    // drag
    let found = false
    for (let i = 0; i < annotationList.value.length; i++) {
      let objectAnnotation = annotationList.value[i]
      if (objectAnnotation.highlight) {
        found = true
        if (shiftDown.value) {
          objectAnnotation = objectAnnotation.clone()
          annotationList.value.push(objectAnnotation)
        }
        let type = 'moving'
        if (objectAnnotation.nearTopLeftAnchor(mouseX, mouseY) ||
            objectAnnotation.nearTopRightAnchor(mouseX, mouseY) ||
            objectAnnotation.nearBottomLeftAnchor(mouseX, mouseY) ||
            objectAnnotation.nearBottomRightAnchor(mouseX, mouseY)) {
          type = 'cornerSizing'
        } else if (objectAnnotation.nearTopAnchor(mouseX, mouseY)) {
          type = 'topSizing'
        } else if (objectAnnotation.nearBottomAnchor(mouseX, mouseY)) {
          type = 'bottomSizing'
        } else if (objectAnnotation.nearLeftAnchor(mouseX, mouseY)) {
          type = 'leftSizing'
        } else if (objectAnnotation.nearRightAnchor(mouseX, mouseY)) {
          type = 'rightSizing'
        }
        dragContext = {
          index: i,
          type: type,
          x: objectAnnotation.x,
          y: objectAnnotation.y,
          width: objectAnnotation.width,
          height: objectAnnotation.height,
          mousedownX: mouseX,
          mousedownY: mouseY,
          oppositeAnchor: type === 'cornerSizing' ? objectAnnotation.oppositeAnchor(mouseX, mouseY) : undefined
        }
        break
      }
    }
    // creating an object
    if (!found && !createContext) {
      const objectAnnotation = new ObjectAnnotation(mouseX, mouseY, 0, 0)
      createContext = {
        index: annotationList.value.length,
        x: objectAnnotation.x,
        y: objectAnnotation.y,
        mousedownX: mouseX,
        mousedownY: mouseY
      }
      annotationList.value.push(objectAnnotation)
    }
  } else if (annotationStore.mode === 'region' && preferenceStore.regions) {
    // drag
    let found = false
    for (let regionAnnotation of annotationList.value) {
      if (regionAnnotation.highlight) {
        found = true
        let nearPoint
        for (const point of regionAnnotation.pointList) {
          if (regionAnnotation.nearPoint(mouseX, mouseY, point)) {
            nearPoint = point
            break
          }
        }
        if (backspaceDown.value && nearPoint) {
          if (regionAnnotation.pointList.length <= 3) {
            utils.notify('At least 3 points.', 'warning')
          } else {
            regionAnnotation.pointList.splice(regionAnnotation.pointList.indexOf(nearPoint), 1)
          }
        } else if (altDown.value && !nearPoint) {
          let pointIndexList = regionAnnotation.getPointIndexListOfBoundary(mouseX, mouseY)
          const minIndex = Math.min(...pointIndexList)
          const maxIndex = Math.max(...pointIndexList)
          let newPoint = {
            x: mouseX,
            y: mouseY
          }
          if (minIndex === 0 && maxIndex === regionAnnotation.pointList.length - 1) {
            regionAnnotation.pointList.push(newPoint)
            newPoint = regionAnnotation.pointList[regionAnnotation.pointList.length - 1]
          } else {
            regionAnnotation.pointList.splice(minIndex + 1, 0, newPoint)
            newPoint = regionAnnotation.pointList[minIndex + 1]
          }
          dragContext = {
            type: 'sizing',
            regionAnnotation: regionAnnotation,
            nearPoint: newPoint,
            mousedownX: mouseX,
            mousedownY: mouseY
          }
        } else {
          if (shiftDown.value && !nearPoint) {
            regionAnnotation = regionAnnotation.clone()
            annotationList.value.push(regionAnnotation)
            regionAnnotation = annotationList.value[annotationList.value.length - 1]
          }
          dragContext = {
            type: nearPoint ? 'sizing' : 'moving',
            regionAnnotation: regionAnnotation,
            nearPoint: nearPoint,
            mousedownX: mouseX,
            mousedownY: mouseY
          }
        }
        break
      }
    }
    // creating a region
    if (!found && !createContext) {
      const regionAnnotation = new RegionAnnotation([
        {
          x: mouseX,
          y: mouseY
        }
      ])
      annotationList.value.push(regionAnnotation)
      createContext = {
        regionAnnotation: annotationList.value[annotationList.value.length - 1]
      }
    }
  } else if (annotationStore.mode === 'skeleton' && preferenceStore.skeletons) {
    // drag
    let found = false
    for (let skeletonAnnotation of annotationList.value) {
      if (skeletonAnnotation.highlight) {
        found = true
        let nearPoint
        // special order, see: https://github.com/anucvml/vidat/issues/69
        for (let i = 1; i < skeletonAnnotation.pointList.length; i++) {
          const point = skeletonAnnotation.pointList[i]
          if (skeletonAnnotation.nearPoint(mouseX, mouseY, point)) {
            nearPoint = point
            break
          }
        }
        const centerPoint = skeletonAnnotation.pointList[0]
        if (!nearPoint && skeletonAnnotation.nearPoint(mouseX, mouseY, centerPoint)) nearPoint = centerPoint
        if (shiftDown.value && nearPoint && nearPoint.name === 'center') {
          skeletonAnnotation = skeletonAnnotation.clone()
          annotationList.value.push(skeletonAnnotation)
          skeletonAnnotation = annotationList.value[annotationList.value.length - 1]
        }
        dragContext = {
          type: nearPoint && nearPoint.name !== 'center' ? 'sizing' : 'moving',
          skeletonAnnotation: skeletonAnnotation,
          nearPoint: nearPoint,
          mousedownX: mouseX,
          mousedownY: mouseY
        }
        break
      }
    }
    // creating a skeleton
    if (!found && !createContext) {
      const skeletonAnnotation = new SkeletonAnnotation(mouseX, mouseY, annotationStore.skeletonTypeId)
      annotationList.value.push(skeletonAnnotation)
      createContext = {
        skeletonAnnotation: annotationList.value[annotationList.value.length - 1],
        mouseDownX: mouseX,
        mouseDownY: mouseY
      }
    }
  }
}
const handleMouseupAndMouseout = event => {
  const [mouseX, mouseY] = getMouseLocation(event)
  if (event.type === 'mouseout') {
    status.value = undefined
  }
  if (annotationStore.mode === 'object' && preferenceStore.objects) {
    if (createContext) {
      const activeAnnotation = annotationList.value[createContext.index]
      if (activeAnnotation.width < 8 || activeAnnotation.height < 8) {
        utils.notify('The object is too small. At least 8x8.', 'warning')
        annotationList.value.splice(createContext.index, 1)
      } else {
        createContext = undefined
        if (preferenceStore.showPopup) {
          popup.value = {
            x: event.offsetX,
            y: event.offsetY
          }
          showPopup.value = true
        }
        autoFocus()
      }
      createContext = undefined
    }
    if (dragContext && event.type === 'mouseup') {
      dragContext = undefined
    }
  } else if (annotationStore.mode === 'region' && preferenceStore.regions) {
    if (createContext) {
      // handle mouseout
      if (event.type === 'mouseout') {
        createContext = undefined
        return
      }
      const pointList = createContext.regionAnnotation.pointList
      // finish
      if (pointList.length >= 3 &&
          (createContext.regionAnnotation.nearPoint(mouseX, mouseY, pointList[0]) ||
              createContext.regionAnnotation.nearPoint(mouseX, mouseY, pointList[pointList.length - 2])
          )) {
        pointList.pop()
        if (preferenceStore.showPopup) {
          popup.value = {
            x: event.offsetX,
            y: event.offsetY
          }
          showPopup.value = true
        }
        autoFocus()
        createContext = undefined
      } else {
        // add new point
        pointList.push({
          x: mouseX,
          y: mouseY
        })
      }
    }
    if (dragContext && event.type === 'mouseup') {
      dragContext = undefined
    }
  } else if (annotationStore.mode === 'skeleton' && preferenceStore.skeletons) {
    if (createContext) {
      if (preferenceStore.showPopup) {
        popup.value = {
          x: event.offsetX,
          y: event.offsetY
        }
        showPopup.value = true
      }
      autoFocus()
      createContext = undefined
    }
    if (dragContext && event.type === 'mouseup') {
      dragContext = undefined
    }
  }
}
const handleMouseenter = event => {
  const [mouseX, mouseY] = getMouseLocation(event)
  status.value = {
    x: mouseX,
    y: mouseY
  }
  // if left button of mouse is not pressed when entering the canvas, drag stops
  if (event.buttons !== 1 && dragContext) {
    dragContext = undefined
  }
}

/// handlers for mobile
const getTouchLocation = event => {
  let currentTarget = canvas.value
  let top = 0
  let left = 0
  while (currentTarget) {
    top += currentTarget.offsetTop
    left += currentTarget.offsetLeft
    currentTarget = currentTarget.offsetParent
  }
  const mouseX = (event.touches[0].pageX - left) / canvas.value.clientWidth * annotationStore.video.width
  const mouseY = (event.touches[0].pageY - top) / canvas.value.clientHeight * annotationStore.video.height
  return [mouseX, mouseY]
}
const handleTouchstart = event => {
  canvas.value.focus()
  const [mouseX, mouseY] = getTouchLocation(event)
  if (annotationStore.mode === 'object' && preferenceStore.objects) {
    let [objectAnnotation, index, type] = getCurrentObjectAnnotation(mouseX, mouseY)
    if (objectAnnotation) {
      if (annotationStore.delMode) {
        annotationList.value.splice(index, 1)
      } else {
        if (annotationStore.copyMode) {
          annotationList.value.push(objectAnnotation.clone())
          type = 'moving'
        }
        dragContext = {
          index: index,
          type: type,
          x: objectAnnotation.x,
          y: objectAnnotation.y,
          width: objectAnnotation.width,
          height: objectAnnotation.height,
          mousedownX: mouseX,
          mousedownY: mouseY,
          oppositeAnchor: type === 'cornerSizing' ? objectAnnotation.oppositeAnchor(mouseX, mouseY) : undefined
        }
      }
    } else if (!createContext && !annotationStore.delMode && !annotationStore.copyMode) {
      const objectAnnotation = new ObjectAnnotation(mouseX, mouseY, 0, 0)
      objectAnnotation.highlight = true
      createContext = {
        index: annotationList.value.length,
        x: objectAnnotation.x,
        y: objectAnnotation.y,
        mousedownX: mouseX,
        mousedownY: mouseY
      }
      annotationList.value.push(objectAnnotation)
    }
  } else if (annotationStore.mode === 'region' && preferenceStore.regions) {
    // add point when creating
    if (createContext) {
      const pointList = createContext.regionAnnotation.pointList
      // finish
      if (pointList.length >= 3 &&
          (createContext.regionAnnotation.nearPoint(mouseX, mouseY, pointList[0]) ||
              createContext.regionAnnotation.nearPoint(mouseX, mouseY, pointList.at(-1))
          )) {
        table.value.focusLast()
        createContext.regionAnnotation.highlight = false
        createContext = undefined
      } else {
        // add new point
        pointList.push({
          x: mouseX,
          y: mouseY
        })
      }
      return
    }
    let [regionAnnotation, index, nearPoint, nearPointIndex, type] = getCurrentRegionAnnotation(mouseX, mouseY)
    if (regionAnnotation) {
      if (annotationStore.delMode) {
        annotationList.value.splice(index, 1)
      } else if (annotationStore.delPointMode) {
        if (regionAnnotation.pointList.length <= 3) {
          utils.notify('At least 3 points.', 'warning')
        } else {
          regionAnnotation.pointList.splice(nearPointIndex, 1)
        }
      } else {
        if (annotationStore.copyMode) {
          annotationList.value.push(regionAnnotation.clone())
          type = 'moving'
        } else if (annotationStore.addPointMode) {
          let pointIndexList = regionAnnotation.getPointIndexListOfBoundary(mouseX, mouseY)
          const minIndex = Math.min(...pointIndexList)
          const maxIndex = Math.max(...pointIndexList)
          nearPoint = {
            x: mouseX,
            y: mouseY
          }
          if (minIndex === 0 && maxIndex === regionAnnotation.pointList.length - 1) {
            regionAnnotation.pointList.push(nearPoint)
            nearPoint = regionAnnotation.pointList[regionAnnotation.pointList.length - 1]
          } else {
            regionAnnotation.pointList.splice(minIndex + 1, 0, nearPoint)
            nearPoint = regionAnnotation.pointList[minIndex + 1]
          }
          type = 'sizing'
        }
        dragContext = {
          type: type,
          regionAnnotation: regionAnnotation,
          nearPoint: nearPoint,
          mousedownX: mouseX,
          mousedownY: mouseY
        }
      }
    }
    // creating a region
    else if (!createContext && !annotationStore.delMode && !annotationStore.copyMode &&
        !annotationStore.addPointMode &&
        !annotationStore.delPointMode) {
      const regionAnnotation = new RegionAnnotation([
            {
              x: mouseX,
              y: mouseY
            }
          ]
      )
      regionAnnotation.highlight = true
      annotationList.value.push(regionAnnotation)
      createContext = {
        regionAnnotation: annotationList.value[annotationList.value.length - 1]
      }
    }
  } else if (annotationStore.mode === 'skeleton' && preferenceStore.skeletons) {
    let [skeletonAnnotation, index, nearPoint, type] = getCurrentSkeletonAnnotation(mouseX, mouseY)
    if (skeletonAnnotation) {
      if (annotationStore.delMode) {
        annotationList.value.splice(index, 1)
      } else if (annotationStore.indicatingMode) {
        status.value = {
          message: nearPoint.name,
          x: mouseX,
          y: mouseY
        }
      } else if (annotationStore.copyMode && nearPoint && nearPoint.name === 'center') {
        skeletonAnnotation.highlight = false
        skeletonAnnotation = skeletonAnnotation.clone()
        skeletonAnnotation.highlight = true
        annotationList.value.push(skeletonAnnotation)
        skeletonAnnotation = annotationList.value[annotationList.value.length - 1]
      }
      if (!(annotationStore.copyMode || annotationStore.delMode || annotationStore.indicatingMode) ||
          nearPoint.name ===
          'center') {
        dragContext = {
          type: type,
          skeletonAnnotation: skeletonAnnotation,
          nearPoint: nearPoint,
          mousedownX: mouseX,
          mousedownY: mouseY
        }
        if (nearPoint && nearPoint.name !== 'center') {
          status.value = {
            message: nearPoint.name
          }
        }
      }
    }
    // creating a skeleton
    else if (!createContext && !annotationStore.copyMode && !annotationStore.delMode &&
        !annotationStore.indicatingMode) {
      const skeletonAnnotation = new SkeletonAnnotation(mouseX, mouseY, annotationStore.skeletonTypeId)
      skeletonAnnotation.highlight = true
      annotationList.value.push(skeletonAnnotation)
      createContext = {
        skeletonAnnotation: annotationList.value[annotationList.value.length - 1],
        mouseDownX: mouseX,
        mouseDownY: mouseY
      }
    }
  }
}
const handleTouchmove = event => {
  const [mouseX, mouseY] = getTouchLocation(event)
  // status
  if (status.value) {
    status.value.x = mouseX
    status.value.y = mouseY
  } else {
    status.value = {
      x: mouseX,
      y: mouseY
    }
  }
  if (mouseX > annotationStore.video.width / 2 && mouseY > annotationStore.video.height / 2) {
    statusStyle.value = {
      ...statusBaseStyle,
      top: '1px',
      left: '1px'
    }
  } else {
    statusStyle.value = {
      ...statusBaseStyle,
      bottom: '1px',
      right: '1px'
    }
  }
  if (annotationStore.mode === 'object' && preferenceStore.objects) {
    // creating an object
    if (createContext) {
      const activeAnnotation = annotationList.value[createContext.index]
      const deltaX = mouseX - createContext.mousedownX
      const deltaY = mouseY - createContext.mousedownY
      activeAnnotation.resize(
          createContext.x,
          createContext.y,
          deltaX,
          deltaY
      )
    }
    // drag the object
    if (dragContext) {
      const activeAnnotation = annotationList.value[dragContext.index]
      const deltaX = mouseX - dragContext.mousedownX
      const deltaY = mouseY - dragContext.mousedownY
      if (dragContext.type === 'moving') {
        activeAnnotation.resize(
            dragContext.x + deltaX,
            dragContext.y + deltaY
        )
      } else if (dragContext.type === 'cornerSizing') {
        const oppositeAnchor = dragContext.oppositeAnchor
        activeAnnotation.resize(
            oppositeAnchor.x,
            oppositeAnchor.y,
            (oppositeAnchor.x > dragContext.x ? -dragContext.width : dragContext.width) + deltaX,
            (oppositeAnchor.y > dragContext.y ? -dragContext.height : dragContext.height) + deltaY
        )
      } else if (dragContext.type === 'topSizing') {
        activeAnnotation.resize(
            undefined,
            mouseY,
            undefined,
            dragContext.height - deltaY)
      } else if (dragContext.type === 'bottomSizing') {
        activeAnnotation.resize(
            undefined,
            mouseY > dragContext.y ? undefined : mouseY,
            undefined,
            mouseY > dragContext.y ? dragContext.height + deltaY : dragContext.y - mouseY)
      } else if (dragContext.type === 'leftSizing') {
        activeAnnotation.resize(
            mouseX,
            undefined,
            dragContext.width - deltaX)
      } else if (dragContext.type === 'rightSizing') {
        activeAnnotation.resize(
            mouseX > dragContext.x ? undefined : mouseX,
            undefined,
            mouseX > dragContext.x ? dragContext.width + deltaX : dragContext.x - mouseX)
      }
    }
  } else if (annotationStore.mode === 'region' && preferenceStore.regions) {
    if (dragContext) {
      const activeAnnotation = dragContext.regionAnnotation
      const deltaX = mouseX - dragContext.mousedownX
      const deltaY = mouseY - dragContext.mousedownY
      dragContext.mousedownX = mouseX
      dragContext.mousedownY = mouseY
      if (dragContext.type === 'moving') {
        activeAnnotation.move(deltaX, deltaY)
      } else if (dragContext.type === 'sizing') {
        const point = dragContext.nearPoint
        point.x = mouseX
        point.y = mouseY
      }
    }
  } else if (annotationStore.mode === 'skeleton' && preferenceStore.skeletons) {
    // create a skeleton
    if (createContext) {
      createContext.skeletonAnnotation.ratio =
          Math.sqrt((mouseX - createContext.mouseDownX) ** 2 + (mouseY - createContext.mouseDownY) ** 2) /
          10
    }
    if (dragContext) {
      const skeletonAnnotation = dragContext.skeletonAnnotation
      const deltaX = mouseX - dragContext.mousedownX
      const deltaY = mouseY - dragContext.mousedownY
      dragContext.mousedownX = mouseX
      dragContext.mousedownY = mouseY
      if (dragContext.type === 'moving') {
        skeletonAnnotation.move(deltaX, deltaY)
      } else if (dragContext.type === 'sizing') {
        const point = dragContext.nearPoint
        point.x = mouseX
        point.y = mouseY
      }
    }
  }
}
const handleTouchend = () => {
  // status
  status.value = undefined
  if (annotationStore.mode === 'object' && preferenceStore.objects) {
    if (createContext) {
      const activeAnnotation = annotationList.value[createContext.index]
      activeAnnotation.highlight = false
      if (activeAnnotation.width < 8 || activeAnnotation.height < 8) {
        utils.notify('The object is too small. At least 8x8.', 'warning')
        annotationList.value.splice(createContext.index, 1)
      } else {
        createContext = undefined
        table.value.focusLast()
      }
      createContext = undefined
    }
    if (dragContext) {
      annotationList.value[dragContext.index].highlight = false
      dragContext = undefined
    }
  } else if (annotationStore.mode === 'region' && preferenceStore.objects) {
    if (dragContext) {
      dragContext.regionAnnotation.highlight = false
      dragContext = undefined
    }
  } else if (annotationStore.mode === 'skeleton' && preferenceStore.objects) {
    if (createContext) {
      table.value.focusLast()
      createContext.skeletonAnnotation.highlight = false
      createContext = undefined
    }
    if (dragContext) {
      dragContext.skeletonAnnotation.highlight = false
      dragContext = undefined
    }
  }
}

/// zoom
const handleZoomClick = () => {
  mainStore.zoom = !mainStore.zoom
}
</script>
