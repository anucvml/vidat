const VIDEO_PANEL_TEMPLATE = `
  <div>
    <film-strip></film-strip>
    <canvas
      ref="canvas"
      class="full-width"
      style="display: block"
      :height="video.height"
      :width="video.width"
    ></canvas>
    <film-strip></film-strip>
    <div class="q-px-md">
      <q-slider
        v-model="currentFrame"
        :min="0"
        :max="260"
        :step="1"
        label
      />
      <q-badge class="float-right">
        {{ utils.index2time(this.currentFrame) | toFixed2 }} / {{ video.duration | toFixed2 }} s
      </q-badge>
    </div>
    <img
      ref="img"
      :src="cachedFrameList[currentFrame]"
      style="display: none"
      @load="handleLoad"
    >
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
    handleLoad () {
      this.ctx.drawImage(this.$refs.img, 0, 0, this.video.width, this.video.height)
    },
  },
  mounted () {
    this.ctx = this.$refs.canvas.getContext('2d')
  },
  computed: {
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
