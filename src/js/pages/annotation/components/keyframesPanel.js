const KEYFRAMES_PANEL_TEMPLATE = `
<div>
  <div v-if="video.src" class="row items-center">
    <q-list class="col-12 row">
      <q-item dense>
        <q-item-section class="text-center">
          <q-btn-group flat>
            <q-btn @click="handlePlayPause" :icon="playTimeInterval ? 'pause' : 'play_arrow'"></q-btn>
            <q-btn @click="handleStop" icon="stop"></q-btn>
          </q-btn-group>
        </q-item-section>
      </q-item>
      <q-item class="col">
        <q-range
          ref="slider"
          :style="rangeStyle"
          class="custom-range"
          v-model="CurrentFrameRange"
          :min="0"
          :max="video.frames"
          :step="1"
          :left-label-value="'L: ' + CurrentFrameRange.min + ' | ' + toFixed2(index2time(CurrentFrameRange.min)) + ' s'"
          :right-label-value="'R: ' + CurrentFrameRange.max + ' | ' + toFixed2(index2time(CurrentFrameRange.max)) + ' s'"
          label-always
          drag-range
          snap
        ></q-range>
      </q-item>
      <q-space></q-space>
      <q-item dense>
        <q-item-section class="text-center">
          <q-btn-group flat>
            <q-btn @click="handlePreviousKeyframe" icon="keyboard_arrow_left"></q-btn>
            <q-btn @click="handleNearestKeyframe" icon="gps_fixed"></q-btn>
            <q-btn @click="handleNextKeyframe" icon="keyboard_arrow_right"></q-btn>
          </q-btn-group>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</div>
`

import utils from '../../../libs/utils.js'

export default {
  data: () => {
    return {
      index2time: utils.index2time,
      playTimeInterval: null,
      keyframeRangeStyle: {},
      objectAnnotationRangeStyle: {},
      regionAnnotationRangeStyle: {},
      skeletonAnnotationRangeStyle: {},
      actionAnnotationRangeStyle: {},
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setLeftCurrentFrame',
      'setRightCurrentFrame',
    ]),
    handlePlayPause () {
      if (!this.playTimeInterval) {
        if (this.leftCurrentFrame === this.video.frames) {
          this.leftCurrentFrame = 0
        }
        this.playTimeInterval = setInterval(
          () => {
            if (this.leftCurrentFrame === this.video.frames) {
              clearInterval(this.playTimeInterval)
              this.playTimeInterval = null
            } else {
              this.leftCurrentFrame = this.leftCurrentFrame + 1
            }
          },
          1000 / this.video.fps,
        )
      } else {
        clearInterval(this.playTimeInterval)
        this.playTimeInterval = null
      }
    },
    handleStop () {
      if (this.playTimeInterval) {
        clearInterval(this.playTimeInterval)
        this.playTimeInterval = null
      }
      this.leftCurrentFrame = 0
    },
    nearestKeyframe (currentFrame) {
      let min = this.video.frames
      let nearestKeyframe = currentFrame
      for (let i = 0; i < this.keyframeList.length; i++) {
        let distance = Math.abs(currentFrame - this.keyframeList[i])
        if (distance < min) {
          min = distance
          nearestKeyframe = this.keyframeList[i]
        }
      }
      return nearestKeyframe
    },
    handlePreviousKeyframe () { // base on right most one
      const leftCurrentKeyFrame = this.nearestKeyframe(this.leftCurrentFrame)
      const rightCurrentKeyFrame = this.nearestKeyframe(this.rightCurrentFrame)
      const leftCurrentKeyFrameIndex = this.keyframeList.indexOf(leftCurrentKeyFrame)
      const rightCurrentKeyFrameIndex = this.keyframeList.indexOf(rightCurrentKeyFrame)
      if (leftCurrentKeyFrameIndex <= 0 || rightCurrentKeyFrameIndex <= 0) {
        this.setLeftCurrentFrame(0)
        this.setRightCurrentFrame(this.keyframeList[1] || 0)
      } else if (leftCurrentKeyFrameIndex === rightCurrentKeyFrameIndex) {
        this.setLeftCurrentFrame(this.keyframeList[rightCurrentKeyFrameIndex - 1])
        this.setRightCurrentFrame(rightCurrentKeyFrame)
      } else if (leftCurrentKeyFrameIndex < rightCurrentKeyFrameIndex) {
        if (rightCurrentKeyFrameIndex - 2 < 0) {
          this.setLeftCurrentFrame(0)
          this.setRightCurrentFrame(this.keyframeList[1] || 0)
        } else {
          this.setLeftCurrentFrame(this.keyframeList[rightCurrentKeyFrameIndex - 2])
          this.setRightCurrentFrame(this.keyframeList[rightCurrentKeyFrameIndex - 1])
        }
      } else {
        this.setLeftCurrentFrame(rightCurrentKeyFrame)
        this.setRightCurrentFrame(leftCurrentKeyFrame)
      }
    },
    handleNearestKeyframe () {
      const leftCurrentKeyFrame = this.nearestKeyframe(this.leftCurrentFrame)
      const rightCurrentKeyFrame = this.nearestKeyframe(this.rightCurrentFrame)
      const leftCurrentKeyFrameIndex = this.keyframeList.indexOf(leftCurrentKeyFrame)
      const rightCurrentKeyFrameIndex = this.keyframeList.indexOf(rightCurrentKeyFrame)
      if (rightCurrentKeyFrameIndex - leftCurrentKeyFrameIndex === 1) {
        this.setLeftCurrentFrame(leftCurrentKeyFrame)
        this.setRightCurrentFrame(rightCurrentKeyFrame)
      } else {
        this.setLeftCurrentFrame(leftCurrentKeyFrame)
        this.setRightCurrentFrame(this.keyframeList[leftCurrentKeyFrameIndex + 1] || leftCurrentKeyFrame)
      }
    },
    handleNextKeyframe () { // base on left most one
      const leftCurrentKeyFrame = this.nearestKeyframe(this.leftCurrentFrame)
      const rightCurrentKeyFrame = this.nearestKeyframe(this.rightCurrentFrame)
      const leftCurrentKeyFrameIndex = this.keyframeList.indexOf(leftCurrentKeyFrame)
      const rightCurrentKeyFrameIndex = this.keyframeList.indexOf(rightCurrentKeyFrame)
      const lastIndex = this.keyframeList.length - 1
      if (leftCurrentKeyFrameIndex >= lastIndex || rightCurrentKeyFrameIndex >= lastIndex) {
        this.setLeftCurrentFrame(this.keyframeList[lastIndex - 1] || this.keyframeList[lastIndex])
        this.setRightCurrentFrame(this.keyframeList[lastIndex])
      } else if (leftCurrentKeyFrameIndex === rightCurrentKeyFrameIndex) {
        this.setLeftCurrentFrame(leftCurrentKeyFrame)
        this.setRightCurrentFrame(this.keyframeList[leftCurrentKeyFrameIndex + 1])
      } else if (leftCurrentKeyFrameIndex < rightCurrentKeyFrameIndex) {
        if (leftCurrentKeyFrameIndex + 2 > lastIndex) {
          this.setLeftCurrentFrame(this.keyframeList[lastIndex - 1] || this.keyframeList[lastIndex])
          this.setRightCurrentFrame(this.keyframeList[lastIndex])
        } else {
          this.setLeftCurrentFrame(this.keyframeList[leftCurrentKeyFrameIndex + 1])
          this.setRightCurrentFrame(this.keyframeList[leftCurrentKeyFrameIndex + 2])
        }
      } else {
        this.setLeftCurrentFrame(leftCurrentKeyFrame)
        this.setRightCurrentFrame(this.keyframeList[leftCurrentKeyFrameIndex + 1])
      }
    },
    handleKeyup (event) {
      if (event.target.nodeName.toLowerCase() === 'input') {
        return false
      }
      if (event.keyCode === 0xBC) { // comma, <
        this.handlePreviousKeyframe()
      } else if (event.keyCode === 0xBE) { // period, >
        this.handleNextKeyframe()
      }
    },
    toFixed2 (value) {
      if (value) {
        return value.toFixed(2)
      } else {
        return '0.00'
      }
    },
  },
  computed: {
    video () {
      return this.$store.state.annotation.video
    },
    leftCurrentFrame: {
      get () {
        return this.$store.state.annotation.leftCurrentFrame
      },
      set (value) {
        this.setLeftCurrentFrame(value)
      },
    },
    rightCurrentFrame: {
      get () {
        return this.$store.state.annotation.rightCurrentFrame
      },
      set (value) {
        this.setRightCurrentFrame(value)
      },
    },
    CurrentFrameRange: {
      get () {
        return {
          min: Math.min(this.leftCurrentFrame, this.rightCurrentFrame),
          max: Math.max(this.leftCurrentFrame, this.rightCurrentFrame),
        }
      },
      set (value) {
        this.setLeftCurrentFrame(value.min)
        this.setRightCurrentFrame(value.max)
      },
    },
    keyframeList () {
      return this.$store.state.annotation.keyframeList
    },
    rangeStyle () {
      const ret = {
        transform: 'translateY(14px)',
      }
      for (const key of ['--tick-bg', '--tick-bg-pos', '--tick-bg-size']) {
        ret[key] = this.keyframeRangeStyle[key]
        if (this.objectAnnotationRangeStyle[key]) {
          ret[key] += ',' + this.objectAnnotationRangeStyle[key]
        }
        if (this.regionAnnotationRangeStyle[key]) {
          ret[key] += ',' + this.regionAnnotationRangeStyle[key]
        }
        if (this.skeletonAnnotationRangeStyle[key]) {
          ret[key] += ',' + this.skeletonAnnotationRangeStyle[key]
        }
        if (this.actionAnnotationRangeStyle[key]) {
          ret[key] += ',' + this.actionAnnotationRangeStyle[key]
        }
      }
      return ret
    },
  },
  watch: {
    '$store.state.annotation.keyframeList': {
      handler (keyframeList) {
        const ticksBg = []
        const ticksBgPos = []
        const ticksBgSize = []
        const sliderWidth = this.$refs.slider ? this.$refs.slider.$el.clientWidth : 0
        // keyframe
        for (const frame of keyframeList) {
          const color = 'black'
          const size = {
            width: sliderWidth / this.video.frames,
            height: 2,
          }
          const position = {
            x: frame / this.video.frames * sliderWidth - size.width / 2,
            y: 9,
          }
          ticksBg.push(`linear-gradient(to right, ${color} 0, ${color} 100%)`)
          ticksBgPos.push(`${position.x}px ${position.y}px`)
          ticksBgSize.push(`${size.width}px ${size.height}px`)
        }
        this.keyframeRangeStyle = {
          '--tick-bg': ticksBg.join(', '),
          '--tick-bg-pos': ticksBgPos.join(', '),
          '--tick-bg-size': ticksBgSize.join(', '),
        }
      },
      immediate: true,
    },
    '$store.state.annotation.objectAnnotationListMap': {
      handler (objectAnnotationListMap) {
        if (objectAnnotationListMap) {
          const ticksBg = []
          const ticksBgPos = []
          const ticksBgSize = []
          const sliderWidth = this.$refs.slider ? this.$refs.slider.$el.clientWidth : 0
          for (const frame in objectAnnotationListMap) {
            if (objectAnnotationListMap[frame].length !== 0) {
              const color = 'blue'
              const size = {
                width: sliderWidth / this.video.frames,
                height: 2,
              }
              const position = {
                x: frame / this.video.frames * sliderWidth - size.width / 2,
                y: 11,
              }
              ticksBg.push(`linear-gradient(to right, ${color} 0, ${color} 100%)`)
              ticksBgPos.push(`${position.x}px ${position.y}px`)
              ticksBgSize.push(`${size.width}px ${size.height}px`)
            }
          }
          this.objectAnnotationRangeStyle = {
            '--tick-bg': ticksBg.join(', '),
            '--tick-bg-pos': ticksBgPos.join(', '),
            '--tick-bg-size': ticksBgSize.join(', '),
          }
        }
      },
      immediate: true,
    },
    '$store.state.annotation.regionAnnotationListMap': {
      handler (regionAnnotationListMap) {
        if (regionAnnotationListMap) {
          const ticksBg = []
          const ticksBgPos = []
          const ticksBgSize = []
          const sliderWidth = this.$refs.slider ? this.$refs.slider.$el.clientWidth : 0
          for (const frame in regionAnnotationListMap) {
            if (regionAnnotationListMap[frame].length !== 0) {
              const color = 'red'
              const size = {
                width: sliderWidth / this.video.frames,
                height: 2,
              }
              const position = {
                x: frame / this.video.frames * sliderWidth - size.width / 2,
                y: 13,
              }
              ticksBg.push(`linear-gradient(to right, ${color} 0, ${color} 100%)`)
              ticksBgPos.push(`${position.x}px ${position.y}px`)
              ticksBgSize.push(`${size.width}px ${size.height}px`)
            }
          }
          this.regionAnnotationRangeStyle = {
            '--tick-bg': ticksBg.join(', '),
            '--tick-bg-pos': ticksBgPos.join(', '),
            '--tick-bg-size': ticksBgSize.join(', '),
          }
        }
      },
      immediate: true,
    },
    '$store.state.annotation.skeletonAnnotationListMap': {
      handler (skeletonAnnotationListMap) {
        if (skeletonAnnotationListMap) {
          const ticksBg = []
          const ticksBgPos = []
          const ticksBgSize = []
          const sliderWidth = this.$refs.slider ? this.$refs.slider.$el.clientWidth : 0
          for (const frame in skeletonAnnotationListMap) {
            if (skeletonAnnotationListMap[frame].length !== 0) {
              const color = 'green'
              const size = {
                width: sliderWidth / this.video.frames,
                height: 2,
              }
              const position = {
                x: frame / this.video.frames * sliderWidth - size.width / 2,
                y: 15,
              }
              ticksBg.push(`linear-gradient(to right, ${color} 0, ${color} 100%)`)
              ticksBgPos.push(`${position.x}px ${position.y}px`)
              ticksBgSize.push(`${size.width}px ${size.height}px`)
            }
          }
          this.skeletonAnnotationRangeStyle = {
            '--tick-bg': ticksBg.join(', '),
            '--tick-bg-pos': ticksBgPos.join(', '),
            '--tick-bg-size': ticksBgSize.join(', '),
          }
        }
      },
      immediate: true,
    },
    '$store.state.annotation.actionAnnotationList': {
      handler (actionAnnotationList) {
        if (actionAnnotationList) {
          const ticksBg = []
          const ticksBgPos = []
          const ticksBgSize = []
          const sliderWidth = this.$refs.slider ? this.$refs.slider.$el.clientWidth : 0
          for (const actionAnnotation of actionAnnotationList) {
            if (typeof actionAnnotation.start === 'number' && typeof actionAnnotation.end === 'number') {
              const startFrame = utils.time2index(actionAnnotation.start)
              const endFrame = utils.time2index(actionAnnotation.end)
              const color = 'purple'
              const position = {
                x: startFrame / this.video.frames * sliderWidth,
                y: 17,
              }
              const size = {
                width: (endFrame - startFrame) / this.video.frames * sliderWidth,
                height: 2,
              }
              ticksBg.push(`linear-gradient(to right, ${color} 0, ${color} 100%)`)
              ticksBgPos.push(`${position.x}px ${position.y}px`)
              ticksBgSize.push(`${size.width}px ${size.height}px`)
            }
          }
          this.actionAnnotationRangeStyle = {
            '--tick-bg': ticksBg.join(', '),
            '--tick-bg-pos': ticksBgPos.join(', '),
            '--tick-bg-size': ticksBgSize.join(', '),
          }
        }
      },
      immediate: true,
      deep: true,
    },
  },
  mounted () {
    document.addEventListener('keyup', this.handleKeyup)
  },
  destroyed () {
    document.removeEventListener('keyup', this.handleKeyup)
  },
  template: KEYFRAMES_PANEL_TEMPLATE,
}
