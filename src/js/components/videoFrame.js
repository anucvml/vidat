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
    return {
      backendQueue: [], // index of frame for backend processing
      priorityQueue: [], // index of priority frame that needs to process now
      processedFrameList: [], // index of frames that are already processed
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'cacheFrame',
    ]),
    handleLoadeddata (event) {
      // the trigger
      event.target.currentTime = 0.0
    },
    handleSeeked (event) {
      if (this.video.src) {
        const videoElement = event.target
        const currentTime = videoElement.currentTime
        const currentIndex = utils.time2index(currentTime)
        console.log('currentIndex: ', currentIndex, 'currentTime: ' + currentTime)
        if (this.processedFrameList.indexOf(currentIndex) === -1) {
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
        if (this.priorityQueue.length !== 0) {
          videoElement.currentTime = utils.index2time(this.priorityQueue.shift())
        } else if (this.backendQueue.length !== 0) {
          videoElement.currentTime = utils.index2time(this.backendQueue.shift())
        }
        this.processedFrameList.push(currentIndex)
      }
    },
  },
  watch: {
    leftCurrentFrame: function (newValue) {
      if (this.processedFrameList.length !== this.video.frames) { this.priorityQueue.unshift(newValue)}
    },
    rightCurrentFrame: function (newValue) {
      if (this.processedFrameList.length !== this.video.frames) { this.priorityQueue.unshift(newValue)}
    },
  },
  computed: {
    video () {
      return this.$store.state.annotation.video
    },
    leftCurrentFrame () {
      return this.$store.state.annotation.leftCurrentFrame
    },
    rightCurrentFrame () {
      return this.$store.state.annotation.rightCurrentFrame
    },
    keyframeList () {
      return this.$store.state.annotation.keyframeList
    },
  },
  mounted () {
    // add keyframe to priorityQueue
    this.keyframeList.forEach(keyframe => {
      if (keyframe !== 0) {
        this.priorityQueue.push(keyframe)
      }
    })
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
  },
  template: VIDEO_FRAME_TEMPLATE,
}
