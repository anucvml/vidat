const ANNOTATION_TEMPLATE = `
<div>
  <q-card class="q-mb-md no-border-radius" v-if="!video.src">
    <q-btn flat class="full-width" size="40px" @click="handleOpen" icon="movie" label="open"></q-btn>
    <annotation-skeleton></annotation-skeleton>
  </q-card>
  <q-card class="q-mb-md no-border-radius" v-if="video.src">
    <keyframes-panel></keyframes-panel>
    <div class="row justify-around">
      <canvas-panel :class="[{'col-lg': !zoom}, {'col-md-10': !zoom}, {'col-sm-10': !zoom}, {'col': zoom}]" position="left"></canvas-panel>
      <control-panel class="col" v-show="!zoom"></control-panel>
      <canvas-panel class="col-lg col-md-10 col-sm-10" v-show="!zoom" position="right"></canvas-panel>
      <div class="col lg-hide xl-hide"></div>
    </div>
    <action-table v-if="preference.actions"></action-table>
  </q-card>
</div>
`

import annotationSkeleton from './components/annotationSkeleton.js'
import canvasPanel from './components/canvasPanel.js'
import controlPanel from './components/controlPanel.js'
import keyframesPanel from './components/keyframePanel.js'
import actionTable from './components/actionTable.js'
import utils from '../../libs/utils.js'

export default {
  components: {
    annotationSkeleton,
    canvasPanel,
    controlPanel,
    keyframesPanel,
    actionTable,
  },
  data: () => {
    return {}
  },
  methods: {
    ...Vuex.mapMutations([
      'setVideoSrc',
      'setSecondPerKeyframe',
      'setVideoFPS',
    ]),
    handleOpenWithFPS () {
      this.setVideoFPS(this.$store.state.settings.preferenceData.defaultFps)
      utils.importVideo().then(videoSrc => {
        this.setVideoSrc(videoSrc)
      })
    },
    handleOpen () {
      if (this.video.src) {
        utils.confirm('Are you sure to open a new video? You will LOSE all data!').onOk(() => {
          this.closeVideo()
          this.handleOpenWithFPS()
        })
      } else {
        this.handleOpenWithFPS()
      }
    },
  },
  computed: {
    video () {
      return this.$store.state.annotation.video
    },
    zoom () {
      return this.$store.state.annotation.zoom
    },
    preference () {
      return this.$store.state.settings.preferenceData
    },
  },
  template: ANNOTATION_TEMPLATE,
}
