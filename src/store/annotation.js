import deepClone from 'lodash.clonedeep'
import { defineStore } from 'pinia'
import { computed, reactive, toRefs, watch } from 'vue'
import utils from '~/libs/utils.js'
import { useMainStore } from '~/store/index.js'
import { usePreferenceStore } from '~/store/preference.js'
import { ActionAnnotation, ObjectAnnotation, RegionAnnotation, SkeletonAnnotation } from '../libs/annotationlib.js'

const DEFAULT_ANNOTATION = {
  video: {
    src: undefined,
    fps: undefined,
    frames: undefined,
    duration: undefined,
    height: undefined,
    width: undefined
  },

  objectAnnotationListMap: {},
  regionAnnotationListMap: {},
  skeletonAnnotationListMap: {},
  actionAnnotationList: [],

  leftCurrentFrame: 0,
  rightCurrentFrame: 0,
  keyframeList: [],
  mode: 'object', // 'object', 'region', 'skeleton', 'action'
  skeletonTypeId: 0,

  priorityQueue: [],
  backendQueue: [],
  cachedFrameList: [],
  isCaching: false,

  delMode: false,
  copyMode: false,
  addPointMode: false,
  delPointMode: false,
  indicatingMode: false
}

export const useAnnotationStore = defineStore('annotation', () => {
  const preferenceStore = usePreferenceStore()
  const mainStore = useMainStore()
  let defaultAnnotation = deepClone(DEFAULT_ANNOTATION)
  const state = reactive(DEFAULT_ANNOTATION)
  watch(
    () => [preferenceStore.objects, preferenceStore.regions, preferenceStore.skeletons, preferenceStore.actions],
    (newValue, oldValue) => {
      if (!newValue.includes(true)) {
        utils.notify('You cannot disable all four modes at the same time!', 'warning');
        [
          preferenceStore.objects,
          preferenceStore.regions,
          preferenceStore.skeletons,
          preferenceStore.actions
        ] = oldValue
      } else if (!newValue.slice(0, 3).includes(true) && newValue.at(-1) === true) {
        state.mode = 'action'
      } else if (!preferenceStore[state.mode + 's']) {
        state.mode = ['object', 'region', 'skeleton'].find(item => preferenceStore[item + 's'])
      }
    },
    {
      immediate: true
    }
  )
  watch(() => state.keyframeList, (newValue) => {
    if (newValue.length >= 2) {
      state.leftCurrentFrame = newValue[0]
      state.rightCurrentFrame = newValue[1]
    } else if (newValue.length === 1) {
      state.rightCurrentFrame = newValue[0]
      state.leftCurrentFrame = newValue[0]
    } else {
      state.rightCurrentFrame = 0
      state.leftCurrentFrame = 0
    }
  })
  watch(() => [
    state.objectAnnotationListMap,
    state.regionAnnotationListMap,
    state.skeletonAnnotationListMap,
    state.actionAnnotationList,
    state.keyframeList
  ], () => {
    mainStore.isSaved = false
  }, { deep: true })
  return {
    ...toRefs(state),
    hasVideo: computed(() => {
      return !!(state.video && state.video.src)
    }),
    reset: () => {
      const annotation = deepClone(defaultAnnotation)
      annotation.mode = state.mode
      annotation.zoom = state.zoom
      annotation.skeletonTypeId = state.skeletonTypeId
      annotation.isSaved = true
      Object.keys(state).map(key => state[key] = annotation[key])
    },
    exportAnnotation: () => {
      // remove type in each skeletonAnnotation
      const skeletonAnnotationListMap = {}
      for (const frame in state.skeletonAnnotationListMap) {
        skeletonAnnotationListMap[frame] = state.skeletonAnnotationListMap[frame].map(
          skeletonAnnotation => {
            return {
              instance: skeletonAnnotation.instance,
              score: skeletonAnnotation.score,
              centerX: skeletonAnnotation.centerX,
              centerY: skeletonAnnotation.centerY,
              typeId: skeletonAnnotation.typeId,
              color: skeletonAnnotation.color,
              _ratio: skeletonAnnotation._ratio,
              pointList: skeletonAnnotation.pointList
            }
          })
      }
      mainStore.isSaved = true
      return {
        video: state.video,
        keyframeList: state.keyframeList,
        objectAnnotationListMap: state.objectAnnotationListMap,
        regionAnnotationListMap: state.regionAnnotationListMap,
        skeletonAnnotationListMap,
        actionAnnotationList: state.actionAnnotationList
      }
    },
    importAnnotation: (data) => {
      const {
        video,
        keyframeList,
        objectAnnotationListMap,
        regionAnnotationListMap,
        skeletonAnnotationListMap,
        actionAnnotationList
      } = data
      /// video
      if (!state.video.src && video.src.startsWith('blob')) {
        throw 'The src of video is blob (local), please load video first!'
      } else {
        state.video = video
      }
      /// keyframeList
      state.keyframeList = keyframeList
      state.rightCurrentFrame = keyframeList.length >= 2 ? keyframeList[1] : keyframeList[0]
      /// objectAnnotationListMap
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
            objectAnnotation.score
          )
        }
      }
      state.objectAnnotationListMap = objectAnnotationListMap
      /// regionAnnotationListMap
      for (let frame in regionAnnotationListMap) {
        const regionAnnotationList = regionAnnotationListMap[frame]
        for (let i in regionAnnotationList) {
          let regionAnnotation = regionAnnotationList[i]
          regionAnnotationList[i] = new RegionAnnotation(
            regionAnnotation.pointList,
            regionAnnotation.labelId,
            regionAnnotation.color,
            regionAnnotation.instance,
            regionAnnotation.score
          )
        }
      }
      state.regionAnnotationListMap = regionAnnotationListMap
      /// skeletonAnnotationListMap
      for (let frame in skeletonAnnotationListMap) {
        const skeletonAnnotationList = skeletonAnnotationListMap[frame]
        for (let i in skeletonAnnotationList) {
          let skeletonAnnotation = skeletonAnnotationList[i]
          const newSkeletonAnnotation = new SkeletonAnnotation(
            skeletonAnnotation.centerX,
            skeletonAnnotation.centerY,
            skeletonAnnotation.typeId,
            skeletonAnnotation.color,
            skeletonAnnotation.instance,
            skeletonAnnotation.score
          )
          newSkeletonAnnotation._ratio = skeletonAnnotation._ratio
          newSkeletonAnnotation.pointList = skeletonAnnotation.pointList
          skeletonAnnotationList[i] = newSkeletonAnnotation
        }
      }
      state.skeletonAnnotationListMap = skeletonAnnotationListMap
      /// actionAnnotationList
      for (let i in actionAnnotationList) {
        const actionAnnotation = actionAnnotationList[i]
        actionAnnotationList[i] = new ActionAnnotation(
          actionAnnotation.start,
          actionAnnotation.end,
          actionAnnotation.action,
          actionAnnotation.object,
          actionAnnotation.color,
          actionAnnotation.description
        )
      }
      state.actionAnnotationList = actionAnnotationList
      mainStore.isSaved = true
    }
  }
})
