const VIDEO_PANEL_TEMPLATE = `
  <div>
    <film-strip></film-strip>
    <div style="position: relative;">
      <video
        preload="auto"
        ref="video"
        :class="['full-width', { 'grayscale': grayscale }]"
        style="display: block;"
        :src="video.src"
        @loadeddata="handleLoadeddata"
      ></video>
      <canvas
        ref="canvas"
        class="full-width"
        style="display: block; position: absolute; top: 0;"
        :height="video.height"
        :width="video.width"
      ></canvas>
    </div>
    <film-strip></film-strip>
    <div class="q-px-md">
      <q-slider
        v-model="currentFrame"
        :min="0"
        :max="269"
        :step="1"
        label
      />
      <q-badge class="float-right">
        {{ utils.index2time(this.currentFrame) | toFixed2 }} / {{ video.duration | toFixed2 }} s
      </q-badge>
    </div>
  </div>
`

import filmStrip from './filmStrip.js'
import utils from '../libs/utils.js'

export default {
  props: ['position'],
  components: { filmStrip },
  data: () => {
    return {
      ctx: null,
      utils,
    }
  },
  methods: {
    handleLoadeddata () {
      this.$refs.video.currentTime = this.utils.index2time(this.currentFrame)
    },
  },
  mounted () {
    this.ctx = this.$refs.canvas.getContext('2d')
    this.ctx.fillRect(20, 20, 150, 100)
  },
  computed: {
    video () {
      return this.$store.state.annotation.video
    },
    currentFrame: {
      get () {
        const videoElement = this.$refs.video
        const currentFrame = eval('this.$store.state.annotation.' + this.position + 'CurrentFrame')
        if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
          this.$refs.video.currentTime = this.utils.index2time(currentFrame)
        }
        return currentFrame
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
        this.$refs.video.currentTime = this.utils.index2time(value)
        this.$store.commit('set' + this.position.slice(0, 1).toUpperCase() + this.position.slice(1) + 'CurrentFrame',
          value)
      },
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
