const VIDEO_LOADER_TEMPLATE = `
<div>
  <video
    id="video"
    ref="video"
    preload="auto"
    style="display: none"
    controls
    :src="video.src"
    @loadeddata="handleLoadeddata"
    @seeked="handleSeeked"
    @error="handleError"
    v-show="($q.platform.is.safari || $q.platform.is.ios) && video.src && cachedFrameList.length === 0"
  >
    Sorry, your browser doesn't support embedded videos.
  </video>
  <q-circular-progress
    title="Loading"
    style="position: absolute; top: 5px; right: 5px"
    track-color="grey-3"
    indeterminate
    v-show="loading"
  >
  </q-circular-progress>
</div>
`

import utils from '../libs/utils.js'

export default {
  data: () => {
    return {
      priorityQueue: [], // index of priority frame that needs to process now
      backendQueue: [], // index of frame for backend processing
      loading: false,
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setVideoDuration',
      'setVideoWidth',
      'setVideoHeight',
      'setKeyframeList',
      'setLeftCurrentFrame',
      'setRightCurrentFrame',
      'cacheFrame',
      'closeVideo',
    ]),
    handleLoadeddata (event) {
      if (!this.video.duration) {
        this.setVideoDuration(event.target.duration)
      }
      if (!this.video.width) {
        this.setVideoWidth(event.target.videoWidth)
      }
      if (!this.video.height) {
        this.setVideoHeight(event.target.videoHeight)
      }
      // init keyframe list
      if (this.keyframeList.length === 0) {
        const keyframeList = []
        for (let i = 0; i < this.video.frames; i += this.preferenceData.defaultFpk) {
          keyframeList.push(parseInt(i))
        }
        this.setKeyframeList(keyframeList)
        // init navigation
        this.setLeftCurrentFrame(keyframeList[0])
        this.setRightCurrentFrame(keyframeList[1] || keyframeList[0])
      }
      // add keyframe to priorityQueue
      for (const keyframe of this.keyframeList) {
        if (keyframe !== 0) {
          this.priorityQueue.push(keyframe)
        }
      }
      if (this.$store.state.debug === false) {
        // add frame index into the backendQueue
        // 1. every one second
        for (let i = 1.0; i < this.video.duration; i++) {
          const index = utils.time2index(i)
          if (this.keyframeList.indexOf(index) === -1) {
            this.backendQueue.push(index)
          }
        }
        // 2. every 1 / fps second
        const interval = parseFloat((1 / this.video.fps).toFixed(3))
        for (let i = interval; i < this.video.duration; i += interval) {
          if (i.toFixed(1) % 1 !== 0) {
            this.backendQueue.push(utils.time2index(i))
          }
        }
      }
      // trigger
      event.target.currentTime = 0.0
    },
    handleSeeked (event) {
      if (this.video.src) {
        const videoElement = event.target
        const currentTime = videoElement.currentTime
        const currentIndex = utils.time2index(currentTime)
        if (!this.cachedFrameList[currentIndex]) {
          this.loading = true
          // get the image
          const canvas = document.createElement('canvas')
          canvas.width = this.video.width
          canvas.height = this.video.height
          canvas.getContext('2d').drawImage(videoElement, 0, 0, canvas.width, canvas.height)
          // save to cachedFrames
          this.cacheFrame({
            index: currentIndex,
            frame: canvas.toDataURL('image/jpeg'),
          })
        }
        // trigger next frame
        if (!this.cachedFrameList[this.leftCurrentFrame]) {
          videoElement.currentTime = utils.index2time(this.leftCurrentFrame)
        } else if (!this.cachedFrameList[this.rightCurrentFrame]) {
          videoElement.currentTime = utils.index2time(this.rightCurrentFrame)
        } else if (this.priorityQueue.length !== 0) {
          videoElement.currentTime = utils.index2time(this.priorityQueue.shift())
        } else if (this.backendQueue.length !== 0) {
          videoElement.currentTime = utils.index2time(this.backendQueue.shift())
        } else {
          this.loading = false
        }
      }
    },
    handleError (event) {
      utils.confirm('Unable to load video!')
      this.closeVideo()
    },
  },
  computed: {
    video () {
      return this.$store.state.annotation.video
    },
    keyframeList () {
      return this.$store.state.annotation.keyframeList
    },
    leftCurrentFrame () {
      return this.$store.state.annotation.leftCurrentFrame
    },
    rightCurrentFrame () {
      return this.$store.state.annotation.rightCurrentFrame
    },
    cachedFrameList () {
      return this.$store.state.annotation.cachedFrameList
    },
    objectLabelData () {
      return this.$store.state.settings.objectLabelData
    },
    actionLabelData () {
      return this.$store.state.settings.actionLabelData
    },
    skeletonTypeData () {
      return this.$store.state.settings.skeletonTypeData
    },
    preferenceData () {
      return this.$store.state.settings.preferenceData
    },
    objectAnnotationListMap () {
      return this.$store.state.annotation.objectAnnotationListMap
    },
    regionAnnotationListMap () {
      return this.$store.state.annotation.regionAnnotationListMap
    },
    skeletonAnnotationListMap () {
      return this.$store.state.annotation.skeletonAnnotationListMap
    },
    actionAnnotationList () {
      return this.$store.state.annotation.actionAnnotationList
    },
  },
  template: VIDEO_LOADER_TEMPLATE,
}
