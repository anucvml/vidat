const ANNOTATION_TEMPLATE = `
<q-page padding>
  <q-card class="q-mb-md" style="min-height: 100px">
    <video-info></video-info>
  </q-card>
  <q-card class="q-mb-md q-pa-sm" v-if="!video.src">
    <annotation-skeleton></annotation-skeleton>
  </q-card>
  <q-card class="row q-mb-md" v-if="video.src" >
    <q-card-section class="col q-ma-xs q-pa-sm"></q-card-section>
    <q-card-section class="col-1 q-ma-xs q-pa-sm">middle</q-card-section>
    <q-card-section class="col q-ma-xs q-pa-sm">right</q-card-section>
  </q-card>
</q-page>
`

import videoInfo from '../components/videoInfo.js'
import annotationSkeleton from '../components/annotationSkeleton.js'

export default {
  components: {
    videoInfo,
    annotationSkeleton,
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
