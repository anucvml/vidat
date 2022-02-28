import deepClone from 'lodash.clonedeep'
import { defineStore } from 'pinia'
import { Platform } from 'quasar'
import { reactive, toRefs, watch } from 'vue'

const LS_KEY = 'preferenceData'
const DEFAULT_PREFERENCE = {
  sensitivity: Platform.has.touch ? 10 : 5,
  defaultFps: 10,
  defaultFpk: 50,
  decoder: 'auto', // auto, v1, v2
  objects: true,
  regions: true,
  skeletons: true,
  actions: true,
  muted: true,
  grayscale: false,
  showPopup: true
}

export const usePreferenceStore = defineStore('preference', () => {
  const defaultPreference = deepClone(DEFAULT_PREFERENCE)
  const state = reactive(DEFAULT_PREFERENCE)
  const ls = JSON.parse(localStorage.getItem(LS_KEY))
  if (ls) {
    for (const key in state) {
      if (ls.hasOwnProperty(key)) {
        state[key] = ls[key]
      }
    }
  }
  watch(state, (newValue) => {
    localStorage.setItem(LS_KEY, JSON.stringify(newValue))
  })
  const reset = () => {
    Object.keys(state).map(key => state[key] = defaultPreference[key])
  }
  return { ...toRefs(state), reset }
})
