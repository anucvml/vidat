const VIDEO_PANEL_TEMPLATE = `
  <div>
    <canvas ref="canvas" class="full-width">123</canvas>
    <img ref="img" :src="cachedFrameList[panel.currentKeyframe]" style="display: none">
  </div>
`

export default {
  props: ['position'],
  data: () => {
    return {
      ctx: null,
    }
  },
  methods: {
    drawFrame () {
      const that = this
      this.$refs.img.onload = function () {
        that.ctx.drawImage(that.$refs.img, 0, 0, that.$refs.canvas.width, that.$refs.canvas.height)
      }
    },
    draw () {
      this.drawFrame()
    },
  },
  created () {
    this.$watch(
      function () {
        return eval('this.$store.state.annotation.' + this.position + 'Panel')
      },
      function (oldValue, newValue) {
        this.draw()
      },
      { deep: true },
    )
  },
  mounted () {
    this.ctx = this.$refs.canvas.getContext('2d')
    this.draw()
  },
  computed: {
    video () {
      return this.$store.state.annotation.video
    },
    panel () {
      return eval('this.$store.state.annotation.' + this.position + 'Panel')
    },
    cachedFrameList () {
      return this.$store.state.annotation.cachedFrameList
    },
  },
  template: VIDEO_PANEL_TEMPLATE,
}
