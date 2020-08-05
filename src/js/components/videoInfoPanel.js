const VIDEO_INFO_PANEL_TEMPLATE = `
<div>
  <div v-if="video.src" class="row q-mb-sm" style="min-height: 100px">
    <q-list class="col-3" dense>
      <q-item class="col">
        <q-item-section class="text-center">Video Info</q-item-section>
      </q-item>
      <q-item class="col">
        <q-item-section>Duration/FPS:</q-item-section>
        <q-item-section class="text-right">{{ video.duration }}s @ {{ video.fps }}fps</q-item-section>
      </q-item>
      <q-item class="col">
        <q-item-section>Size/#Frames:</q-item-section>
        <q-item-section class="text-right">{{ video.width }} &times; {{ video.height }}px &times; {{ video.frames }}</q-item-section>
      </q-item>
    </q-list>
    <q-list class="col-3" dense>
      <q-item>
        <q-item-section class="text-center">Video</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click="handleOpen">
        <q-item-section avatar><q-icon name="movie"></q-icon></q-item-section>
        <q-item-section class="text-right">Reopen</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click="handleClose">
        <q-item-section avatar><q-icon name="close"></q-icon></q-item-section>
        <q-item-section class="text-right">Close</q-item-section>
      </q-item>
    </q-list>
    <q-list class="col-3" dense>
      <q-item>
        <q-item-section class="text-center">KeyFrames</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click="handleGenerate">
        <q-item-section avatar><q-icon name="more_time"></q-icon></q-item-section>
        <q-item-section class="text-right">Generate</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click="handleExport">
        <q-item-section avatar><q-icon name="save"></q-icon></q-item-section>
        <q-item-section class="text-right">Export</q-item-section>
      </q-item>
    </q-list>
    <q-list class="col-3" dense>
      <q-item>
        <q-item-section class="text-center">Annotations</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click="handleLoad">
        <q-item-section avatar><q-icon name="cloud_upload"></q-icon></q-item-section>
        <q-item-section class="text-right">Load</q-item-section>
      </q-item>
      <q-item clickable v-ripple @click="handleSave">
        <q-item-section avatar><q-icon name="cloud_download"></q-icon></q-item-section>
        <q-item-section class="text-right">Save</q-item-section>
      </q-item>
    </q-list>
    <q-list class="col-12 row">
      <q-item class="q-px-md">
        <q-item-section class="text-center">Keyframes:</q-item-section>
      </q-item>
      <q-item class="col q-pa-none">
        <q-range
          style="transform: translateY(20px)"
          v-model="CurrentFrameRange"
          :min="0"
          :max="video.frames"
          :step="1"
          :left-label-value="'L:' + CurrentFrameRange.min"
          :right-label-value="'R:' + CurrentFrameRange.max"
          label-always
          readonly
        ></q-range>
      </q-item>
      <q-space></q-space>
      <q-item class="q-pa-sm">
        <q-btn-group flat>
          <q-btn @click="handlePreviousKeyframe" icon="keyboard_arrow_left"></q-btn>
          <q-btn @click="handleNextKeyframe" icon="keyboard_arrow_right"></q-btn>
        </q-btn-group>
      </q-item>
    </q-list>
  </div>
  <q-btn flat class="absolute-center full-width" size="40px" @click="handleOpen" icon="movie" v-if="!video.src">Open</q-btn>
  <video
    id="video"
    ref="video"
    controls
    style="display: none"
    :src="video.src"
    @loadeddata="handleLoadeddata"
    @seeked="handleSeeked"
  >
    Sorry, your browser doesn't support embedded videos.
  </video>
</div>
`

import utils from '../libs/utils.js'
import {
  ObjectAnnotation,
  RegionAnnotation,
  SkeletonAnnotation,
} from '../libs/annotationlib.js'

export default {
  data: () => {
    return {
      utils,
      priorityQueue: [], // index of priority frame that needs to process now
      backendQueue: [], // index of frame for backend processing
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setVideoSrc',
      'setVideoDuration',
      'setVideoWidth',
      'setVideoHeight',
      'setSecondPerKeyframe',
      'setLeftCurrentFrame',
      'setRightCurrentFrame',
      'cacheFrame',
      'setVideoFPS',
      'closeVideo',
      'setObjectAnnotationListMap',
      'setRegionAnnotationListMap',
      'setSkeletonAnnotationListMap',
    ]),
    handleOpenWithFPS () {
      utils.prompt(
        'FPS',
        'Please enter the FPS you want. Integer between 1 and 60.',
        10,
        'number').onOk((fps) => {
        if (fps >= 1 && fps <= 60 && fps % 1 === 0) {
          this.setVideoFPS(parseInt(fps))
          utils.importVideo().then(videoSrc => {
            this.setVideoSrc(videoSrc)
          })
        } else {
          utils.notify('Please enter an integer between 1 and 60.')
        }
      })
    },
    handleOpen () {
      if (this.video.src) {
        utils.confirm('Are you sure to open a new video? You will LOSE all data!').onOk(() => {
          this.handleOpenWithFPS()
        })
      } else {
        this.handleOpenWithFPS()
      }
    },
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
      this.setSecondPerKeyframe(5)
      // add keyframe to priorityQueue
      this.keyframeList.forEach(keyframe => {
        if (keyframe !== 0) {
          this.priorityQueue.push(keyframe)
        }
      })
      // add frame index into the backendQueue
      // 1. every one second
      // for (let i = 1.0; i < this.video.duration; i++) {
      //   const index = utils.time2index(i)
      //   if (this.keyframeList.indexOf(index) === -1) {
      //     this.backendQueue.push(index)
      //   }
      // }
      // 2. every 1 / fps second
      // const interval = parseFloat((1 / this.video.fps).toFixed(3))
      // for (let i = interval; i < this.video.duration; i += interval) {
      //   if (i.toFixed(1) % 1 !== 0) {
      //     this.backendQueue.push(utils.time2index(i))
      //   }
      // }
      // trigger
      event.target.currentTime = 0.0
    },
    handleSeeked (event) {
      if (this.video.src) {
        const videoElement = event.target
        const currentTime = videoElement.currentTime
        const currentIndex = utils.time2index(currentTime)
        if (!this.cachedFrameList[currentIndex]) {
          console.log('currentIndex: ', currentIndex, 'currentTime: ' + currentTime)
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
      }
    },
    handleClose () {
      utils.confirm('Are you sure to close? You will LOSE all data!').onOk(() => {
        // this.setVideoSrc(null)
        this.closeVideo()
      })
    },
    handleGenerate () {
      utils.prompt(
        'Generate keyframes',
        'Generate keyframe every how many seconds? Integer bigger or equal to 1.',
        5,
        'number',
      ).onOk((secondPerKeyframe) => {
        if (secondPerKeyframe >= 1 && secondPerKeyframe % 1 === 0) {
          this.setSecondPerKeyframe(parseInt(secondPerKeyframe))
          // re-cache keyframes
          this.keyframeList.forEach(keyframe => {
            if (keyframe !== 0) {
              this.priorityQueue.push(keyframe)
            }
          })
          // trigger again
          this.$refs.video.currentTime = 0.0
        } else {
          utils.notify('Please enter an integer bigger than 1.')
        }
      })
    },
    handleExport () {
      // ensure that we have all the keyframes
      let isOk = true
      for (let i = 0; i < this.keyframeList.length; i++) {
        if (!this.cachedFrameList[this.keyframeList[i]]) {
          isOk = false
          break
        }
      }
      // export all keyframes as a zip file
      if (isOk) {
        const zip = new JSZip()
        for (let i = 0; i < this.keyframeList.length; i++) {
          const imgDataURL = this.cachedFrameList[this.keyframeList[i]]
          zip.file(
            utils.index2time(this.keyframeList[i]) + '.jpg',
            imgDataURL.slice(imgDataURL.indexOf(',') + 1),
            { base64: true },
          )
        }
        zip.generateAsync({ type: 'blob' }).then(content => {
          saveAs(content, 'keyframes.zip')
        })
      } else {
        utils.notify('Please wait for caching!')
      }
    },
    handleLoad () {
      utils.confirm(
        'Are you sure to load? This would override current data!',
      ).onOk(() => {
        utils.importFile().then(file => {
            const fileData = JSON.parse(file)
            const {
              version,
              fps,
              frames,
              secondPerKeyframe,
              keyframes,
              objectAnnotationListMap,
              regionAnnotationListMap,
              skeletonAnnotationListMap,
            } = fileData
            // Check the json file
            let isOk = true
            if (version !== VERSION) {
              utils.notify('Version mismatch, weird things likely to happen! ' + version + '!=' + VERSION)
            }
            if (fps !== this.video.fps) {
              isOk = false
              utils.notify('FPS mismatch, unable to load annotations! ' + fps + '!=' + this.video.fps)
            }
            if (frames !== this.video.frames) {
              isOk = false
              utils.notify('#frames mismatch, unable to load annotations! ' + frames + '!=' + this.video.frames)
            }
            if (isOk) {
              this.setSecondPerKeyframe(secondPerKeyframe)
              // objectAnnotationListMap
              for (let frame in objectAnnotationListMap) {
                const objectAnnotationList = objectAnnotationListMap[frame]
                for (let i in objectAnnotationList) {
                  let objectAnnotation = objectAnnotationList[i]
                  objectAnnotationList[i] = new ObjectAnnotation(
                    objectAnnotation.x,
                    objectAnnotation.y,
                    objectAnnotation.width,
                    objectAnnotation.height,
                    objectAnnotation.labelId,
                    objectAnnotation.color,
                    objectAnnotation.instance,
                    objectAnnotation.score)
                }
              }
              this.setObjectAnnotationListMap(objectAnnotationListMap)
              // objectAnnotationListMap
              // regionAnnotationListMap
              // skeletonAnnotationListMap
            }
          },
        )
      })
    },
    handleSave () {
      const data = {
        version: VERSION,
        fps: this.video.fps,
        frames: this.video.frames,
        secondPerKeyframe: this.secondPerKeyframe,
        keyframes: this.keyframeList,
        objectAnnotationListMap: this.objectAnnotationListMap,
        regionAnnotationListMap: this.regionAnnotationListMap,
        skeletonAnnotationListMap: this.skeletonAnnotationListMap,
      }
      Quasar.utils.exportFile(
        'annotations.json',
        new Blob([JSON.stringify(data)]),
        { type: 'text/plain' },
      )
    },
    handlePreviousKeyframe () {
      const leftCurrentFrame = this.leftCurrentFrame
      const rightCurrentFrame = this.rightCurrentFrame
      const keyframeInterval = utils.time2index(this.secondPerKeyframe)
      const leftNextFrame = this.leftCurrentFrame - keyframeInterval
      const rightNextFrame = this.rightCurrentFrame - keyframeInterval
      if (leftNextFrame < 0 || rightNextFrame < 0) {
        this.setLeftCurrentFrame(0)
        this.setRightCurrentFrame(keyframeInterval)
      } else if (rightCurrentFrame - leftCurrentFrame === keyframeInterval) {
        this.setLeftCurrentFrame(leftNextFrame)
        this.setRightCurrentFrame(rightNextFrame)
      } else {
        this.setLeftCurrentFrame(leftNextFrame)
        this.setRightCurrentFrame(leftCurrentFrame)
      }
    },
    handleNextKeyframe () {
      const leftCurrentFrame = this.leftCurrentFrame
      const rightCurrentFrame = this.rightCurrentFrame
      const keyframeInterval = utils.time2index(this.secondPerKeyframe)
      const leftNextFrame = leftCurrentFrame + keyframeInterval
      const rightNextFrame = rightCurrentFrame + keyframeInterval
      const lastKeyframe = this.keyframeList[this.keyframeList.length - 1]
      if (leftNextFrame > lastKeyframe || rightNextFrame > lastKeyframe) {
        this.setLeftCurrentFrame(lastKeyframe - keyframeInterval)
        this.setRightCurrentFrame(lastKeyframe)
      } else if (rightCurrentFrame - leftCurrentFrame === keyframeInterval) {
        this.setLeftCurrentFrame(leftNextFrame)
        this.setRightCurrentFrame(rightNextFrame)
      } else {
        this.setLeftCurrentFrame(leftCurrentFrame)
        this.setRightCurrentFrame(leftNextFrame)
      }
    },
  },
  computed: {
    video () {
      return this.$store.state.annotation.video
    },
    secondPerKeyframe () {
      return this.$store.state.annotation.secondPerKeyframe
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
    CurrentFrameRange () {
      return {
        min: this.leftCurrentFrame,
        max: this.rightCurrentFrame,
      }
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
  },
  mounted () {
    // debug
    this.setVideoFPS(10)
    this.setVideoSrc('video/Ikea_dataset_teaser_vid.webm')
  },
  template: VIDEO_INFO_PANEL_TEMPLATE,
}
