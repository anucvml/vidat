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
    <img
      ref="img"
      :src="cachedFrameList[currentFrame]"
      style="display: none"
      @load="handleLoad"
    >
  </div>
`

import filmStrip from './filmStrip.js'

export default {
  props: ['position'],
  components: { filmStrip },
  data: () => {
    return {
      ctx: null,
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
    currentFrame () {
      return eval('this.$store.state.annotation.' + this.position + 'CurrentFrame')
    },
    cachedFrameList () {
      return this.$store.state.annotation.cachedFrameList
    },
  },
  template: VIDEO_PANEL_TEMPLATE,
}
