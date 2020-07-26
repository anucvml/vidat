const VIDEO_FRAME_TEMPLATE = `
<div>
  <video
    ref="video"
    :src="video.src"
    :width="video.width"
    :height="video.height"
    @loadeddata="handleLoadeddata"
    @seeked="handleSeeked"
    style="display: none"
  ></video>
</div>
`

import utils from '../libs/utils.js'

export default {
  data: () => {
    return {}
  },
  methods: {
    ...Vuex.mapMutations([
      'cacheFrame',
    ]),
    handleLoadeddata () {
      this.$refs.video.currentTime = 0.0
    },
    handleSeeked () {
      const canvas = document.createElement('canvas')
      // const interval = 1 / this.video.fps
      const interval = 1
      canvas.width = this.video.width
      canvas.height = this.video.height
      canvas.getContext('2d').drawImage(this.$refs.video, 0, 0, canvas.width, canvas.height)
      this.cacheFrame({
        index: utils.time2index(this.$refs.video.currentTime),
        frame: canvas.toDataURL('image/jpeg'),
      })
      if (this.$refs.video.currentTime + interval < this.video.duration) {
        this.$refs.video.currentTime += interval
        console.log(this.$refs.video.currentTime)
      }
    },
  },
  computed: {
    video () {
      return this.$store.state.annotation.video
    },
  },
  template: VIDEO_FRAME_TEMPLATE,
}
