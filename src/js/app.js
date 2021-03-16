const APP_TEMPLATE = `
<q-layout view="hHh Lpr lFf" style="height: 100%">
  <q-header elevated>
    <q-toolbar>
      <q-btn flat @click="drawer = !drawer" round dense :icon="drawer ? 'menu_open' : 'menu'"></q-btn>
      <q-toolbar-title class="text-center"><router-link :to="'annotation'" style="color: inherit;">ANU CVML Video Annotation Tool</router-link></q-toolbar-title>
      <a href="https://www.anu.edu.au/" target="_blank">
        <q-avatar square size="md">
          <img src="img/logo.svg" alt="logo">
        </q-avatar>
      </a>
    </q-toolbar>
  </q-header>
  <drawer></drawer>
  <q-page-container>
    <q-page padding>
      <videoLoader></videoLoader>
      <router-view></router-view>
      <div class="text-black text-center text-weight-thin text-caption q-ma-sm absolute-bottom">
          Copyright © 2021, <a href='https://github.com/anucvml/vidat' target="_blank">ANU CVML</a>. All rights reserved.
      </div>
    </q-page>
  </q-page-container>
</q-layout>
`

import router from './router/router.js'
import store from './store/store.js'
import drawer from './components/drawer.js'
import videoLoader from './components/videoLoader.js'
import utils from './libs/utils.js'

const app = new Vue({
  router,
  store,
  el: '#app',
  components: {
    drawer,
    videoLoader,
  },
  data: () => {
    return {}
  },
  methods: {
    ...Vuex.mapMutations([
      'setMode',
      'setVideoSrc',
      'setDefaultFps',
      'setDefaultFpk',
      'setShowObjects',
      'setShowRegions',
      'setShowSkeletons',
      'setShowActions',
      'setGrayscale',
      'setShowPopup',
      'setZoom',
      'setSubmitURL',
    ]),
  },
  computed: {
    drawer: {
      get () {
        return this.$store.state.drawer
      },
      set (value) {
        this.$store.commit('setDrawer', value)
      },
    },
  },
  created: function () {
    // handle unsaved
    window.addEventListener('beforeunload', event => {
      if (!this.$store.state.debug &&
        this.$store.state.annotation.video.src &&
        !this.$store.state.annotation.isSaved) {
        event.returnValue = 'The annotations are not saved!'
      }
    })
    // get parameters from url
    const URLParameter = {}
    for (const pair of window.location.search.replace('?', '').split('&')) {
      let [key, value] = pair.split('=')
      key = key.toLowerCase()
      URLParameter[key] = value
    }
    const {
      defaultfps: defaultFps,
      defaultfpk: defaultFpk,
      video,
      annotation,
      config,
      showobjects: showObjects,
      showregions: showRegions,
      showskeletons: showSkeletons,
      showactions: showActions,
      grayscale,
      showpopup: showPopup,
      zoom,
      mode,
      debug,
      submiturl: submitURL,
    } = URLParameter
    // set options in silence
    if (!annotation && defaultFps) {
      const fps = parseInt(defaultFps, 10)
      if (fps >= 1 && fps <= 60 && fps % 1 === 0) {
        this.setDefaultFps(fps)
      }
    }
    if (!annotation && defaultFpk) {
      const fpk = parseInt(defaultFpk, 10)
      if (fpk >= 1 && fpk % 1 === 0) {
        this.setDefaultFpk(fpk)
      }
    }
    if (video) {
      this.setVideoSrc(`video/${video}`)
    }
    if ((video || debug) && annotation) {
      utils.readFile(`annotation/${annotation}`).then(res => {
        try {
          const {
            version,
            annotation,
            config,
          } = JSON.parse(res)
          // version
          if (version !== VERSION) {
            utils.notify('Version mismatched, weird things are likely to happen! ' + version + '!=' + VERSION)
          }
          // annotation
          this.$store.commit('importAnnotation', annotation)
          // config
          this.$store.commit('importConfig', config)
          utils.notify('Annotation load successfully!')
        } catch (e) {
          utils.notify(e.toString())
          throw e
        }
      })
    }
    if (!annotation && config) {
      utils.readFile(`config/${config}`).then(res => {
        try {
          this.$store.commit('importConfig', JSON.parse(res))
          utils.notify('Config loaded successfully!')
        } catch (e) {
          utils.notify(e.toString())
          throw e
        }
      })
    }
    if (showObjects) {
      if (showObjects.toLowerCase() === 'true') {
        this.setShowObjects(true)
      }
      else if (showObjects.toLowerCase() === 'false') {
        this.setShowObjects(false)
      }
    }
    if (showRegions) {
      if (showRegions.toLowerCase() === 'true') {
        this.setShowRegions(true)
      }
      else if (showRegions.toLowerCase() === 'false') {
        this.setShowRegions(false)
      }
    }
    if (showSkeletons) {
      if (showSkeletons.toLowerCase() === 'true') {
        this.setShowSkeletons(true)
      }
      else if (showSkeletons.toLowerCase() === 'false') {
        this.setShowSkeletons(false)
      }
    }
    if (showActions) {
      if (showActions.toLowerCase() === 'true') {
        this.setShowActions(true)
      }
      else if (showActions.toLowerCase() === 'false') {
        this.setShowActions(false)
      }
    }
    if (grayscale) {
      if (grayscale.toLowerCase() === 'true') {
        this.setGrayscale(true)
      }
      else if (grayscale.toLowerCase() === 'false') {
        this.setGrayscale(false)
      }
    }
    if (showPopup) {
      if (showPopup.toLowerCase() === 'true') {
        this.setShowPopup(true)
      }
      else if (showPopup.toLowerCase() === 'false') {
        this.setShowPopup(false)
      }
    }
    if (zoom) {
      if (zoom.toLowerCase() === 'true') {
        this.setZoom(true)
      }
      else if (zoom.toLowerCase() === 'false') {
        this.setZoom(false)
      }
    }
    const mode_dict = {
      'object': showObjects,
      'region': showRegions,
      'skeleton': showSkeletons,
    }
    if (mode) {
      if (mode in mode_dict) {
        if (mode_dict[mode] === 'false') {
          utils.notify(`Not a valid URL, the UI for ${mode} mode is not shown.`)
        }
        else {
          this.setMode(mode)
        }
      }
      else {
        utils.notify(`Not a valid URL, the mode ${mode} is unknown.`)
      }
    }
    else {
      if (showObjects === 'false') {
        utils.notify('Not a valid URL, the UI for Object mode is not shown.')
      }
    }
    if (debug) {
      if (debug.toLowerCase() === 'true') {
        this.$store.commit('setDebug', true)
        this.$store.commit('setVideoFPS', 10)
        this.$store.commit('setVideoSrc', 'video/Ikea_dataset_teaser_vid.webm')
      }
      else if (debug.toLowerCase() === 'false') {
        this.$store.commit('setDebug', false)
      }
    }
    if (submitURL) {
      this.setSubmitURL(decodeURIComponent(submitURL))
    }
  },
  template: APP_TEMPLATE,
})
