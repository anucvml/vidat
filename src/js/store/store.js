/**
 * Vuex
 */

import annotation from './modules/annotation.js'
import settings from './modules/settings.js'

export default new Vuex.Store({
  state: () => ({
    drawer: false,
    debug: false,
    submitURL: null,
    delMode: false,
    copyMode: false,
    addPointMode: false,
    delPointMode: false,
    indicatingMode: false,
  }),
  mutations: {
    setDrawer (state, value) {
      Vue.set(state, 'drawer', value)
    },
    setDebug (state, value) {
      Vue.set(state, 'debug', value)
    },
    setSubmitURL (state, value) {
      Vue.set(state, 'submitURL', value)
    },
    setDelMode (state, value) {
      Vue.set(state, 'delMode', value)
    },
    setCopyMode (state, value) {
      Vue.set(state, 'copyMode', value)
    },
    setAddPointMode (state, value) {
      Vue.set(state, 'addPointMode', value)
    },
    setDelPointMode (state, value) {
      Vue.set(state, 'delPointMode', value)
    },
    setIndicatingMode (state, value) {
      Vue.set(state, 'indicatingMode', value)
    },
  },
  modules: {
    annotation,
    settings,
  },
})
