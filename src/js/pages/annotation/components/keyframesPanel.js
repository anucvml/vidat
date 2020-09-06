const KEYFRAMES_PANEL_TEMPLATE = `
<div>
  <div v-if="video.src" class="row items-center q-mb-sm" style="min-height: 100px">
    <q-list class="col-12 row">
      <q-item class="q-px-md" dense>
        <q-item-section class="text-center">Keyframes:</q-item-section>
      </q-item>
      <q-item class="col q-pa-none">
        <q-range
          :style="rangeStyle"
          class="custom-range"
          v-model="CurrentFrameRange"
          :min="0"
          :max="video.frames"
          :step="1"
          :left-label-value="'L:' + CurrentFrameRange.min"
          :right-label-value="'R:' + CurrentFrameRange.max"
          label-always
          drag-range
          snap
        ></q-range>
      </q-item>
      <q-space></q-space>
      <q-item class="q-pa-none" dense>
        <q-btn-group flat dense spread>
          <q-btn @click="handlePreviousKeyframe" icon="keyboard_arrow_left"></q-btn>
          <q-btn @click="handleNearestKeyframe" icon="gps_fixed"></q-btn>
          <q-btn @click="handleNextKeyframe" icon="keyboard_arrow_right"></q-btn>
        </q-btn-group>
      </q-item>
    </q-list>
  </div>
</div>
`

export default {
  data: () => {
    return {
      rangeStyle: {},
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setLeftCurrentFrame',
      'setRightCurrentFrame',
    ]),
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
  },
  watch: {
    '$store.state.annotation.keyframeList': {
      handler (keyframeList) {
        const baseStyle = {
          transform: 'translateY(10px)',
        }
        const ticksBg = []
        const ticksBgPos = []
        const ticksBgSize = []
        for (const frame of keyframeList) {
          ticksBg.push('linear-gradient(to right, black 0, black 100%)')
          ticksBgPos.push(`${frame / this.video.frames * 100}% 5px`)
          ticksBgSize.push('2px 10px')
        }
        this.rangeStyle = {
          ...baseStyle,
          '--tick-bg': ticksBg.join(', '),
          '--tick-bg-pos': ticksBgPos.join(', '),
          '--tick-bg-size': ticksBgSize.join(', '),
        }
      },
      immediate: true,
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
