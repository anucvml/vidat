const CONTROL_PANEL_TEMPLATE = `
<q-list style="max-width: 160px;">
  <q-item dense>
    <q-item-section class="text-center">
      Copy
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="handleCopyLeft" icon="arrow_back"></q-btn>
        <q-btn @click="handleCopyRight" icon="arrow_forward"></q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="handleReplaceLeft" icon="first_page"></q-btn>
        <q-btn @click="handleReplaceRight" icon="last_page"></q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="handleInterpolate" icon="double_arrow">FILL</q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item dense>
    <q-item-section class="text-center">Mode</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-select
        v-model="mode"
        outlined
        stack-label
        dense
        options-dense
        :options="modeOptions"
      ></q-select>
    </q-item-section>
  </q-item>
  <q-item dense>
    <q-item-section class="text-center">Options</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-toggle v-model="lockSliders" label="Lock sliders"></q-toggle>
      <q-toggle v-model="grayscale" label="Grayscale"></q-toggle>
      <q-toggle v-model="showPopup" label="Show popup"></q-toggle>
    </q-item-section>
  </q-item>
  <q-item dense>
    <q-item-section class="text-center">Frames</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
       <q-btn class="full-width" @click="handleSwap" icon="swap_horiz">swap</q-btn>
    </q-item-section>
  </q-item>
</q-list>
`

import utils from '../../../libs/utils.js'
import { ObjectAnnotation, RegionAnnotation, SkeletonAnnotation } from '../../../libs/annotationlib.js'

export default {
  data: () => {
    return {
      utils,
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setMode',
      'setLockSliders',
      'setGrayscale',
      'setShowPopup',
      'setLockSlidersDistance',
      'setLeftCurrentFrame',
      'setRightCurrentFrame',
      'setAnnotationList',
    ]),
    clone (annotationList) {
      let ret = []
      for (let annotation of annotationList) {
        ret.push(annotation.clone())
      }
      return ret
    },
    handleCopyLeft () {
      if (this.leftCurrentFrame !== this.rightCurrentFrame) {
        this.setAnnotationList({
          index: this.leftCurrentFrame,
          mode: this.mode,
          annotationList: [
            ...this.annotationListMap[this.leftCurrentFrame],
            ...this.clone(this.annotationListMap[this.rightCurrentFrame]),
          ],
        })
      }
    },
    handleCopyRight () {
      if (this.leftCurrentFrame !== this.rightCurrentFrame) {
        this.setAnnotationList({
          index: this.rightCurrentFrame,
          mode: this.mode,
          annotationList: [
            ...this.annotationListMap[this.rightCurrentFrame],
            ...this.clone(this.annotationListMap[this.leftCurrentFrame]),
          ],
        })
      }
    },
    handleReplaceLeft () {
      if (this.leftCurrentFrame !== this.rightCurrentFrame) {
        this.setAnnotationList({
          index: this.leftCurrentFrame,
          mode: this.mode,
          annotationList: [
            ...this.clone(this.annotationListMap[this.rightCurrentFrame]),
          ],
        })
      }
    },
    handleReplaceRight () {
      if (this.leftCurrentFrame !== this.rightCurrentFrame) {
        this.setAnnotationList({
          index: this.rightCurrentFrame,
          mode: this.mode,
          annotationList: [
            ...this.clone(this.annotationListMap[this.leftCurrentFrame]),
          ],
        })
      }
    },
    handleInterpolate () {
      const leftAnnotationList = this.annotationListMap[this.leftCurrentFrame]
      const rightAnnotationList = this.annotationListMap[this.rightCurrentFrame]
      let found = false
      for (let leftAnnotation of leftAnnotationList) {
        let rightAnnotation = rightAnnotationList.find(
          rightAnnotation => rightAnnotation.instance &&
            leftAnnotation.instance &&
            rightAnnotation.instance === leftAnnotation.instance,
        )
        // decide whether to interpolate
        if (!rightAnnotation) {
          break
        } else {
          found = true
        }
        let i = 1
        const nFrames = this.rightCurrentFrame - this.leftCurrentFrame - 1
        for (let frame = this.leftCurrentFrame + 1; frame < this.rightCurrentFrame; frame++) {
          const ratio = i / nFrames
          i += 1
          const originalAnnotationList = this.annotationListMap[frame] || []
          // remove archive interpolations
          for (let k = 0; k < originalAnnotationList.length; k++) {
            if (originalAnnotationList[k].instance === leftAnnotation.instance) {
              originalAnnotationList.splice(k, 1)
            }
          }
          // interpolate from left to right
          if (this.mode === 'object') {
            originalAnnotationList.push(new ObjectAnnotation(
              leftAnnotation.x * (1 - ratio) + rightAnnotation.x * ratio,
              leftAnnotation.y * (1 - ratio) + rightAnnotation.y * ratio,
              leftAnnotation.width * (1 - ratio) + rightAnnotation.width * ratio,
              leftAnnotation.height * (1 - ratio) + rightAnnotation.height * ratio,
              leftAnnotation.labelId,
              leftAnnotation.color,
              leftAnnotation.instance,
              leftAnnotation.score,
            ))
          } else if (this.mode === 'region') {
            // same number of points only
            if (leftAnnotation.pointList.length !== rightAnnotation.pointList.length) {
              utils.notify('Interpolate between different #points regions not supported!')
              return
            }
            let newPointList = []
            for (let k = 0; k < leftAnnotation.pointList.length; k++) {
              const leftPoint = leftAnnotation.pointList[k]
              const rightPoint = rightAnnotation.pointList[k]
              newPointList.push({
                x: leftPoint.x * (1 - ratio) + rightPoint.x * ratio,
                y: leftPoint.y * (1 - ratio) + rightPoint.y * ratio,
              })
            }
            originalAnnotationList.push(new RegionAnnotation(
              newPointList,
              leftAnnotation.labelId,
              leftAnnotation.color,
              leftAnnotation.instance,
              leftAnnotation.score,
            ))
          } else if (this.mode === 'skeleton') {
            let newPointList = []
            for (let k = 0; k < leftAnnotation.pointList.length; k++) {
              const leftPoint = leftAnnotation.pointList[k]
              const rightPoint = rightAnnotation.pointList[k]
              newPointList.push({
                x: leftPoint.x * (1 - ratio) + rightPoint.x * ratio,
                y: leftPoint.y * (1 - ratio) + rightPoint.y * ratio,
              })
            }
            const newSkeletonAnnotation = new SkeletonAnnotation(
              leftAnnotation.centerX * (1 - ratio) + rightAnnotation.centerX * ratio,
              leftAnnotation.centerY * (1 - ratio) + rightAnnotation.centerY * ratio,
              leftAnnotation.labelId,
              leftAnnotation.color,
              leftAnnotation.instance,
              leftAnnotation.score,
            )
            newSkeletonAnnotation.ratio = leftAnnotation.ratio * (1 - ratio) + rightAnnotation.ratio * ratio
            newSkeletonAnnotation.pointList = newPointList
            originalAnnotationList.push(newSkeletonAnnotation)
          } else {
            utils.notify(this.mode + ' not support!')
            return
          }
          this.setAnnotationList({
            mode: this.mode,
            index: frame,
            annotationList: originalAnnotationList,
          })
        }
      }
      if (found) {
        utils.notify('Interpolated successfully.')
      } else {
        utils.notify('There is nothing to interpolate.')
      }
    },
    handleSwap () {
      const leftCurrentFrame = this.leftCurrentFrame
      this.leftCurrentFrame = this.rightCurrentFrame
      this.rightCurrentFrame = leftCurrentFrame
    },
  },
  computed: {
    mode: {
      get () {
        return this.$store.state.annotation.mode
      },
      set (value) {
        this.setMode(value)
      },
    },
    lockSliders: {
      get () {
        return this.$store.state.settings.lockSliders
      },
      set (value) {
        this.setLockSliders(value)
        this.setLockSlidersDistance(this.rightCurrentFrame - this.leftCurrentFrame)
      },
    },
    grayscale: {
      get () {
        return this.$store.state.settings.grayscale
      },
      set (value) {
        this.setGrayscale(value)
      },
    },
    showPopup: {
      get () {
        return this.$store.state.settings.showPopup
      },
      set (value) {
        this.setShowPopup(value)
      },
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
    annotationListMap () {
      return eval('this.$store.state.annotation.' + this.mode + 'AnnotationListMap')
    },
    preference () {
      return this.$store.state.settings.preferenceData
    },
    modeOptions () {
      const ret = []
      if (this.preference.objects) {
        ret.push('object')
      }
      if (this.preference.regions) {
        ret.push('region')
      }
      if (this.preference.skeletons) {
        ret.push('skeleton')
      }
      return ret
    },
  },
  template: CONTROL_PANEL_TEMPLATE,
}
