const VIDEO_PANEL_TEMPLATE = `
  <div>
    <film-strip></film-strip>
    <div style="position: relative;">
      <canvas
        ref="background"
        style="display: block; position: absolute;"
        :class="['full-width', {'grayscale': grayscale}]"
        :height="video.height"
        :width="video.width"
      ></canvas>
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
        :style="{display: 'block', position: 'relative', top: 0, cursor: cursor}"
        class="full-width"
        :height="video.height"
        :width="video.width"
        @mousemove="handleMousemove"
        @mouseout="handleMouseupAndMouseout"
        @mousedown="handleMousedown"
        @mouseup="handleMouseupAndMouseout"
        @mouseenter="handleMouseenter"
      ></canvas>
      <img
        ref="img"
        :src="cachedFrameList[currentFrame]"
        style="display: none"
        @load="handleLoad"
      >
      <q-btn
        v-if="position === 'left'"
        class="bg-white"
        style="position: absolute; top: 5px; right: 5px;"
        round
        @click="$store.commit('setZoom', !zoom)"
        :icon="zoom ? 'zoom_out' : 'zoom_in'"
      ></q-btn>
      <q-badge v-if="preference.actions && status" style="position: absolute; bottom: 1px; right: 1px; opacity: 0.6;">
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
          <q-btn dense falt class="full-width q-mt-sm" @click="$refs.popup.hide()" color="primary">Confirm</q-btn>
        </q-popup-edit>
      </div>
    </div>
    <film-strip></film-strip>
    <q-toolbar class="q-pa-none">
      <q-btn-group flat>
        <q-btn dense @click="handlePlayPause" :icon="playTimeInterval ? 'pause' : 'play_arrow'"></q-btn>
        <q-btn dense @click="handleStop" icon="stop"></q-btn>
      </q-btn-group>
      <q-slider
        ref="slider"
        class="q-mx-sm"
        v-model="currentFrame"
        :min="0"
        :max="video.frames"
        :step="1"
        label
      ></q-slider>
      <q-space></q-space>
      <q-badge class="q-mr-xs">
        {{ utils.index2time(this.currentFrame) | toFixed2 }} / {{ video.duration | toFixed2 }} s
      </q-badge>
    </q-toolbar>
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
import { ObjectAnnotation, RegionAnnotation, SkeletonAnnotation } from '../../../libs/annotationlib.js'

export default {
  props: ['position'],
  components: {
    filmStrip,
    objectTable,
    regionTable,
    skeletonTable,
  },
  data: () => {
    return {
      ctx: null,
      backgroundCtx: null,
      utils,
      createContext: null,
      dragContext: null,
      activeContext: null,
      playTimeInterval: null,
      popup: { x: 0, y: 0 },
      shiftDown: false,
      backspaceDown: false,
      altDown: false,
      status: null,
      cursor: 'crosshair',
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setAnnotationList',
    ]),
    handleLoad () {
      this.backgroundCtx.drawImage(this.$refs.img, 0, 0, this.video.width, this.video.height)
    },
    handlePlayPause () {
      if (!this.playTimeInterval) {
        if (this.currentFrame === this.video.frames) {
          this.currentFrame = 0
        }
        this.playTimeInterval = setInterval(
          () => {
            if (this.currentFrame === this.video.frames) {
              clearInterval(this.playTimeInterval)
              this.playTimeInterval = null
            } else {
              this.currentFrame = this.currentFrame + 1
            }
          },
          1000 / this.video.fps,
        )
      } else {
        clearInterval(this.playTimeInterval)
        this.playTimeInterval = null
      }
    },
    handleStop () {
      if (this.playTimeInterval) {
        clearInterval(this.playTimeInterval)
        this.playTimeInterval = null
      }
      this.currentFrame = 0
    },
    getMouseLocation (event) {
      const mouseX = event.offsetX / this.$refs.canvas.clientWidth * this.video.width
      const mouseY = event.offsetY / this.$refs.canvas.clientHeight * this.video.height
      return [mouseX, mouseY]
    },
    handleMousemove (event) {
      const [mouseX, mouseY] = this.getMouseLocation(event)
      if (this.status) {
        this.status.x = mouseX
        this.status.y = mouseY
      } else {
        this.status = {
          x: mouseX,
          y: mouseY,
        }
      }
      if (this.mode === 'object') {
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
          } else if (this.dragContext.type === 'cornerSizing') {
            const oppositeAnchor = this.dragContext.oppositeAnchor
            activeAnnotation.resize(
              oppositeAnchor.x,
              oppositeAnchor.y,
              (oppositeAnchor.x > this.dragContext.x ? -this.dragContext.width : this.dragContext.width) + deltaX,
              (oppositeAnchor.y > this.dragContext.y ? -this.dragContext.height : this.dragContext.height) + deltaY,
            )
          } else if (this.dragContext.type === 'topSizing') {
            activeAnnotation.resize(
              undefined,
              mouseY,
              undefined,
              this.dragContext.height - deltaY)
          } else if (this.dragContext.type === 'bottomSizing') {
            activeAnnotation.resize(
              undefined,
              mouseY > this.dragContext.y ? undefined : mouseY,
              undefined,
              mouseY > this.dragContext.y ? this.dragContext.height + deltaY : this.dragContext.y - mouseY)
          } else if (this.dragContext.type === 'leftSizing') {
            activeAnnotation.resize(
              mouseX,
              undefined,
              this.dragContext.width - deltaX)
          } else if (this.dragContext.type === 'rightSizing') {
            activeAnnotation.resize(
              mouseX > this.dragContext.x ? undefined : mouseX,
              undefined,
              mouseX > this.dragContext.x ? this.dragContext.width + deltaX : this.dragContext.x - mouseX)
          } else {
            throw 'Unknown drag type'
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
          } else if (!found && objectAnnotation.nearTopAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'n-resize'
            objectAnnotation.highlight = true
            found = i
          } else if (!found && objectAnnotation.nearTopRightAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'ne-resize'
            objectAnnotation.highlight = true
            found = i
          } else if (!found && objectAnnotation.nearLeftAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'w-resize'
            objectAnnotation.highlight = true
            found = i
          } else if (!found && objectAnnotation.nearRightAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'e-resize'
            objectAnnotation.highlight = true
            found = i
          } else if (!found && objectAnnotation.nearBottomLeftAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'sw-resize'
            objectAnnotation.highlight = true
            found = i
          } else if (!found && objectAnnotation.nearBottomAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 's-resize'
            objectAnnotation.highlight = true
            found = i
          } else if (!found && objectAnnotation.nearBottomRightAnchor(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'se-resize'
            objectAnnotation.highlight = true
            found = i
          } else if (!found && objectAnnotation.nearBoundary(mouseX, mouseY)) {
            if (!this.dragContext) this.cursor = 'grab'
            objectAnnotation.highlight = true
            found = i
          } else {
            objectAnnotation.highlight = false
          }
        }
        if (typeof (found) === 'number') {
          this.activeContext = {
            index: found,
          }
        } else {
          this.activeContext = null
          this.cursor = 'crosshair'
        }
      } else if (this.mode === 'region') {
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
          } else if (this.dragContext.type === 'sizing') {
            const point = this.dragContext.nearPoint
            point.x = mouseX
            point.y = mouseY
          } else {
            throw 'Unknown drag type'
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
          } else if (!found && regionAnnotation.nearBoundary(mouseX, mouseY)) {
            this.cursor = 'grab'
            regionAnnotation.highlight = true
            found = i
          } else {
            regionAnnotation.highlight = false
          }
        }
        if (typeof (found) === 'number') {
          this.activeContext = {
            index: found,
          }
        } else {
          this.activeContext = null
          this.cursor = 'crosshair'
        }
      } else if (this.mode === 'skeleton') {
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
          } else if (this.dragContext.type === 'sizing') {
            const point = this.dragContext.nearPoint
            point.x = mouseX
            point.y = mouseY
          } else {
            throw 'Unknown drag type'
          }
        }
        // highlight the skeleton
        let found = null
        for (let i = 0; i < this.annotationList.length; i++) {
          const skeletonAnnotation = this.annotationList[i]
          let nearPoint
          for (const point of skeletonAnnotation.pointList) {
            if (SkeletonAnnotation.nearPoint(mouseX, mouseY, point)) {
              nearPoint = point
              this.status.message = point.name
              break
            }
          }
          if (!found && nearPoint) {
            if (nearPoint.name === 'center') {
              this.cursor = 'grab'
            } else {
              this.cursor = 'move'
            }
            skeletonAnnotation.highlight = true
            found = i
          } else {
            skeletonAnnotation.highlight = false
          }
        }
        if (typeof (found) === 'number') {
          this.activeContext = {
            index: found,
          }
        } else {
          this.status.message = ''
          this.activeContext = null
          this.cursor = 'crosshair'
        }
      } else {
        throw 'Unknown mode: ' + this.mode
      }
    },
    handleMousedown (event) {
      const [mouseX, mouseY] = this.getMouseLocation(event)
      if (this.mode === 'object') {
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
            } else if (objectAnnotation.nearTopAnchor(mouseX, mouseY)) {
              type = 'topSizing'
            } else if (objectAnnotation.nearBottomAnchor(mouseX, mouseY)) {
              type = 'bottomSizing'
            } else if (objectAnnotation.nearLeftAnchor(mouseX, mouseY)) {
              type = 'leftSizing'
            } else if (objectAnnotation.nearRightAnchor(mouseX, mouseY)) {
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
      } else if (this.mode === 'region') {
        // drag
        let found = false
        for (let regionAnnotation of this.annotationList) {
          if (regionAnnotation.highlight) {
            found = true
            let nearPoint = null
            for (const point of regionAnnotation.pointList) {
              if (RegionAnnotation.nearPoint(mouseX, mouseY, point)) {
                nearPoint = point
                break
              }
            }
            if (this.backspaceDown && nearPoint) {
              if (regionAnnotation.pointList.length <= 3) {
                utils.notify('At least 3 points.')
              } else {
                regionAnnotation.pointList.splice(regionAnnotation.pointList.indexOf(nearPoint), 1)
              }
            } else if (this.altDown && !nearPoint) {
              let pointIndexList = regionAnnotation.getPointIndexListOfBoundary(mouseX, mouseY)
              const minIndex = Math.min(...pointIndexList)
              const maxIndex = Math.max(...pointIndexList)
              if (minIndex === 0 && maxIndex === regionAnnotation.pointList.length - 1) {
                regionAnnotation.pointList.push({
                  x: mouseX,
                  y: mouseY,
                })
              } else {
                console.log(minIndex, maxIndex)
                regionAnnotation.pointList.splice(minIndex + 1, 0, {
                  x: mouseX,
                  y: mouseY,
                })
              }
            } else {
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
          const regionAnnotation = new RegionAnnotation([{ x: mouseX, y: mouseY }])
          this.createContext = {
            regionAnnotation: regionAnnotation,
          }
          this.annotationList.push(regionAnnotation)
        }
      } else if (this.mode === 'skeleton') {
        // drag
        let found = false
        for (let skeletonAnnotation of this.annotationList) {
          if (skeletonAnnotation.highlight) {
            found = true
            let nearPoint = null
            // special order, see: https://github.com/anucvml/vidat/issues/69
            for (let i = 1; i < skeletonAnnotation.pointList.length; i++) {
              const point = skeletonAnnotation.pointList[i]
              if (SkeletonAnnotation.nearPoint(mouseX, mouseY, point)) {
                nearPoint = point
                break
              }
            }
            const centerPoint = skeletonAnnotation.pointList[0]
            if (!nearPoint && SkeletonAnnotation.nearPoint(mouseX, mouseY, centerPoint)) nearPoint = centerPoint
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
      } else {
        throw 'Unknown mode: ' + this.mode
      }
    },
    handleMouseupAndMouseout (event) {
      const [mouseX, mouseY] = this.getMouseLocation(event)
      if (event.type === 'mouseout') {
        this.status = null
      }
      if (this.mode === 'object') {
        if (this.createContext) {
          const activeAnnotation = this.annotationList[this.createContext.index]
          if (activeAnnotation.width < 8 || activeAnnotation.height < 8) {
            utils.notify('The object is too small. At least 8x8.')
            this.annotationList.splice(this.createContext.index, 1)
          } else {
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
        if (this.dragContext) {
          this.dragContext = null
        }
      } else if (this.mode === 'region') {
        if (this.createContext) {
          // handle mouseout
          if (event.type === 'mouseout') {
            this.createContext = null
            return
          }
          const pointList = this.createContext.regionAnnotation.pointList
          // finish
          if (pointList.length >= 3 &&
            (RegionAnnotation.nearPoint(mouseX, mouseY, pointList[0]) ||
              RegionAnnotation.nearPoint(mouseX, mouseY, pointList[pointList.length - 2])
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
          } else {
            // add new point
            pointList.push({
              x: mouseX,
              y: mouseY,
            })
          }
        }
        if (this.dragContext) {
          this.dragContext = null
        }
      } else if (this.mode === 'skeleton') {
        if (this.createContext) {
          this.createContext = null
          if (this.showPopup) {
            this.popup = {
              x: event.offsetX,
              y: event.offsetY,
            }
          }
          this.autoFocus()
          this.createContext = null
        }
        if (this.dragContext) {
          this.dragContext = null
        }
      } else {
        throw 'Unknown mode: ' + this.mode
      }
    },
    handleMouseenter (event) {
      const [mouseX, mouseY] = this.getMouseLocation(event)
      this.status = {
        x: mouseX,
        y: mouseY,
      }
    },
    handleSelectInput (value) {
      const label = this.objectLabelData.find(label => label.id === value)
      this.annotationList[this.annotationList.length - 1].color = label.color
    },
    handlePopupShow () {
      if (this.$refs.select) {
        this.$refs.select.showPopup()
      } else if (this.$refs.input) {
        this.$refs.input.focus()
      }
    },
    autoFocus () {
      if (this.showPopup) {
        this.$refs.popup.show()
      } else {
        this.$refs.table.focusLast()
      }
    },
    draw () {
      if (this.preference.objects) {
        if (!this.objectAnnotationList) {
          this.objectAnnotationList = []
        } else {
          for (let annotation of this.objectAnnotationList) {
            annotation.draw(this.ctx)
          }
        }
      }
      if (this.preference.regions) {
        if (!this.regionAnnotationList) {
          this.regionAnnotationList = []
        } else {
          for (let annotation of this.regionAnnotationList) {
            annotation.draw(this.ctx)
          }
        }
      }
      if (this.preference.skeletons) {
        if (!this.skeletonAnnotationList) {
          this.skeletonAnnotationList = []
        } else {
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
      if (event.target.nodeName.toLowerCase() === 'input') {
        return false
      } else if (event.keyCode === 0x2E) { // delete
        if (this.activeContext) {
          this.annotationList.splice(this.activeContext.index, 1)
        }
      } else if (event.keyCode === 0x1B) { // Esc
        if (this.createContext) {
          this.activeContext = null
          this.createContext = null
          this.annotationList.pop()
        }
      } else if (event.keyCode === 0xDB) { // [, {
        if (this.position === 'left') {
          this.$refs.slider.__focus()
        }
      } else if (event.keyCode === 0xDD) { // ], }
        if (this.position === 'right') {
          this.$refs.slider.__focus()
        }
      } else if (event.keyCode === 0x50) { // p
        if (this.position === 'left') this.handlePlayPause()
      } else if (event.keyCode === 0x10) { // shift
        this.shiftDown = false
        if (this.status) this.status.keydown = null
      } else if (this.mode === 'region' && event.keyCode === 0x08) { // backspace
        if (this.status) this.status.keydown = null
        this.backspaceDown = false
      } else if (this.mode === 'region' && event.keyCode === 0x12) { // alt
        if (this.status) this.status.keydown = null
        this.altDown = false
      }
    },
    handleKeydown (event) {
      if (event.target.nodeName.toLowerCase() === 'input') {
        return false
      } else if (event.keyCode === 0x10) { // shift
        this.shiftDown = true
        if (this.status) this.status.keydown = 'copy'
      } else if (this.mode === 'region' && event.keyCode === 0x08) { // backspace
        this.backspaceDown = true
        if (this.status) this.status.keydown = 'delete'
      } else if (this.mode === 'region' && event.keyCode === 0x12) { // alt
        this.altDown = true
        if (this.status) this.status.keydown = 'add'
      }
    },
  },
  mounted () {
    this.ctx = this.$refs.canvas.getContext('2d')
    this.backgroundCtx = this.$refs.background.getContext('2d')
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
    document.addEventListener('keyup', this.handleKeyup)
    document.addEventListener('keydown', this.handleKeydown)
  },
  destroyed () {
    document.removeEventListener('keyup', this.handleKeyup)
    document.removeEventListener('keydown', this.handleKeydown)
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
        if (this.lockSliders) {
          const otherPosition = {
            'left': 'Right',
            'right': 'Left',
          }[this.position]
          let otherNextFrame = 0
          if (this.position === 'left') {
            otherNextFrame = value + this.lockSlidersDistance
          } else if (this.position === 'right') {
            otherNextFrame = value - this.lockSlidersDistance
          }
          if (otherNextFrame <= 0) {
            this.$store.commit(
              'set' + otherPosition + 'CurrentFrame', 0)
          } else if (otherNextFrame >= this.video.frames) {
            this.$store.commit(
              'set' + otherPosition + 'CurrentFrame', this.video.frames)
          } else {
            this.$store.commit(
              'set' + otherPosition + 'CurrentFrame', otherNextFrame)
          }
        }
        this.$store.commit('set' + this.position.slice(0, 1).toUpperCase() + this.position.slice(1) + 'CurrentFrame',
          value)
      },
    },
    cachedFrameList () {
      return this.$store.state.annotation.cachedFrameList
    },
    lockSliders () {
      return this.$store.state.settings.lockSliders
    },
    lockSlidersDistance () {
      return this.$store.state.settings.lockSlidersDistance
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
    'toFixed2': function (value) {
      if (value) {
        return value.toFixed(2)
      } else {
        return '0.00'
      }
    },
  },
  template: VIDEO_PANEL_TEMPLATE,
}
