/**
 * Store for annotations
 */

import utils from '../../libs/utils.js'
import { ActionAnnotation, ObjectAnnotation, RegionAnnotation, SkeletonAnnotation } from '../../libs/annotationlib.js'

export default {
  state: () => ({
    debug: false,
    video: {
      src: null,
      fps: 10,
    },
    keyframeList: [],
    leftCurrentFrame: 0,
    rightCurrentFrame: 50,
    cachedFrameList: [],
    mode: 'object', // 'object', 'region', 'skeleton'
    skeletonTypeId: 0,
    objectAnnotationListMap: {},
    regionAnnotationListMap: {},
    skeletonAnnotationListMap: {},
    actionAnnotationList: [],
    zoom: false,
    isSaved: true,
  }),
  getters: {
    exportAnnotation (state) {
      // remove type in each skeletonAnnotation
      const skeletonAnnotationListMap = {}
      for (const frame in state.skeletonAnnotationListMap) {
        skeletonAnnotationListMap[frame] = state.skeletonAnnotationListMap[frame].map(skeletonAnnotation => {
          return {
            instance: skeletonAnnotation.instance,
            score: skeletonAnnotation.score,
            centerX: skeletonAnnotation.centerX,
            centerY: skeletonAnnotation.centerY,
            typeId: skeletonAnnotation.typeId,
            color: skeletonAnnotation.color,
            _ratio: skeletonAnnotation._ratio,
            pointList: skeletonAnnotation.pointList,
          }
        })
      }
      return {
        video: state.video,
        keyframeList: state.keyframeList,
        objectAnnotationListMap: state.objectAnnotationListMap,
        regionAnnotationListMap: state.regionAnnotationListMap,
        skeletonAnnotationListMap,
        actionAnnotationList: state.actionAnnotationList,
      }
    },
  },
  mutations: {
    setVideoSrc (state, value) {
      Vue.set(state.video, 'src', value)
      Vue.set(state, 'isSaved', true)
    },
    setVideoDuration (state, value) {
      Vue.set(state.video, 'duration', value)
      Vue.set(state.video, 'frames', Math.floor(state.video.fps * value))
    },
    setVideoWidth (state, value) {
      Vue.set(state.video, 'width', value)
    },
    setVideoHeight (state, value) {
      Vue.set(state.video, 'height', value)
    },
    setVideoFPS (state, value) {
      Vue.set(state.video, 'fps', value)
    },
    closeVideo (state) {
      Vue.set(state.video, 'src', null)
      Vue.set(state.video, 'duration', null)
      Vue.set(state.video, 'frames', null)
      Vue.set(state.video, 'width', null)
      Vue.set(state.video, 'height', null)
      Vue.set(state.video, 'frames', null)
      Vue.set(state, 'keyframeList', [])
      Vue.set(state, 'leftCurrentFrame', 0)
      Vue.set(state, 'rightCurrentFrame', state.video.fps * 5)
      Vue.set(state, 'cachedFrameList', [])
      Vue.set(state, 'skeletonTypeId', 0)
      Vue.set(state, 'objectAnnotationListMap', {})
      Vue.set(state, 'regionAnnotationListMap', {})
      Vue.set(state, 'skeletonAnnotationListMap', {})
      Vue.set(state, 'actionAnnotationList', [])
      Vue.set(state, 'isSaved', true)
    },
    setKeyframeList (state, value) {
      Vue.set(state, 'keyframeList', value)
    },
    setLeftCurrentFrame (state, value) {
      Vue.set(state, 'leftCurrentFrame', value)
      if (!state.cachedFrameList[value]) {
        document.getElementById('video').currentTime = utils.index2time(value)
      }
    },
    setRightCurrentFrame (state, value) {
      Vue.set(state, 'rightCurrentFrame', value)
      if (!state.cachedFrameList[value]) {
        document.getElementById('video').currentTime = utils.index2time(value)
      }
    },
    cacheFrame (state, value) {
      Vue.set(state.cachedFrameList, value['index'], value['frame'])
    },
    setCacheFrameList (state, value) {
      Vue.set(state.cachedFrameList, value)
    },
    setMode (state, value) {
      Vue.set(state, 'mode', value)
    },
    setSkeletonTypeId (state, value) {
      Vue.set(state, 'skeletonTypeId', value)
    },
    setObjectAnnotationListMap (state, value) {
      Vue.set(state, 'objectAnnotationListMap', value)
      Vue.set(state, 'isSaved', false)
    },
    setRegionAnnotationListMap (state, value) {
      Vue.set(state, 'regionAnnotationListMap', value)
      Vue.set(state, 'isSaved', false)
    },
    setSkeletonAnnotationListMap (state, value) {
      Vue.set(state, 'skeletonAnnotationListMap', value)
      Vue.set(state, 'isSaved', false)
    },
    setAnnotationList (state, value) {
      if (value.mode === 'object') {
        Vue.set(state.objectAnnotationListMap, value.index, value.annotationList)
      } else if (value.mode === 'region') {
        Vue.set(state.regionAnnotationListMap, value.index, value.annotationList)
      } else if (value.mode === 'skeleton') {
        Vue.set(state.skeletonAnnotationListMap, value.index, value.annotationList)
      } else {
        throw 'Unknown mode: ' + value.mode
      }
      Vue.set(state, 'isSaved', false)
    },
    setActionAnnotationList (state, value) {
      Vue.set(state, 'actionAnnotationList', value)
      Vue.set(state, 'isSaved', false)
    },
    setZoom (state, value) {
      Vue.set(state, 'zoom', value)
    },
    setIsSaved (state, value) {
      Vue.set(state, 'isSaved', value)
    },
    importAnnotation (state, data) {
      const {
        video,
        keyframeList,
        objectAnnotationListMap,
        regionAnnotationListMap,
        skeletonAnnotationListMap,
        actionAnnotationList,
      } = data
      /// video
      this.commit('setVideoFPS', video.fps)
      this.commit('setCacheFrameList', [])
      /// keyframeList
      this.commit('setKeyframeList', keyframeList)
      this.commit('setLeftCurrentFrame', 0)
      // TODO: hack
      setTimeout(() => {
        this.commit('setRightCurrentFrame', keyframeList.length > 2 ? keyframeList[1] : keyframeList[0])
      }, 500)
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
            objectAnnotation.score,
          )
        }
      }
      this.commit('setObjectAnnotationListMap', objectAnnotationListMap)
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
            regionAnnotation.score,
          )
        }
      }
      this.commit('setRegionAnnotationListMap', regionAnnotationListMap)
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
            skeletonAnnotation.score,
          )
          newSkeletonAnnotation._ratio = skeletonAnnotation._ratio
          newSkeletonAnnotation.pointList = skeletonAnnotation.pointList
          skeletonAnnotationList[i] = newSkeletonAnnotation
        }
      }
      this.commit('setSkeletonAnnotationListMap', skeletonAnnotationListMap)
      /// actionAnnotationList
      for (let i in actionAnnotationList) {
        const actionAnnotation = actionAnnotationList[i]
        actionAnnotationList[i] = new ActionAnnotation(
          actionAnnotation.start,
          actionAnnotation.end,
          actionAnnotation.action,
          actionAnnotation.object,
          actionAnnotation.color,
          actionAnnotation.description,
        )
      }
      this.commit('setActionAnnotationList', actionAnnotationList)
    },
  },
  actions: {},
}
