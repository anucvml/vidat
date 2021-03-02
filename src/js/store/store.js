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
  },
  modules: {
    annotation,
    settings,
  },
})
