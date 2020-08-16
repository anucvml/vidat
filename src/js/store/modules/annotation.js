import utils from '../../libs/utils.js'

export default {
  state: () => ({
    debug: false,
    video: {
      src: null,
      fps: 10,
    },
    secondPerKeyframe: 5,
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
  }),
  getters: {},
  mutations: {
    setDebug (state, value) {
      Vue.set(state, 'debug', value)
    },
    setVideoSrc (state, value) {
      Vue.set(state.video, 'src', value)
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
      Vue.set(state, 'rightCurrentFrame', value * state.secondPerKeyframe)
    },
    closeVideo (state) {
      Vue.set(state.video, 'src', null)
      Vue.set(state.video, 'duration', null)
      Vue.set(state.video, 'frames', null)
      Vue.set(state.video, 'width', null)
      Vue.set(state.video, 'height', null)
      Vue.set(state.video, 'frames', null)
      Vue.set(state, 'secondPerKeyframe', 5)
      Vue.set(state, 'keyframeList', [])
      Vue.set(state, 'leftCurrentFrame', 0)
      Vue.set(state, 'rightCurrentFrame', state.video.fps * 5)
      Vue.set(state, 'cachedFrameList', [])
    },
    setSecondPerKeyframe (state, value) {
      Vue.set(state, 'secondPerKeyframe', value)
      let keyframeList = []
      for (let keyframe = 0; keyframe < state.video.duration; keyframe += value) {
        keyframeList.push(keyframe * state.video.fps)
      }
      Vue.set(state, 'keyframeList', keyframeList)
      Vue.set(state, 'leftCurrentFrame', 0)
      Vue.set(state, 'rightCurrentFrame', value * state.video.fps)
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
    },
    setRegionAnnotationListMap (state, value) {
      Vue.set(state, 'regionAnnotationListMap', value)
    },
    setSkeletonAnnotationListMap (state, value) {
      Vue.set(state, 'skeletonAnnotationListMap', value)
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
    },
    setActionAnnotationList (state, value) {
      Vue.set(state, 'actionAnnotationList', value)
    },
    setZoom (state, value) {
      Vue.set(state, 'zoom', value)
    },
  },
  actions: {},
}
