import { createPinia, defineStore } from 'pinia'

export default createPinia()

export const useMainStore = defineStore('main', {
  state: () => ({
    drawer: false,
    zoom: false,
    submitURL: null,
    isSaved: true
  })
})
