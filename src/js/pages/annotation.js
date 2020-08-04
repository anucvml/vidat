const ANNOTATION_TEMPLATE = `
<div>
  <q-card class="q-mb-md no-border-radius" style="min-height: 100px">
    <video-info></video-info>
  </q-card>
  <q-card class="q-mb-md no-border-radius" v-if="!video.src">
    <annotation-skeleton></annotation-skeleton>
  </q-card>
  <q-card class="row q-mb-md no-border-radius" v-if="video.src" >
    <canvas-panel class="col-md col-sm-10" position="left"></canvas-panel>
    <control-panel class="col-md-1 col-sm-2"></control-panel>
    <canvas-panel class="col-md col-sm-10" position="right"></canvas-panel>
  </q-card>
</div>
`

import videoInfo from '../components/videoInfo.js'
import annotationSkeleton from '../components/annotationSkeleton.js'
import canvasPanel from '../components/canvasPanel.js'
import controlPanel from '../components/controlPanel.js'

export default {
  components: {
    videoInfo,
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
  },
  template: ANNOTATION_TEMPLATE,
}
