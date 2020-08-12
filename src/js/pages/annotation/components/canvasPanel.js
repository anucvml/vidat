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
        :style="{display: 'block', position: 'relative', top: 0, cursor: getCursor()}"
        class="full-width"
        :height="video.height"
        :width="video.width"
        @mousemove="handleMousemove"
        @mouseout="handleMouseupAndMouseout"
        @mousedown="handleMousedown"
        @mouseup="handleMouseupAndMouseout"
        @keyup="handleKeyup"
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
      :position="position"
      v-if="mode === 'object' && preference.objects"
    ></object-table>
    <region-table
      :position="position"
      v-if="mode === 'region' && preference.regions"
    ></region-table>
  </div>
`

import filmStrip from './filmStrip.js'
import objectTable from './objectTable.js'
import regionTable from './regionTable.js'
import utils from '../../../libs/utils.js'
import { ObjectAnnotation, RegionAnnotation } from '../../../libs/annotationlib.js'

export default {
  props: ['position'],
  components: {
    filmStrip,
    objectTable,
    regionTable,
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
          } else if (this.dragContext.type === 'sizing') {
            const oppositeAnchor = this.dragContext.oppositeAnchor
            activeAnnotation.resize(
              oppositeAnchor.x,
              oppositeAnchor.y,
              (oppositeAnchor.x > this.dragContext.x ? -this.dragContext.width : this.dragContext.width) + deltaX,
              (oppositeAnchor.y > this.dragContext.y ? -this.dragContext.height : this.dragContext.height) + deltaY,
            )
          } else {
            throw 'Unknown drag type'
          }
        }
        // highlight the object
        let found = null
        for (let i = 0; i < this.annotationList.length; i++) {
          const objectAnnotation = this.annotationList[i]
          if (
            !found &&
            (objectAnnotation.nearBoundary(mouseX, mouseY) ||
              objectAnnotation.nearAnchor(mouseX, mouseY)
            )
          ) {
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
          if (!found && regionAnnotation.nearPoints(mouseX, mouseY) || regionAnnotation.nearBoundary(mouseX, mouseY)) {
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
        }
      } else if (this.mode === 'skeleton') {
      } else {
        throw 'Unknown mode: ' + this.mode
      }
    },
    handleMousedown (event) {
      const [mouseX, mouseY] = this.getMouseLocation(event)
      if (this.mode === 'object') {
        let found = false
        for (let i = 0; i < this.annotationList.length; i++) {
          const objectAnnotation = this.annotationList[i]
          if (objectAnnotation.highlight) {
            found = true
            this.dragContext = {
              index: i,
              type: objectAnnotation.nearBoundary(mouseX, mouseY) ? 'moving' : 'sizing',
              x: objectAnnotation.x,
              y: objectAnnotation.y,
              width: objectAnnotation.width,
              height: objectAnnotation.height,
              mousedownX: mouseX,
              mousedownY: mouseY,
              oppositeAnchor: objectAnnotation.oppositeAnchor(mouseX, mouseY),
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
        let found = false
        for (const regionAnnotation of this.annotationList) {
          if (regionAnnotation.highlight) {
            found = true
            let nearPoint = null
            for (const point of regionAnnotation.pointList) {
              if (RegionAnnotation.nearPoint(mouseX, mouseY, point)) {
                nearPoint = point
                break
              }
            }
            this.dragContext = {
              type: nearPoint ? 'sizing' : 'moving',
              regionAnnotation: regionAnnotation,
              nearPoint: nearPoint,
              mousedownX: mouseX,
              mousedownY: mouseY,
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
      } else {
        throw 'Unknown mode: ' + this.mode
      }
    },
    handleMouseupAndMouseout (event) {
      const [mouseX, mouseY] = this.getMouseLocation(event)
      if (this.mode === 'object') {
        // creating an object
        if (this.createContext) {
          const activeAnnotation = this.annotationList[this.createContext.index]
          if (activeAnnotation.width < 8 || activeAnnotation.height < 8) {
            utils.notify('The object is too small. At least 8x8.')
            this.annotationList.splice(this.createContext.index, 1)
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

      } else {
        throw 'Unknown mode: ' + this.mode
      }
    },
    handleKeyup (event) {
      console.log(event)
    },
    getCursor () {
      if (this.dragContext) {
        if (this.dragContext.type === 'moving') {
          return 'move'
        } else if (this.dragContext.type === 'sizing') {
          return 'move'
        }
      } else if (this.activeContext) {
        return 'pointer'
      } else {
        return 'crosshair'
      }
    },
    draw (annotationList) {
      if (!annotationList) {
        this.annotationList = []
      } else {
        for (let annotation of annotationList) {
          annotation.draw(this.ctx)
        }
      }
    },
    clear () {
      this.ctx.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height)
    },
  },
  mounted () {
    this.ctx = this.$refs.canvas.getContext('2d')
    this.backgroundCtx = this.$refs.background.getContext('2d')
    this.$watch(
      function () {
        return eval('this.$store.state.annotation.' + this.mode + 'AnnotationListMap[this.currentFrame]')
      },
      function (newValue) {
        this.clear()
        this.draw(newValue)
      },
      {
        immediate: true,
        deep: true,
      },
    )
    document.addEventListener('keyup', event => {
      if (event.keyCode === 0x2E) { // delete
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
      }
    })
  },
  computed: {
    zoom () {
      return this.$store.state.annotation.zoom
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
      return this.$store.state.annotation.lockSliders
    },
    lockSlidersDistance () {
      return this.$store.state.annotation.lockSlidersDistance
    },
    grayscale () {
      return this.$store.state.annotation.grayscale
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
              text: `${this.actionLabelData[actionAnnotation.action].name} ${this.objectLabelData[actionAnnotation.object].name}`,
              color: this.actionLabelData[actionAnnotation.action].color,
            },
          )
          id += 1
        }
      }
      return actionList
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
