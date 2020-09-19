/**
 * Vuex
 */

import Vue from 'vue'
import Vuex from 'vuex'

import annotation from './modules/annotation.js'
import settings from './modules/settings.js'

Vue.use(Vuex)

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default new Vuex.Store({
  state: () => ({
    drawer: false,
    debug: false,
  }),
  mutations: {
    setDrawer (state, value) {
      Vue.set(state, 'drawer', value)
    },
    setDebug (state, value) {
      Vue.set(state, 'debug', value)
    },
  },
  modules: {
    annotation,
    settings,
  },

  // enable strict mode (adds overhead!)
  // for dev mode only
  // strict: process.env.DEV,
})
