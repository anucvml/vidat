const VIDEO_PLAYER_TEMPLATE = `
<video
  id="video-player"
  :class="['full-width', {'grayscale': grayscale}]"
  preload="auto"
  :src="video.src"
  :muted="muted"
>
</video>
`

export default {
  mounted () {
    document.getElementById('video-player').style.display = 'none'
  },
  computed: {
    grayscale () {
      return this.$store.state.settings.grayscale
    },
    video () {
      return this.$store.state.annotation.video
    },
    muted () {
      return this.$store.state.settings.preferenceData.muted
    },
  },
  template: VIDEO_PLAYER_TEMPLATE,
}
