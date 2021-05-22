const VIDEO_PANEL_TEMPLATE = `
  <div>
    <film-strip></film-strip>
    <div style="position: relative;">
      <img
        ref="background"
        style="display: block; position: absolute"
        :class="['full-width', {'grayscale': grayscale}]"
      >
      <img
        ref="img"
        :src="cachedFrameList[currentFrame]"
        style="display: none"
        @load="handleLoad"
      >
      <video-player v-if="position === 'left'" style="position: absolute; top: 0"></video-player>
      <div
        v-if="actionList.length"
        style="display: block; position: absolute; bottom: 0; padding: 4px; font-size: 20px; color: white; background-color: black; opacity: 0.6">
        Action:
        <span v-for="action in actionList" :key="action.id" :style="{color: action.color}">
        {{ action.text }}<span v-if="actionList.length !== 1 && action.id != actionList.length - 1" style="color: white;">,</span>
        </span>
      </div>
      <canvas
        ref="canvas"
        :style="{display: 'block', position: 'relative', top: 0, cursor: cursor, 'z-index': 1}"
        class="full-width"
        :width="CANVAS_WIDTH"
        tabindex="1"
        @mousemove="handleMousemove"
        @mouseout="handleMouseupAndMouseout"
        @mousedown="handleMousedown"
        @mouseup="handleMouseupAndMouseout"
        @mouseenter="handleMouseenter"
        @touchstart="handleTouchstart"
        @touchmove="handleTouchmove"
        @touchend="handleTouchend"
      ></canvas>
      <q-btn
        v-if="position === 'left'"
        class="bg-white"
        style="position: absolute; top: 5px; right: 5px; z-index: 2"
        round
        @click="$store.commit('setZoom', !zoom)"
        :icon="zoom ? 'zoom_out' : 'zoom_in'"
      ></q-btn>
      <q-badge v-if="preference.actions && status" :style="statusStyle">
        <span v-if="status.keydown">{{ status.keydown }},</span>
        <span v-if="status.message">{{ status.message }},</span>
        <span>{{status.x | toFixed2}},{{status.y | toFixed2}}</span>
      </q-badge>
      <div v-show="popup.x" v-if="annotationList" :style="{position: 'absolute', top: popup.y + 'px', left: popup.x + 'px'}">
        <q-popup-edit ref="popup" :value="1" :title="'new ' + mode" @show="handlePopupShow">
          <q-select
            ref="select"
            dense
            options-dense
            borderless
            emit-value
            map-options
            :options="labelOption"
            v-if="annotationList.length && (mode === 'object' || mode === 'region')"
            v-model="annotationList[annotationList.length - 1].labelId"
            @input="handleSelectInput"
          ></q-select>
          <q-input
            ref="input"
            dense
            flat
            label="instance"
            v-if="annotationList.length"
            v-model="annotationList[annotationList.length - 1].instance"
          ></q-input>
          <q-input
            dense
            flat
            label="score"
            v-if="annotationList.length"
            v-model="annotationList[annotationList.length - 1].score"
          ></q-input>
          <q-btn dense falt class="full-width q-mt-sm" @click="$refs.popup.hide()" color="primary" label="confirm"></q-btn>
        </q-popup-edit>
      </div>
    </div>
    <film-strip></film-strip>
    <object-table
      ref="table"
      :position="position"
      v-if="mode === 'object' && preference.objects"
    ></object-table>
    <region-table
      ref="table"
      :position="position"
      v-if="mode === 'region' && preference.regions"
    ></region-table>
    <skeleton-table
      ref="table"
      :position="position"
      v-if="mode === 'skeleton' && preference.skeletons"
    ></skeleton-table>
  </div>
`

import filmStrip from './filmStrip.js'
import objectTable from './objectTable.js'
import regionTable from './regionTable.js'
import skeletonTable from './skeletonTable.js'
import utils from '../../../libs/utils.js'
import videoPlayer from './videoPlayer.js'
import { ObjectAnnotation, RegionAnnotation, SkeletonAnnotation } from '../../../libs/annotationlib.js'

export default {
  props: {
    position: {
      default: 'left',
    },
  },
  components: {
    filmStrip,
    objectTable,
    regionTable,
    skeletonTable,
    videoPlayer,
  },
  data: () => {
    return {
      CANVAS_WIDTH: 1920,
      ctx: null,
      utils,
      createContext: null,
      dragContext: null,
      activeContext: null,
      playTimeInterval: null,
      popup: {
        x: 0,
        y: 0,
      },
      shiftDown: false,
      backspaceDown: false,
      altDown: false,
      status: null,
      statusStyle: {},
      cursor: 'crosshair',
      isFirstLoad: true,
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setAnnotationList',
    ]),
    handleLoad () {
      this.$refs.background.src = this.$refs.img.src
      if (this.isFirstLoad) {
        this.isFirstLoad = false
        this.$refs.canvas.height = this.CANVAS_WIDTH * this.video.height / this.video.width
        this.draw()
      }
    },
    getMouseLocation (event) {
      const mouseX = event.offsetX / this.$refs.canvas.clientWidth * this.video.width
      const mouseY = event.offsetY / this.$refs.canvas.clientHeight * this.video.height
      return [mouseX, mouseY]
    },
    getCurrentObjectAnnotation (mouseX, mouseY) {
      let currentObjectAnnotation
      let index
      let type
      for (let i = 0; i < this.annotationList.length; i++) {
        let objectAnnotation = this.annotationList[i]
        if (!currentObjectAnnotation) {
          if (objectAnnotation.nearTopLeftAnchor(mouseX, mouseY) ||
            objectAnnotation.nearTopRightAnchor(mouseX, mouseY) ||
            objectAnnotation.nearBottomLeftAnchor(mouseX, mouseY) ||
            objectAnnotation.nearBottomRightAnchor(mouseX, mouseY)) {
            type = 'cornerSizing'
            currentObjectAnnotation = objectAnnotation
            index = i
            objectAnnotation.highlight = true
          }
          else if (objectAnnotation.nearTopAnchor(mouseX, mouseY)) {
            type = 'topSizing'
            currentObjectAnnotation = objectAnnotation
            index = i
            objectAnnotation.highlight = true
          }
          else if (objectAnnotation.nearBottomAnchor(mouseX, mouseY)) {
            type = 'bottomSizing'
            currentObjectAnnotation = objectAnnotation
            index = i
            objectAnnotation.highlight = true
          }
          else if (objectAnnotation.nearLeftAnchor(mouseX, mouseY)) {
            type = 'leftSizing'
            currentObjectAnnotation = objectAnnotation
            index = i
            objectAnnotation.highlight = true
          }
          else if (objectAnnotation.nearRightAnchor(mouseX, mouseY)) {
            type = 'rightSizing'
            currentObjectAnnotation = objectAnnotation
            index = i
            objectAnnotation.highlight = true
          }
          else if (objectAnnotation.nearBoundary(mouseX, mouseY)) {
            type = 'moving'
            currentObjectAnnotation = objectAnnotation
            index = i
            objectAnnotation.highlight = true
          }
          else {
            objectAnnotation.highlight = false
          }
        }
        else {
          objectAnnotation.highlight = false
        }
      }
      return [currentObjectAnnotation, index, type]
    },
    getCurrentRegionAnnotation (mouseX, mouseY) {
      let currentRegionAnnotation
      let index
      let type
      let nearPoint
      let nearPointIndex
      for (let i = 0; i < this.annotationList.length; i++) {
        const regionAnnotation = this.annotationList[i]
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
          }
          else {
            regionAnnotation.highlight = false
          }
        }
        else {
          regionAnnotation.highlight = false
        }
      }
      return [currentRegionAnnotation, index, nearPoint, nearPointIndex, type]
    },
    getCurrentSkeletonAnnotation (mouseX, mouseY) {
      let currentSkeletonAnnotation
      let index
      let nearPoint
      let type
      for (let i = 0; i < this.annotationList.length; i++) {
        let skeletonAnnotation = this.annotationList[i]
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
        }
        else {
          skeletonAnnotation.highlight = false
        }
      }
      return [currentSkeletonAnnotation, index, nearPoint, type]
    },
    handleMousemove (event) {
      event.preventDefault()
      const [mouseX, mouseY] = this.getMouseLocation(event)
      if (this.status) {
        this.status.x = mouseX
        this.status.y = mouseY
      }
      else {
        this.status = {
          x: mouseX,
          y: mouseY,
        }
      }
      const statusBaseStyle = {
        position: 'absolute',
        opacity: 0.6,
      }
      if (mouseX > this.video.width / 2 && mouseY > this.video.height / 2) {
        this.statusStyle = {
          ...statusBaseStyle,
          top: '1px',
          left: '1px',
        }
      }
      else {
        this.statusStyle = {
          ...statusBaseStyle,
          bottom: '1px',
          right: '1px',
        }
      }
      if (this.mode === 'object' && this.preference.objects) {
        // creating an object
        if (this.createContext) {
          const activeAnnotation = this.annotationList[this.createContext.index]
          const deltaX = mouseX - this.createContext.mousedownX
          const deltaY = mouseY - this.createContext.mousedownY
          activeAnnotation.resize(
            this.createContext.x,
            this.createContext.y,
            deltaX,
            deltaY,
          )
        }
        // drag the object
        if (this.dragContext) {
          const activeAnnotation = this.annotationList[this.dragContext.index]
          const deltaX = mouseX - this.dragContext.mousedownX
          const deltaY = mouseY - this.dragContext.mousedownY
          if (this.dragContext.type === 'moving') {
            activeAnnotation.resize(
              this.dragContext.x + deltaX,
              this.dragContext.y + deltaY,
            )
          }
          else if (this.dragContext.type === 'cornerSizing') {
            const oppositeAnchor = this.dragContext.oppositeAnchor
            activeAnnotation.resize(
              oppositeAnchor.x,
              oppositeAnchor.y,
              (oppositeAnchor.x > this.dragContext.x ? -this.dragContext.width : this.dragContext.width) + deltaX,
              (oppositeAnchor.y > this.dragContext.y ? -this.dragContext.height : this.dragContext.height) + deltaY,
            )
          }
          else if (this.dragContext.type === 'topSizing') {
            activeAnnotation.resize(
              undefined,
              mouseY,
              undefined,
              this.dragContext.height - deltaY,
            )
          }
          else if (this.dragContext.type === 'bottomSizing') {
            activeAnnotation.resize(
              undefined,
              mouseY > this.dragContext.y ? this.dragContext.y : mouseY,
              undefined,
              mouseY > this.dragContext.y ? this.dragContext.height + deltaY : this.dragContext.y - mouseY,
            )
          }
          else if (this.dragContext.type === 'leftSizing') {
            activeAnnotation.resize(
              mouseX,
              undefined,
              this.dragContext.width - deltaX,
            )
          }
          else if (this.dragContext.type === 'rightSizing') {
            activeAnnotation.resize(
              mouseX > this.dragContext.x ? this.dragContext.x : mouseX,
              undefined,
              mouseX > this.dragContext.x ? this.dragContext.width + deltaX : this.dragContext.x - mouseX,
            )
          }
        }
        // highlight the object
        let found = null
        for (let i = 0; i < this.annotationList.length; i++) {
          const objectAnnotation = this.annotationList[i]
          if (!found && objectAnnotation.nearTopLeftAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'nw-resize'
            objectAnnotation.highlight = true
            found = i
          }
          else if (!found && objectAnnotation.nearTopAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'n-resize'
            objectAnnotation.highlight = true
            found = i
          }
          else if (!found && objectAnnotation.nearTopRightAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'ne-resize'
            objectAnnotation.highlight = true
            found = i
          }
          else if (!found && objectAnnotation.nearLeftAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'w-resize'
            objectAnnotation.highlight = true
            found = i
          }
          else if (!found && objectAnnotation.nearRightAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'e-resize'
            objectAnnotation.highlight = true
            found = i
          }
          else if (!found && objectAnnotation.nearBottomLeftAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'sw-resize'
            objectAnnotation.highlight = true
            found = i
          }
          else if (!found && objectAnnotation.nearBottomAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 's-resize'
            objectAnnotation.highlight = true
            found = i
          }
          else if (!found && objectAnnotation.nearBottomRightAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'se-resize'
            objectAnnotation.highlight = true
            found = i
          }
          else if (!found && objectAnnotation.nearBoundary(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'grab'
            objectAnnotation.highlight = true
            found = i
          }
          else {
            objectAnnotation.highlight = false
          }
        }
        if (typeof (found) === 'number') {
          this.activeContext = {
            index: found,
          }
        }
        else {
          this.activeContext = null
          this.cursor = 'crosshair'
        }
      }
      else if (this.mode === 'region' && this.preference.regions) {
        // creating a region
        if (this.createContext) {
          const activeAnnotation = this.createContext.regionAnnotation
          const lastPoint = activeAnnotation.pointList[activeAnnotation.pointList.length - 1]
          lastPoint.x = mouseX
          lastPoint.y = mouseY
        }
        // drag the region
        if (this.dragContext) {
          const activeAnnotation = this.dragContext.regionAnnotation
          const deltaX = mouseX - this.dragContext.mousedownX
          const deltaY = mouseY - this.dragContext.mousedownY
          this.dragContext.mousedownX = mouseX
          this.dragContext.mousedownY = mouseY
          if (this.dragContext.type === 'moving') {
            activeAnnotation.move(deltaX, deltaY)
          }
          else if (this.dragContext.type === 'sizing') {
            const point = this.dragContext.nearPoint
            point.x = mouseX
            point.y = mouseY
          }
        }
        // highlight the region
        let found = null
        for (let i = 0; i < this.annotationList.length; i++) {
          const regionAnnotation = this.annotationList[i]
          if (!found && regionAnnotation.nearPoints(mouseX, mouseY)) {
            this.cursor = 'move'
            regionAnnotation.highlight = true
            found = i
          }
          else if (!found && regionAnnotation.nearBoundary(mouseX, mouseY)) {
            this.cursor = 'grab'
            regionAnnotation.highlight = true
            found = i
          }
          else {
            regionAnnotation.highlight = false
          }
        }
        if (typeof (found) === 'number') {
          this.activeContext = {
            index: found,
          }
        }
        else {
          this.activeContext = null
          this.cursor = 'crosshair'
        }
      }
      else if (this.mode === 'skeleton' && this.preference.skeletons) {
        // create a skeleton
        if (this.createContext) {
          this.createContext.skeletonAnnotation.ratio =
            Math.sqrt((mouseX - this.createContext.mouseDownX) ** 2 + (mouseY - this.createContext.mouseDownY) ** 2) /
            10
        }
        // drag the skeleton
        if (this.dragContext) {
          const skeletonAnnotation = this.dragContext.skeletonAnnotation
          const deltaX = mouseX - this.dragContext.mousedownX
          const deltaY = mouseY - this.dragContext.mousedownY
          this.dragContext.mousedownX = mouseX
          this.dragContext.mousedownY = mouseY
          if (this.dragContext.type === 'moving') {
            skeletonAnnotation.move(deltaX, deltaY)
          }
          else if (this.dragContext.type === 'sizing') {
            const point = this.dragContext.nearPoint
            point.x = mouseX
            point.y = mouseY
          }
        }
        // highlight the skeleton
        let found = null
        for (let i = 0; i < this.annotationList.length; i++) {
          const skeletonAnnotation = this.annotationList[i]
          let nearPoint
          for (const point of skeletonAnnotation.pointList) {
            if (skeletonAnnotation.nearPoint(mouseX, mouseY, point)) {
              nearPoint = point
              this.status.message = point.name
              break
            }
          }
          if (!found && nearPoint) {
            if (nearPoint.name === 'center') {
              this.cursor = 'grab'
            }
            else {
              this.cursor = 'move'
            }
            skeletonAnnotation.highlight = true
            found = i
          }
          else {
            skeletonAnnotation.highlight = false
          }
        }
        if (typeof (found) === 'number') {
          this.activeContext = {
            index: found,
          }
        }
        else {
          this.status.message = ''
          this.activeContext = null
          this.cursor = 'crosshair'
        }
      }
    },
    handleMousedown (event) {
      this.$refs.canvas.focus()
      event.preventDefault()
      const [mouseX, mouseY] = this.getMouseLocation(event)
      if (this.mode === 'object' && this.preference.objects) {
        // drag
        let found = false
        for (let i = 0; i < this.annotationList.length; i++) {
          let objectAnnotation = this.annotationList[i]
          if (objectAnnotation.highlight) {
            found = true
            if (this.shiftDown) {
              objectAnnotation = objectAnnotation.clone()
              this.annotationList.push(objectAnnotation)
            }
            let type = 'moving'
            if (objectAnnotation.nearTopLeftAnchor(mouseX, mouseY) ||
              objectAnnotation.nearTopRightAnchor(mouseX, mouseY) ||
              objectAnnotation.nearBottomLeftAnchor(mouseX, mouseY) ||
              objectAnnotation.nearBottomRightAnchor(mouseX, mouseY)) {
              type = 'cornerSizing'
            }
            else if (objectAnnotation.nearTopAnchor(mouseX, mouseY)) {
              type = 'topSizing'
            }
            else if (objectAnnotation.nearBottomAnchor(mouseX, mouseY)) {
              type = 'bottomSizing'
            }
            else if (objectAnnotation.nearLeftAnchor(mouseX, mouseY)) {
              type = 'leftSizing'
            }
            else if (objectAnnotation.nearRightAnchor(mouseX, mouseY)) {
              type = 'rightSizing'
            }
            this.dragContext = {
              index: i,
              type: type,
              x: objectAnnotation.x,
              y: objectAnnotation.y,
              width: objectAnnotation.width,
              height: objectAnnotation.height,
              mousedownX: mouseX,
              mousedownY: mouseY,
              oppositeAnchor: type === 'cornerSizing' ? objectAnnotation.oppositeAnchor(mouseX, mouseY) : null,
            }
            break
          }
        }
        // creating an object
        if (!found && !this.createContext) {
          const objectAnnotation = new ObjectAnnotation(mouseX, mouseY, 0, 0)
          this.createContext = {
            index: this.annotationList.length,
            x: objectAnnotation.x,
            y: objectAnnotation.y,
            mousedownX: mouseX,
            mousedownY: mouseY,
          }
          this.annotationList.push(objectAnnotation)
        }
      }
      else if (this.mode === 'region' && this.preference.regions) {
        // drag
        let found = false
        for (let regionAnnotation of this.annotationList) {
          if (regionAnnotation.highlight) {
            found = true
            let nearPoint = null
            for (const point of regionAnnotation.pointList) {
              if (regionAnnotation.nearPoint(mouseX, mouseY, point)) {
                nearPoint = point
                break
              }
            }
            if (this.backspaceDown && nearPoint) {
              if (regionAnnotation.pointList.length <= 3) {
                utils.notify('At least 3 points.')
              }
              else {
                regionAnnotation.pointList.splice(regionAnnotation.pointList.indexOf(nearPoint), 1)
              }
            }
            else if (this.altDown && !nearPoint) {
              let pointIndexList = regionAnnotation.getPointIndexListOfBoundary(mouseX, mouseY)
              const minIndex = Math.min(...pointIndexList)
              const maxIndex = Math.max(...pointIndexList)
              const newPoint = {
                x: mouseX,
                y: mouseY,
              }
              if (minIndex === 0 && maxIndex === regionAnnotation.pointList.length - 1) {
                regionAnnotation.pointList.push(newPoint)
              }
              else {
                regionAnnotation.pointList.splice(minIndex + 1, 0, newPoint)
              }
              this.dragContext = {
                type: 'sizing',
                regionAnnotation: regionAnnotation,
                nearPoint: newPoint,
                mousedownX: mouseX,
                mousedownY: mouseY,
              }
            }
            else {
              if (this.shiftDown && !nearPoint) {
                regionAnnotation = regionAnnotation.clone()
                this.annotationList.push(regionAnnotation)
              }
              this.dragContext = {
                type: nearPoint ? 'sizing' : 'moving',
                regionAnnotation: regionAnnotation,
                nearPoint: nearPoint,
                mousedownX: mouseX,
                mousedownY: mouseY,
              }
            }
            break
          }
        }
        // creating a region
        if (!found && !this.createContext) {
          const regionAnnotation = new RegionAnnotation([
            {
              x: mouseX,
              y: mouseY,
            }])
          this.createContext = {
            regionAnnotation: regionAnnotation,
          }
          this.annotationList.push(regionAnnotation)
        }
      }
      else if (this.mode === 'skeleton' && this.preference.skeletons) {
        // drag
        let found = false
        for (let skeletonAnnotation of this.annotationList) {
          if (skeletonAnnotation.highlight) {
            found = true
            let nearPoint = null
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
            if (this.shiftDown && nearPoint && nearPoint.name === 'center') {
              skeletonAnnotation = skeletonAnnotation.clone()
              this.annotationList.push(skeletonAnnotation)
            }
            this.dragContext = {
              type: nearPoint && nearPoint.name !== 'center' ? 'sizing' : 'moving',
              skeletonAnnotation: skeletonAnnotation,
              nearPoint: nearPoint,
              mousedownX: mouseX,
              mousedownY: mouseY,
            }
            break
          }
        }
        // creating a skeleton
        if (!found && !this.createContext) {
          const skeletonAnnotation = new SkeletonAnnotation(mouseX, mouseY, this.skeletonTypeId)
          this.createContext = {
            skeletonAnnotation: skeletonAnnotation,
            mouseDownX: mouseX,
            mouseDownY: mouseY,
          }
          this.annotationList.push(skeletonAnnotation)
        }
      }
    },
    handleMouseupAndMouseout (event) {
      event.preventDefault()
      const [mouseX, mouseY] = this.getMouseLocation(event)
      if (event.type === 'mouseout') {
        this.status = null
      }
      if (this.mode === 'object' && this.preference.objects) {
        if (this.createContext) {
          const activeAnnotation = this.annotationList[this.createContext.index]
          if (activeAnnotation.width < 8 || activeAnnotation.height < 8) {
            utils.notify('The object is too small. At least 8x8.')
            this.annotationList.splice(this.createContext.index, 1)
          }
          else {
            this.createContext = null
            if (this.showPopup) {
              this.popup = {
                x: event.offsetX,
                y: event.offsetY,
              }
            }
            this.autoFocus()
          }
          this.createContext = null
        }
        if (this.dragContext && event.type === 'mouseup') {
          this.dragContext = null
        }
      }
      else if (this.mode === 'region' && this.preference.regions) {
        if (this.createContext) {
          // handle mouseout
          if (event.type === 'mouseout') {
            this.createContext = null
            return
          }
          const pointList = this.createContext.regionAnnotation.pointList
          // finish
          if (pointList.length >= 3 &&
            (this.createContext.regionAnnotation.nearPoint(mouseX, mouseY, pointList[0]) ||
              this.createContext.regionAnnotation.nearPoint(mouseX, mouseY, pointList[pointList.length - 2])
            )) {
            pointList.pop()
            if (this.showPopup) {
              this.popup = {
                x: event.offsetX,
                y: event.offsetY,
              }
            }
            this.autoFocus()
            this.createContext = null
          }
          else {
            // add new point
            pointList.push({
              x: mouseX,
              y: mouseY,
            })
          }
        }
        if (this.dragContext && event.type === 'mouseup') {
          this.dragContext = null
        }
      }
      else if (this.mode === 'skeleton' && this.preference.skeletons) {
        if (this.createContext) {
          if (this.showPopup) {
            this.popup = {
              x: event.offsetX,
              y: event.offsetY,
            }
          }
          this.autoFocus()
          this.createContext = null
        }
        if (this.dragContext && event.type === 'mouseup') {
          this.dragContext = null
        }
      }
    },
    handleMouseenter (event) {
      event.preventDefault()
      const [mouseX, mouseY] = this.getMouseLocation(event)
      this.status = {
        x: mouseX,
        y: mouseY,
      }
      // if left button of mouse is not pressed when entering the canvas, drag stops
      if (event.buttons !== 1 && this.dragContext) {
        this.dragContext = null
      }
    },
    getTouchLocation (event) {
      let currentTarget = this.$refs.canvas
      let top = 0
      let left = 0
      while (currentTarget !== null) {
        top += currentTarget.offsetTop
        left += currentTarget.offsetLeft
        currentTarget = currentTarget.offsetParent
      }
      const mouseX = (event.touches[0].pageX - left) / this.$refs.canvas.clientWidth * this.video.width
      const mouseY = (event.touches[0].pageY - top) / this.$refs.canvas.clientHeight * this.video.height
      return [mouseX, mouseY]
    },
    handleTouchstart (event) {
      this.$refs.canvas.focus()
      event.preventDefault()
      const [mouseX, mouseY] = this.getTouchLocation(event)
      if (this.mode === 'object' && this.preference.objects) {
        let [objectAnnotation, index, type] = this.getCurrentObjectAnnotation(mouseX, mouseY)
        if (objectAnnotation) {
          if (this.delMode) {
            this.annotationList.splice(index, 1)
          }
          else {
            if (this.copyMode) {
              this.annotationList.push(objectAnnotation.clone())
              type = 'moving'
            }
            this.dragContext = {
              index: index,
              type: type,
              x: objectAnnotation.x,
              y: objectAnnotation.y,
              width: objectAnnotation.width,
              height: objectAnnotation.height,
              mousedownX: mouseX,
              mousedownY: mouseY,
              oppositeAnchor: type === 'cornerSizing' ? objectAnnotation.oppositeAnchor(mouseX, mouseY) : null,
            }
          }
        }
        else if (!this.createContext && !this.delMode && !this.copyMode) {
          const objectAnnotation = new ObjectAnnotation(mouseX, mouseY, 0, 0)
          this.createContext = {
            index: this.annotationList.length,
            x: objectAnnotation.x,
            y: objectAnnotation.y,
            mousedownX: mouseX,
            mousedownY: mouseY,
          }
          objectAnnotation.highlight = true
          this.annotationList.push(objectAnnotation)
        }
      }
      else if (this.mode === 'region' && this.preference.regions) {
        // add point when creating
        if (this.createContext) {
          const pointList = this.createContext.regionAnnotation.pointList
          // finish
          if (pointList.length >= 3 &&
            (this.createContext.regionAnnotation.nearPoint(mouseX, mouseY, pointList[0]) ||
              this.createContext.regionAnnotation.nearPoint(mouseX, mouseY, pointList[pointList.length - 1])
            )) {
            this.$refs.table.focusLast()
            this.createContext.regionAnnotation.highlight = false
            this.createContext = null
          }
          else {
            // add new point
            pointList.push({
              x: mouseX,
              y: mouseY,
            })
          }
          return
        }
        let [regionAnnotation, index, nearPoint, nearPointIndex, type] = this.getCurrentRegionAnnotation(mouseX, mouseY)
        if (regionAnnotation) {
          if (this.delMode) {
            this.annotationList.splice(index, 1)
          }
          else if (this.delPointMode) {
            if (regionAnnotation.pointList.length <= 3) {
              utils.notify('At least 3 points.')
            }
            else {
              regionAnnotation.pointList.splice(nearPointIndex, 1)
            }
          }
          else {
            if (this.copyMode) {
              this.annotationList.push(regionAnnotation.clone())
              type = 'moving'
            }
            else if (this.addPointMode) {
              let pointIndexList = regionAnnotation.getPointIndexListOfBoundary(mouseX, mouseY)
              const minIndex = Math.min(...pointIndexList)
              const maxIndex = Math.max(...pointIndexList)
              nearPoint = {
                x: mouseX,
                y: mouseY,
              }
              if (minIndex === 0 && maxIndex === regionAnnotation.pointList.length - 1) {
                regionAnnotation.pointList.push(nearPoint)
              }
              else {
                regionAnnotation.pointList.splice(minIndex + 1, 0, nearPoint)
              }
              type = 'sizing'
            }
            this.dragContext = {
              type: type,
              regionAnnotation: regionAnnotation,
              nearPoint: nearPoint,
              mousedownX: mouseX,
              mousedownY: mouseY,
            }
          }
        }
        // creating a region
        else if (!this.createContext && !this.delMode && !this.copyMode && !this.addPointMode && !this.delPointMode) {
          const regionAnnotation = new RegionAnnotation([
              {
                x: mouseX,
                y: mouseY,
              },
            ],
          )
          this.createContext = {
            regionAnnotation: regionAnnotation,
          }
          regionAnnotation.highlight = true
          this.annotationList.push(regionAnnotation)
        }
      }
      else if (this.mode === 'skeleton' && this.preference.skeletons) {
        let [skeletonAnnotation, index, nearPoint, type] = this.getCurrentSkeletonAnnotation(mouseX, mouseY)
        if (skeletonAnnotation) {
          if (this.delMode) {
            this.annotationList.splice(index, 1)
          }
          else if (this.indicatingMode) {
            this.status = {
              message: nearPoint.name,
              x: mouseX,
              y: mouseY,
            }
          }
          else if (this.copyMode && nearPoint && nearPoint.name === 'center') {
            skeletonAnnotation.highlight = false
            skeletonAnnotation = skeletonAnnotation.clone()
            skeletonAnnotation.highlight = true
            this.annotationList.push(skeletonAnnotation)
          }
          if (!(this.copyMode || this.delMode || this.indicatingMode) || nearPoint.name === 'center') {
            this.dragContext = {
              type: type,
              skeletonAnnotation: skeletonAnnotation,
              nearPoint: nearPoint,
              mousedownX: mouseX,
              mousedownY: mouseY,
            }
            if (nearPoint && nearPoint.name !== 'center') {
              this.status = {
                message: nearPoint.name,
              }
            }
          }
        }
        // creating a skeleton
        else if (!this.createContext && !this.copyMode && !this.delMode && !this.indicatingMode) {
          const skeletonAnnotation = new SkeletonAnnotation(mouseX, mouseY, this.skeletonTypeId)
          this.createContext = {
            skeletonAnnotation: skeletonAnnotation,
            mouseDownX: mouseX,
            mouseDownY: mouseY,
          }
          skeletonAnnotation.highlight = true
          this.annotationList.push(skeletonAnnotation)
        }
      }
    },
    handleTouchmove (event) {
      event.preventDefault()
      const [mouseX, mouseY] = this.getTouchLocation(event)
      // status
      if (this.status) {
        this.status.x = mouseX
        this.status.y = mouseY
      }
      else {
        this.status = {
          x: mouseX,
          y: mouseY,
        }
      }
      const statusBaseStyle = {
        position: 'absolute',
        opacity: 0.6,
      }
      if (mouseX > this.video.width / 2 && mouseY > this.video.height / 2) {
        this.statusStyle = {
          ...statusBaseStyle,
          top: '1px',
          left: '1px',
        }
      }
      else {
        this.statusStyle = {
          ...statusBaseStyle,
          bottom: '1px',
          right: '1px',
        }
      }
      if (this.mode === 'object' && this.preference.objects) {
        // creating an object
        if (this.createContext) {
          const activeAnnotation = this.annotationList[this.createContext.index]
          const deltaX = mouseX - this.createContext.mousedownX
          const deltaY = mouseY - this.createContext.mousedownY
          activeAnnotation.resize(
            this.createContext.x,
            this.createContext.y,
            deltaX,
            deltaY,
          )
        }
        // drag the object
        if (this.dragContext) {
          const activeAnnotation = this.annotationList[this.dragContext.index]
          const deltaX = mouseX - this.dragContext.mousedownX
          const deltaY = mouseY - this.dragContext.mousedownY
          if (this.dragContext.type === 'moving') {
            activeAnnotation.resize(
              this.dragContext.x + deltaX,
              this.dragContext.y + deltaY,
            )
          }
          else if (this.dragContext.type === 'cornerSizing') {
            const oppositeAnchor = this.dragContext.oppositeAnchor
            activeAnnotation.resize(
              oppositeAnchor.x,
              oppositeAnchor.y,
              (oppositeAnchor.x > this.dragContext.x ? -this.dragContext.width : this.dragContext.width) + deltaX,
              (oppositeAnchor.y > this.dragContext.y ? -this.dragContext.height : this.dragContext.height) + deltaY,
            )
          }
          else if (this.dragContext.type === 'topSizing') {
            activeAnnotation.resize(
              undefined,
              mouseY,
              undefined,
              this.dragContext.height - deltaY)
          }
          else if (this.dragContext.type === 'bottomSizing') {
            activeAnnotation.resize(
              undefined,
              mouseY > this.dragContext.y ? undefined : mouseY,
              undefined,
              mouseY > this.dragContext.y ? this.dragContext.height + deltaY : this.dragContext.y - mouseY)
          }
          else if (this.dragContext.type === 'leftSizing') {
            activeAnnotation.resize(
              mouseX,
              undefined,
              this.dragContext.width - deltaX)
          }
          else if (this.dragContext.type === 'rightSizing') {
            activeAnnotation.resize(
              mouseX > this.dragContext.x ? undefined : mouseX,
              undefined,
              mouseX > this.dragContext.x ? this.dragContext.width + deltaX : this.dragContext.x - mouseX)
          }
        }
      }
      else if (this.mode === 'region' && this.preference.regions) {
        if (this.dragContext) {
          const activeAnnotation = this.dragContext.regionAnnotation
          const deltaX = mouseX - this.dragContext.mousedownX
          const deltaY = mouseY - this.dragContext.mousedownY
          this.dragContext.mousedownX = mouseX
          this.dragContext.mousedownY = mouseY
          if (this.dragContext.type === 'moving') {
            activeAnnotation.move(deltaX, deltaY)
          }
          else if (this.dragContext.type === 'sizing') {
            const point = this.dragContext.nearPoint
            point.x = mouseX
            point.y = mouseY
          }
        }
      }
      else if (this.mode === 'skeleton' && this.preference.skeletons) {
        // create a skeleton
        if (this.createContext) {
          this.createContext.skeletonAnnotation.ratio =
            Math.sqrt((mouseX - this.createContext.mouseDownX) ** 2 + (mouseY - this.createContext.mouseDownY) ** 2) /
            10
        }
        if (this.dragContext) {
          const skeletonAnnotation = this.dragContext.skeletonAnnotation
          const deltaX = mouseX - this.dragContext.mousedownX
          const deltaY = mouseY - this.dragContext.mousedownY
          this.dragContext.mousedownX = mouseX
          this.dragContext.mousedownY = mouseY
          if (this.dragContext.type === 'moving') {
            skeletonAnnotation.move(deltaX, deltaY)
          }
          else if (this.dragContext.type === 'sizing') {
            const point = this.dragContext.nearPoint
            point.x = mouseX
            point.y = mouseY
          }
        }
      }
    },
    handleTouchend (event) {
      event.preventDefault()
      // status
      this.status = null
      if (this.mode === 'object' && this.preference.objects) {
        if (this.createContext) {
          const activeAnnotation = this.annotationList[this.createContext.index]
          activeAnnotation.highlight = false
          if (activeAnnotation.width < 8 || activeAnnotation.height < 8) {
            utils.notify('The object is too small. At least 8x8.')
            this.annotationList.splice(this.createContext.index, 1)
          }
          else {
            this.createContext = null
            this.$refs.table.focusLast()
          }
          this.createContext = null
        }
        if (this.dragContext) {
          this.annotationList[this.dragContext.index].highlight = false
          this.dragContext = null
        }
      }
      else if (this.mode === 'region' && this.preference.objects) {
        if (this.dragContext) {
          this.dragContext.regionAnnotation.highlight = false
          this.dragContext = null
        }
      }
      else if (this.mode === 'skeleton' && this.preference.objects) {
        if (this.createContext) {
          this.$refs.table.focusLast()
          this.createContext.skeletonAnnotation.highlight = false
          this.createContext = null
        }
        if (this.dragContext) {
          this.dragContext.skeletonAnnotation.highlight = false
          this.dragContext = null
        }
      }
    },
    handleSelectInput (value) {
      const label = this.objectLabelData.find(label => label.id === value)
      this.annotationList[this.annotationList.length - 1].color = label.color
    },
    handlePopupShow () {
      if (this.$refs.select) {
        this.$refs.select.showPopup()
      }
      else if (this.$refs.input) {
        this.$refs.input.focus()
      }
    },
    autoFocus () {
      if (this.showPopup) {
        this.$refs.popup.show()
      }
      else {
        this.$refs.table.focusLast() // most of the time, this will impact focus on the canvas
      }
    },
    draw () {
      if (this.preference.objects) {
        if (!this.objectAnnotationList) {
          this.objectAnnotationList = []
        }
        else {
          for (let annotation of this.objectAnnotationList) {
            annotation.draw(this.ctx)
          }
        }
      }
      if (this.preference.regions) {
        if (!this.regionAnnotationList) {
          this.regionAnnotationList = []
        }
        else {
          for (let annotation of this.regionAnnotationList) {
            annotation.draw(this.ctx)
          }
        }
      }
      if (this.preference.skeletons) {
        if (!this.skeletonAnnotationList) {
          this.skeletonAnnotationList = []
        }
        else {
          for (let annotation of this.skeletonAnnotationList) {
            annotation.draw(this.ctx)
          }
        }
      }
    },
    clear () {
      this.ctx.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height)
    },
    handleKeyup (event) {
      if (event.target.nodeName.toLowerCase() === 'input') { // see: https://github.com/anucvml/vidat/issues/91
        return false
      }
      else if (event.code === 'Delete') {
        if (this.activeContext) {
          this.annotationList.splice(this.activeContext.index, 1)
        }
      }
      else if (event.code === 'Escape') {
        if (this.createContext) {
          this.activeContext = null
          this.createContext = null
          this.annotationList.pop()
        }
      }
      else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        this.shiftDown = false
        if (this.status) this.status.keydown = null
      }
      else if (this.mode === 'region' && event.code === 'Backspace') {
        if (this.status) this.status.keydown = null
        this.backspaceDown = false
      }
      else if (this.mode === 'region' && (event.code === 'AltLeft' || event.code === 'AltRight')) {
        if (this.status) this.status.keydown = null
        this.altDown = false
      }
    },
    handleKeydown (event) {
      if (event.target.nodeName.toLowerCase() === 'input') {
        return false
      }
      else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        this.shiftDown = true
        if (this.status) this.status.keydown = 'copy'
      }
      else if (this.mode === 'region' && event.code === 'Backspace') {
        this.backspaceDown = true
        if (this.status) this.status.keydown = 'delete'
      }
      else if (this.mode === 'region' && (event.code === 'AltLeft' || event.code === 'AltRight')) {
        this.altDown = true
        if (this.status) this.status.keydown = 'add'
      }
    },
  },
  mounted () {
    this.ctx = this.$refs.canvas.getContext('2d')
    this.$watch(
      function () {
        return eval('this.$store.state.annotation.' + this.mode + 'AnnotationListMap[this.currentFrame]')
      },
      function () {
        this.clear()
        this.draw()
      },
      {
        immediate: true,
        deep: true,
      },
    )
    window.addEventListener('keyup', this.handleKeyup)
    window.addEventListener('keydown', this.handleKeydown)
  },
  destroyed () {
    window.removeEventListener('keyup', this.handleKeyup)
    window.removeEventListener('keydown', this.handleKeydown)
  },
  computed: {
    zoom () {
      return this.$store.state.annotation.zoom
    },
    skeletonTypeId () {
      return this.$store.state.annotation.skeletonTypeId
    },
    video () {
      return this.$store.state.annotation.video
    },
    currentFrame: {
      get () {
        return eval('this.$store.state.annotation.' + this.position + 'CurrentFrame')
      },
      set (value) {
        this.$store.commit('set' + this.position.slice(0, 1).toUpperCase() + this.position.slice(1) + 'CurrentFrame',
          value)
      },
    },
    cachedFrameList () {
      return this.$store.state.annotation.cachedFrameList
    },
    grayscale () {
      return this.$store.state.settings.grayscale
    },
    showPopup () {
      return this.$store.state.settings.showPopup
    },
    mode () {
      return this.$store.state.annotation.mode
    },
    delMode () {
      return this.$store.state.delMode
    },
    copyMode () {
      return this.$store.state.copyMode
    },
    addPointMode () {
      return this.$store.state.addPointMode
    },
    delPointMode () {
      return this.$store.state.delPointMode
    },
    indicatingMode () {
      return this.$store.state.indicatingMode
    },
    annotationList: {
      get () {
        return eval('this.$store.state.annotation.' + this.mode + 'AnnotationListMap[this.currentFrame]')
      },
      set (value) {
        this.setAnnotationList({
          index: this.currentFrame,
          mode: this.mode,
          annotationList: value,
        })
      },
    },
    objectAnnotationList: {
      get () {
        return eval('this.$store.state.annotation.objectAnnotationListMap[this.currentFrame]')
      },
      set (value) {
        this.setAnnotationList({
          index: this.currentFrame,
          mode: 'object',
          annotationList: value,
        })
      },
    },
    regionAnnotationList: {
      get () {
        return eval('this.$store.state.annotation.regionAnnotationListMap[this.currentFrame]')
      },
      set (value) {
        this.setAnnotationList({
          index: this.currentFrame,
          mode: 'region',
          annotationList: value,
        })
      },
    },
    skeletonAnnotationList: {
      get () {
        return eval('this.$store.state.annotation.skeletonAnnotationListMap[this.currentFrame]')
      },
      set (value) {
        this.setAnnotationList({
          index: this.currentFrame,
          mode: 'skeleton',
          annotationList: value,
        })
      },
    },
    preference () {
      return this.$store.state.settings.preferenceData
    },
    objectLabelData () {
      return this.$store.state.settings.objectLabelData
    },
    actionLabelData () {
      return this.$store.state.settings.actionLabelData
    },
    actionList () {
      const actionAnnotationList = this.$store.state.annotation.actionAnnotationList
      let actionList = []
      let id = 0
      for (const actionAnnotation of actionAnnotationList) {
        if (this.currentFrame >= utils.time2index(actionAnnotation.start) &&
          this.currentFrame <= utils.time2index(actionAnnotation.end)) {
          actionList.push({
              id: id,
              text: `${this.actionLabelData[actionAnnotation.action].name} ${actionAnnotation.object === 0
                ? ''
                : this.objectLabelData[actionAnnotation.object].name}`,
              color: actionAnnotation.color,
            },
          )
          id += 1
        }
      }
      return actionList
    },
    labelOption () {
      const objectLabelData = this.$store.state.settings.objectLabelData
      let labelOption = []
      for (let objectLabel of objectLabelData) {
        labelOption.push({
          label: objectLabel.name,
          value: objectLabel.id,
          color: objectLabel.color,
        })
      }
      return labelOption
    },
  },
  filters: {
    'toFixed2': utils.toFixed2,
  },
  template: VIDEO_PANEL_TEMPLATE,
}
