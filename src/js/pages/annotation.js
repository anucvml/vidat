const ANNOTATION_TEMPLATE = `
<div>
  <q-card class="q-mb-md no-border-radius" style="min-height: 100px">
    <video-info-panel></video-info-panel>
  </q-card>
  <q-card class="q-mb-md no-border-radius" v-if="!video.src">
    <annotation-skeleton></annotation-skeleton>
  </q-card>
  <q-card class="row q-mb-md no-border-radius" v-if="video.src" >
    <canvas-panel :class="[{'col-lg': !zoom}, {'col-md-10': !zoom}, {'col-sm-10': !zoom}, {'col': zoom}]" position="left"></canvas-panel>
    <control-panel class="col" v-show="!zoom"></control-panel>
    <canvas-panel class="col-lg col-md-10 col-sm-10" v-show="!zoom" position="right"></canvas-panel>
  </q-card>
</div>
`

import videoInfoPanel from '../components/videoInfoPanel.js'
import annotationSkeleton from '../components/annotationSkeleton.js'
import canvasPanel from '../components/canvasPanel.js'
import controlPanel from '../components/controlPanel.js'

export default {
  components: {
    videoInfoPanel,
    annotationSkeleton,
    canvasPanel,
    controlPanel,
  },
  data: () => {
    return {}
  },
  methods: {},
  computed: {
    video () {
      return this.$store.state.annotation.video
    },
    zoom () {
      return this.$store.state.annotation.zoom
    },
  },
  template: ANNOTATION_TEMPLATE,
}
