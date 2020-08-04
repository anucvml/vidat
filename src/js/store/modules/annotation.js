export default {
  state: () => ({
    video: {
      src: null,
      fps: 10,
    },
    secondPerKeyframe: 5,
    keyframeList: {},
    leftCurrentFrame: 0,
    rightCurrentFrame: 50,
    mode: 'object', // 'object', 'region', 'skeleton'
    lockSliders: false,
    lockSlidersDistance: 0,
    grayscale: false,
    objectAnnotationListMap: {},
    regionAnnotationListMap: {},
    skeletonAnnotationListMap: {},
    zoom: false,
  }),
  getters: {},
  mutations: {
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
      Vue.set(state.video, 'fps', 10)
      Vue.set(state.video, 'frames', null)
      Vue.set(state, 'secondPerKeyframe', 5)
      Vue.set(state, 'keyframeList', {})
      Vue.set(state, 'leftCurrentFrame', 0)
      Vue.set(state, 'rightCurrentFrame', 50)
      Vue.set(state, 'mode', 'object')
      Vue.set(state, 'lockSliders', false)
      Vue.set(state, 'grayscale', false)
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
    setLeftCurrentFrame (state, value) {
      Vue.set(state, 'leftCurrentFrame', value)
    },
    setRightCurrentFrame (state, value) {
      Vue.set(state, 'rightCurrentFrame', value)
    },
    setMode (state, value) {
      Vue.set(state, 'mode', value)
    },
    setLockSliders (state, value) {
      Vue.set(state, 'lockSliders', value)
    },
    setLockSlidersDistance (state, value) {
      Vue.set(state, 'lockSlidersDistance', value)
    },
    setGrayscale (state, value) {
      Vue.set(state, 'grayscale', value)
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
    toggleZoom (state) {
      Vue.set(state, 'zoom', !state.zoom)
    },
  },
  actions: {},
}
