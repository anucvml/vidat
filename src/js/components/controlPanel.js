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
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-toggle v-model="grayscale" label="Grayscale"></q-toggle>
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

import utils from '../libs/utils.js'
import { ObjectAnnotation } from '../libs/annotationlib.js'

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
      if (this.mode === 'object') {
        const leftObjectAnnotationList = this.annotationListMap[this.leftCurrentFrame]
        const rightObjectAnnotationList = this.annotationListMap[this.rightCurrentFrame]
        let found = false
        for (let leftObjectAnnotation of leftObjectAnnotationList) {
          let rightObjectAnnotation = rightObjectAnnotationList.find(
            rightObjectAnnotation => rightObjectAnnotation.instance &&
              leftObjectAnnotation.instance &&
              rightObjectAnnotation.instance === leftObjectAnnotation.instance,
          )
          // decide whether to interpolate
          if (!rightObjectAnnotation) {
            break
          } else {
            found = true
          }
          // interpolate from left to right
          let i = 1
          const nFrames = this.rightCurrentFrame - this.leftCurrentFrame - 1
          for (let frame = this.leftCurrentFrame + 1; frame < this.rightCurrentFrame; frame++) {
            const ratio = i / nFrames
            i += 1
            const originalAnnotationList = this.annotationListMap[frame] || []
            // remove old interpolations
            for (let k = 0; k < originalAnnotationList.length; k++) {
              if (originalAnnotationList[k].instance === leftObjectAnnotation.instance) {
                originalAnnotationList.splice(k, 1)
              }
            }
            originalAnnotationList.push(new ObjectAnnotation(
              leftObjectAnnotation.x * (1 - ratio) + rightObjectAnnotation.x * ratio,
              leftObjectAnnotation.y * (1 - ratio) + rightObjectAnnotation.y * ratio,
              leftObjectAnnotation.width * (1 - ratio) + rightObjectAnnotation.width * ratio,
              leftObjectAnnotation.height * (1 - ratio) + rightObjectAnnotation.height * ratio,
              leftObjectAnnotation.labelId,
              leftObjectAnnotation.color,
              leftObjectAnnotation.instance,
              leftObjectAnnotation.score,
            ))
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
      } else if (this.mode === 'region') {

      } else if (this.mode === 'skeleton') {

      } else {
        utils.notify(this.mode + ' not support!')
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
        return this.$store.state.annotation.lockSliders
      },
      set (value) {
        this.setLockSliders(value)
        this.setLockSlidersDistance(this.rightCurrentFrame - this.leftCurrentFrame)
      },
    },
    grayscale: {
      get () {
        return this.$store.state.annotation.grayscale
      },
      set (value) {
        this.setGrayscale(value)
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
