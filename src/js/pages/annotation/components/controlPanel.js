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
        <q-btn @click="handleCopyLeft" icon="arrow_back">
          <q-tooltip>copy from right to left</q-tooltip>
        </q-btn>
        <q-btn @click="handleCopyRight" icon="arrow_forward">
          <q-tooltip>copy from left to right</q-tooltip>
        </q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="handleReplaceLeft" icon="first_page">
          <q-tooltip>replace left with right</q-tooltip>
        </q-btn>
        <q-btn @click="handleReplaceRight" icon="last_page">
          <q-tooltip>replace right with left</q-tooltip>
        </q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="handleInterpolate" icon="double_arrow" label="fill">
          <q-tooltip>interpolate between with same instance id</q-tooltip>
        </q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item dense>
    <q-item-section class="text-center">Mode</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-select
        ref="modeSelect"
        :readonly="modeOptions.length === 1"
        v-model="mode"
        outlined
        stack-label
        dense
        options-dense
        :options="modeOptions"
      ></q-select>
    </q-item-section>
  </q-item>
  <q-item v-if="mode === 'skeleton'">
    <q-item-section>
      <q-select
        v-model="skeletonTypeId"
        outlined
        stack-label
        dense
        options-dense
        map-options
        :options="skeletonTypeOptions"
      ></q-select>
    </q-item-section>
  </q-item>
  <q-item v-if="$q.platform.has.touch">
    <q-item-section>
      <q-toggle v-model="delMode" label="Delete"></q-toggle>
      <q-toggle v-model="copyMode" label="Copy"></q-toggle>
      <q-toggle v-if="mode === 'region'" v-model="addPointMode" label="Add Point"></q-toggle>
      <q-toggle v-if="mode === 'region'" v-model="delPointMode" label="Del Point"></q-toggle>
      <q-toggle v-if="mode === 'skeleton'" v-model="indicatingMode" label="Indicate"></q-toggle>
    </q-item-section>
  </q-item>
  <q-item dense>
    <q-item-section class="text-center">Operation</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn @click="handleBulkClear" label="bulk" icon="delete_forever">
        <q-tooltip>Clear all annotations between left and right frame</q-tooltip>
      </q-btn>
    </q-item-section>
  </q-item>
  <q-item dense>
    <q-item-section class="text-center">Options</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-toggle v-model="grayscale" label="Grayscale"></q-toggle>
      <q-toggle v-model="showPopup" label="Show popup"></q-toggle>
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
  mounted () {
    const modeMap = {
      'object': this.preference.objects,
      'region': this.preference.regions,
      'skeleton': this.preference.skeletons,
    }
    if (!modeMap[this.mode]) {
      this.$refs['modeSelect'].showPopup()
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setMode',
      'setSkeletonTypeId',
      'setGrayscale',
      'setShowPopup',
      'setDelMode',
      'setCopyMode',
      'setAddPointMode',
      'setDelPointMode',
      'setIndicatingMode',
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
      if (this.leftCurrentFrame === this.rightCurrentFrame) {
        utils.notify('Cannot copy from itself.')
        return
      }
      if (this.annotationListMap[this.rightCurrentFrame].length === 0) {
        utils.notify('There is nothing to copy.')
        return
      }
      this.setAnnotationList({
        index: this.leftCurrentFrame,
        mode: this.mode,
        annotationList: [
          ...this.annotationListMap[this.leftCurrentFrame],
          ...this.clone(this.annotationListMap[this.rightCurrentFrame]),
        ],
      })
    },
    handleCopyRight () {
      if (this.leftCurrentFrame === this.rightCurrentFrame) {
        utils.notify('Cannot copy from itself.')
        return
      }
      if (this.annotationListMap[this.leftCurrentFrame].length === 0) {
        utils.notify('There is nothing to copy.')
        return
      }
      this.setAnnotationList({
        index: this.rightCurrentFrame,
        mode: this.mode,
        annotationList: [
          ...this.annotationListMap[this.rightCurrentFrame],
          ...this.clone(this.annotationListMap[this.leftCurrentFrame]),
        ],
      })
    },
    handleReplaceLeft () {
      if (this.leftCurrentFrame === this.rightCurrentFrame) {
        utils.notify('Cannot replace with itself.')
        return
      }
      if (this.annotationListMap[this.rightCurrentFrame].length === 0) {
        utils.notify('There is nothing to replace.')
        return
      }
      if (this.annotationListMap[this.leftCurrentFrame].length === 0) {
        this.setAnnotationList({
          index: this.leftCurrentFrame,
          mode: this.mode,
          annotationList: [
            ...this.clone(this.annotationListMap[this.rightCurrentFrame]),
          ],
        })
      } else {
        utils.confirm('Are you sure to replace? This would remove ALL annotations in the LEFT panel!').onOk(() => {
          this.setAnnotationList({
            index: this.leftCurrentFrame,
            mode: this.mode,
            annotationList: [
              ...this.clone(this.annotationListMap[this.rightCurrentFrame]),
            ],
          })
        })
      }
    },
    handleReplaceRight () {
      if (this.leftCurrentFrame === this.rightCurrentFrame) {
        utils.notify('Cannot replace with itself.')
      }
      if (this.annotationListMap[this.leftCurrentFrame].length === 0) {
        utils.notify('There is nothing to replace.')
        return
      }
      if (this.annotationListMap[this.rightCurrentFrame].length === 0) {
        this.setAnnotationList({
          index: this.rightCurrentFrame,
          mode: this.mode,
          annotationList: [
            ...this.clone(this.annotationListMap[this.leftCurrentFrame]),
          ],
        })
      } else {
        utils.confirm('Are you sure to replace? This would remove ALL annotations in the RIGHT panel!').onOk(() => {
          this.setAnnotationList({
            index: this.rightCurrentFrame,
            mode: this.mode,
            annotationList: [
              ...this.clone(this.annotationListMap[this.leftCurrentFrame]),
            ],
          })
        })
      }
    },
    handleInterpolate () {
      const leftAnnotationList = this.annotationListMap[this.leftCurrentFrame]
      const rightAnnotationList = this.annotationListMap[this.rightCurrentFrame]
      const interpolateList = []
      for (const leftAnnotation of leftAnnotationList) {
        let cnt = 0
        for (const rightAnnotation of rightAnnotationList) {
          if (
            rightAnnotation.instance !== null &&
            leftAnnotation.instance !== null &&
            rightAnnotation.instance === leftAnnotation.instance &&
            ((this.mode === 'object' || this.mode === 'region') && rightAnnotation.labelId ===
              leftAnnotation.labelId) ||
            (this.mode === 'skeleton' && rightAnnotation.typeId === leftAnnotation.typeId)
          ) {
            // same number of points only
            if (this.mode === 'region') {
              if (leftAnnotation.pointList.length !== rightAnnotation.pointList.length) {
                utils.notify('Interpolating between different #points regions is not supported!')
                continue
              }
            }
            cnt += 1
            if (cnt > 1) {
              utils.notify('Can not interpolate from one to many.')
              continue
            }
            interpolateList.push({
              leftAnnotation,
              rightAnnotation,
            })
          }
        }
      }
      if (interpolateList.length === 0) {
        utils.notify('There is nothing to interpolate.')
        return
      }
      for (const interpolate of interpolateList) {
        const leftAnnotation = interpolate.leftAnnotation
        const rightAnnotation = interpolate.rightAnnotation
        let i = 1
        const nFrames = this.rightCurrentFrame - this.leftCurrentFrame - 1
        for (let frame = this.leftCurrentFrame + 1; frame < this.rightCurrentFrame; frame++) {
          const ratio = i / nFrames
          i += 1
          const originalAnnotationList = this.annotationListMap[frame] || []
          // remove archive interpolations
          for (let k = 0; k < originalAnnotationList.length; k++) {
            if (
              originalAnnotationList[k].instance === leftAnnotation.instance &&
              (
                (
                  (this.mode === 'object' || this.mode === 'region') &&
                  originalAnnotationList[k].labelId === leftAnnotation.labelId
                )
                ||
                (
                  this.mode === 'skeleton' &&
                  originalAnnotationList[k].typeId === leftAnnotation.typeId
                )
              )
            ) {
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
            const newPointList = []
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
            const newPointList = []
            for (let k = 0; k < leftAnnotation.pointList.length; k++) {
              const leftPoint = leftAnnotation.pointList[k]
              const rightPoint = rightAnnotation.pointList[k]
              newPointList.push({
                id: leftPoint.id,
                name: leftPoint.name,
                x: leftPoint.x * (1 - ratio) + rightPoint.x * ratio,
                y: leftPoint.y * (1 - ratio) + rightPoint.y * ratio,
              })
            }
            const newSkeletonAnnotation = new SkeletonAnnotation(
              leftAnnotation.centerX * (1 - ratio) + rightAnnotation.centerX * ratio,
              leftAnnotation.centerY * (1 - ratio) + rightAnnotation.centerY * ratio,
              leftAnnotation.typeId,
              leftAnnotation.color,
              leftAnnotation.instance,
              leftAnnotation.score,
            )
            newSkeletonAnnotation.ratio = leftAnnotation.ratio * (1 - ratio) + rightAnnotation.ratio * ratio
            newSkeletonAnnotation.pointList = newPointList
            originalAnnotationList.push(newSkeletonAnnotation)
          }
          this.setAnnotationList({
            mode: this.mode,
            index: frame,
            annotationList: originalAnnotationList,
          })
        }
      }
      utils.notify('Interpolate successfully.')
    },
    handleBulkClear () {
      utils.confirm(
        `Are you sure to REMOVE ALL ${this.mode} annotations between frame ${this.leftCurrentFrame} to ${this.rightCurrentFrame}?`)
        .onOk(() => {
          for (let frame = this.leftCurrentFrame; frame <= this.rightCurrentFrame; frame += 1) {
            this.setAnnotationList({
              mode: this.mode,
              index: frame,
              annotationList: [],
            })
          }
          utils.notify('Bulk clear successful!')
        })
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
    skeletonTypeId: {
      get () {
        return this.$store.state.annotation.skeletonTypeId
      },
      set (value) {
        this.setSkeletonTypeId(value.value)
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
    delMode: {
      get () {
        return this.$store.state.delMode
      },
      set (value) {
        if (value) {
          this.setDelMode(true)
          this.setCopyMode(false)
          this.setAddPointMode(false)
          this.setDelPointMode(false)
          this.setIndicatingMode(false)
        }
        else {
          this.setDelMode(false)
        }
      },
    },
    copyMode: {
      get () {
        return this.$store.state.copyMode
      },
      set (value) {
        if (value) {
          this.setDelMode(false)
          this.setCopyMode(true)
          this.setAddPointMode(false)
          this.setDelPointMode(false)
          this.setIndicatingMode(false)
        }
        else {
          this.setCopyMode(false)
        }
      },
    },
    addPointMode: {
      get () {
        return this.$store.state.addPointMode
      },
      set (value) {
        if (value) {
          this.setDelMode(false)
          this.setCopyMode(false)
          this.setAddPointMode(true)
          this.setDelPointMode(false)
          this.setIndicatingMode(false)
        }
        else {
          this.setAddPointMode(false)
        }
      },
    },
    delPointMode: {
      get () {
        return this.$store.state.delPointMode
      },
      set (value) {
        if (value) {
          this.setDelMode(false)
          this.setCopyMode(false)
          this.setAddPointMode(false)
          this.setDelPointMode(true)
          this.setIndicatingMode(false)
        }
        else {
          this.setDelPointMode(false)
        }
      },
    },
    indicatingMode: {
      get () {
        return this.$store.state.indicatingMode
      },
      set (value) {
        if (value) {
          this.setDelMode(false)
          this.setCopyMode(false)
          this.setAddPointMode(false)
          this.setDelPointMode(false)
          this.setIndicatingMode(true)
        }
        else {
          this.setIndicatingMode(false)
        }
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
    skeletonTypeOptions () {
      return this.$store.state.settings.skeletonTypeData.map(type => {
        return {
          label: type.name,
          value: type.id,
        }
      })
    },
  },
  template: CONTROL_PANEL_TEMPLATE,
}
