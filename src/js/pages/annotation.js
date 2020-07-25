const ANNOTATION_TEMPLATE = `
<q-page padding>
  <q-card class="q-mb-md" style="min-height: 100px">
    <video-info></video-info>
  </q-card>
  <q-card class="q-mb-md" v-if="!video.src">
    <annotation-skeleton></annotation-skeleton>
  </q-card>
  <q-card class="row q-mb-md" v-if="video.src" >
    <video-panel class="col-md col-sm-10" position="left"></video-panel>
    <control-panel class="col-md-1 col-sm-2"></control-panel>
    <video-panel class="col-md col-sm-10" position="right"></video-panel>
  </q-card>
  <video-frame></video-frame>
</q-page>
`

import videoInfo from '../components/videoInfo.js'
import annotationSkeleton from '../components/annotationSkeleton.js'
import videoPanel from '../components/canvasPanel.js'
import controlPanel from '../components/controlPanel.js'
import videoFrame from '../components/videoFrame.js'

export default {
  components: {
    videoInfo,
    annotationSkeleton,
    videoPanel,
    controlPanel,
    videoFrame,
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
