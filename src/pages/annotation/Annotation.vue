<template>
  <div>
    <q-card class="q-mb-md no-border-radius" v-if="!video.src">
      <q-btn flat class="full-width" size="40px" @click="handleOpen" icon="movie" label="open"></q-btn>
      <annotation-skeleton></annotation-skeleton>
    </q-card>
    <q-card class="q-mb-md no-border-radius" v-if="video.src">
      <keyframes-panel></keyframes-panel>
      <div class="row justify-around">
        <canvas-panel :class="[{'col-lg': !zoom}, {'col-md-10': !zoom}, {'col-sm-10': !zoom}, {'col': zoom}]"
                      position="left"></canvas-panel>
        <control-panel class="col" v-show="!zoom"></control-panel>
        <canvas-panel class="col-lg col-md-10 col-sm-10" v-show="!zoom" position="right"></canvas-panel>
        <div class="col lg-hide xl-hide"></div>
      </div>
      <action-table v-if="preference.actions"></action-table>
    </q-card>
  </div>
</template>

<script>
import Vuex from 'vuex'

import AnnotationSkeleton from './components/AnnotationSkeleton'
import CanvasPanel from './components/CanvasPanel'
import ControlPanel from './components/ControlPanel'
import KeyframesPanel from './components/KeyframePanel'
import ActionTable from './components/ActionTable'
import utils from 'src/libs/utils.js'

export default {
  name: 'annotation',
  components: {
    AnnotationSkeleton,
    CanvasPanel,
    ControlPanel,
    KeyframesPanel,
    ActionTable,
  },
  data: () => {
    return {}
  },
  methods: {
    ...Vuex.mapMutations([
      'setVideoSrc',
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
}
</script>

<style scoped>

</style>
