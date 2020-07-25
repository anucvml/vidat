export default {
  state: () => ({
    video: {
      src: null,
    },
    secondPerKeyframe: 5,
    keyframeList: [],
    leftPanel: {
      currentKeyframe: 0,
    },
    rightPanel: {
      currentKeyframe: 0,
    },
  }),
  getters: {},
  mutations: {
    setVideoSrc (state, value) {
      if (!value) {
        Vue.set(state, 'keyframeList', [])
        Vue.set(state, 'leftPanel', {
          currentKeyframe: 0,
        })
        Vue.set(state, 'rightPanel', {
          currentKeyframe: 5,
        })
      }
      Vue.set(state.video, 'src', value)
    },
    setVideoDuration (state, value) {
      Vue.set(state.video, 'duration', value)
    },
    setVideoWidth (state, value) {
      Vue.set(state.video, 'width', value)
    },
    setVideoHeight (state, value) {
      Vue.set(state.video, 'height', value)
    },
    setSecondPerKeyframe (state, value) {
      state.secondPerKeyframe = value
      let keyframeList = []
      for (let keyframe = 0; keyframe < state.video.duration; keyframe += value) {
        keyframeList.push(keyframe)
      }
      state.keyframeList = keyframeList
    },
    setLeftPanelCurrentKeyframe (state, value) {
      Vue.set(state.leftPanel, 'currentKeyframe', value)
    },
    setRightPanelCurrentKeyframe (state, value) {
      Vue.set(state.rightPanel, 'currentKeyframe', value)
    },
  },
  actions: {},
}
