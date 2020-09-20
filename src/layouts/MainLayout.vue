<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          :icon="drawer ? 'menu_open' : 'menu'"
          @click="drawer = !drawer"
        />

        <q-toolbar-title class="text-center">
          <router-link :to="'annotation'">
            ANU CVML Video Annotation Tool
          </router-link>
        </q-toolbar-title>

        <a href="https://www.anu.edu.au/" target="_blank">
          <q-avatar square>
            <img src="img/logo.png" alt="logo">
          </q-avatar>
        </a>
      </q-toolbar>
    </q-header>
    <drawer/>
    <q-page-container>
      <q-page padding>
        <videoLoader/>
        <router-view/>
        <div class="text-black text-center text-weight-thin text-caption q-ma-sm absolute-bottom">
          Copyright © 2020, <a href='https://github.com/anucvml/vidat' target="_blank">ANU CVML</a>. All rights
          reserved.
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import Vuex from 'vuex'

import Drawer from 'components/Drawer'
import VideoLoader from 'components/VideoLoader'
import { version } from '../../package.json'
import utils from 'src/libs/utils'

export default {
  name: 'MainLayout',
  components: {
    Drawer,
    VideoLoader,
  },
  data () {
    return {
      version,
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setMode',
      'setVideoSrc',
      'setDefaultFps',
      'setShowObjects',
      'setShowRegions',
      'setShowSkeletons',
      'setShowActions',
      'setGrayscale',
      'setShowPopup',
      'setZoom',
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
      const [key, value] = pair.split('=')
      URLParameter[key] = value
    }
    const {
      defaultFps,
      video,
      annotation,
      config,
      showObjects,
      showRegions,
      showSkeletons,
      showActions,
      grayscale,
      showPopup,
      zoom,
      mode,
      debug,
    } = URLParameter
    // set options in silence
    if (defaultFps) {
      const fps = parseInt(defaultFps, 10)
      if (fps >= 1 && fps <= 60 && fps % 1 === 0) {
        this.setDefaultFps(fps)
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
          if (version !== this.version) {
            utils.notify('Version mismatched, weird things are likely to happen! ' + version + '!=' + this.version)
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
      } else if (showObjects.toLowerCase() === 'false') {
        this.setShowObjects(false)
      }
    }
    if (showRegions) {
      if (showRegions.toLowerCase() === 'true') {
        this.setShowRegions(true)
      } else if (showRegions.toLowerCase() === 'false') {
        this.setShowRegions(false)
      }
    }
    if (showSkeletons) {
      if (showSkeletons.toLowerCase() === 'true') {
        this.setShowSkeletons(true)
      } else if (showSkeletons.toLowerCase() === 'false') {
        this.setShowSkeletons(false)
      }
    }
    if (showActions) {
      if (showActions.toLowerCase() === 'true') {
        this.setShowActions(true)
      } else if (showActions.toLowerCase() === 'false') {
        this.setShowActions(false)
      }
    }
    if (grayscale) {
      if (grayscale.toLowerCase() === 'true') {
        this.setGrayscale(true)
      } else if (grayscale.toLowerCase() === 'false') {
        this.setGrayscale(false)
      }
    }
    if (showPopup) {
      if (showPopup.toLowerCase() === 'true') {
        this.setShowPopup(true)
      } else if (showPopup.toLowerCase() === 'false') {
        this.setShowPopup(false)
      }
    }
    if (zoom) {
      if (zoom.toLowerCase() === 'true') {
        this.setZoom(true)
      } else if (zoom.toLowerCase() === 'false') {
        this.setZoom(false)
      }
    }
    if (mode) {
      if (mode === 'object' || mode === 'region' || mode === 'skeleton') {
        this.setMode(mode)
      }
    }
    if (debug) {
      if (debug.toLowerCase() === 'true') {
        this.$store.commit('setDebug', true)
        this.$store.commit('setVideoFPS', 10)
        this.$store.commit('setVideoSrc', 'video/Ikea_dataset_teaser_vid.webm')
      } else if (debug.toLowerCase() === 'false') {
        this.$store.commit('setDebug', false)
      }
    }
  },
}
</script>
