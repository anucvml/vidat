const APP_TEMPLATE = `
<q-layout view="hHh Lpr lFf" style="height: 100%">
  <q-header elevated>
    <q-toolbar>
      <q-btn flat @click="drawer = !drawer" round dense icon="menu" />
      <q-toolbar-title class="text-center"><router-link :to="'annotation'" style="color: inherit;">Vidat</router-link></q-toolbar-title>
      <a href="https://www.anu.edu.au/" target="_blank">
        <q-avatar square>
          <img src="img/logo.png" alt="logo">
        </q-avatar>
      </a>
    </q-toolbar>
  </q-header>

  <q-drawer
    v-model="drawer"
    :width="300"
    :breakpoint="500"
    bordered
    content-class="bg-grey-3"
  >
    <q-scroll-area class="fit">
      <q-list class="full-height">
        <q-item
          clickable
          v-ripple
          v-for="(item, index) in menuList"
          :key="index"
          :to="item.path"
          :active="item.label.toLowerCase() === $route.name.toLowerCase()"
          @click="drawer = false"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon"></q-icon>
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
        <q-item class="fixed-bottom">
          <q-item-section class="text-center">
            <a href='https://github.com/anucvml/vidat/releases' target="_blank">{{ version }}</a>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>

  <q-page-container>
    <q-page padding>
      <router-view></router-view>
    <div class="text-black text-center text-weight-thin text-caption text-italic q-ma-sm absolute-bottom">
        Copyright © 2020, <a href='https://github.com/anucvml/vidat' target="_blank">ANU CVML</a>. All rights reserved.
    </div>
    </q-page>
  </q-page-container>
</q-layout>
`

import router from './router/router.js'
import store from './store/store.js'

const app = new Vue({
  router,
  store,
  el: '#app',
  data: () => {
    return {
      version: VERSION,
      drawer: false,
      menuList: [
        {
          icon: 'video_label',
          label: 'Annotation',
          path: '/annotation',
        },
        {
          icon: 'settings',
          label: 'Configuration',
          path: '/configuration',
        },
        {
          icon: 'dashboard',
          label: 'Preference',
          path: '/preference',
        },
        {
          icon: 'help',
          label: 'Help',
          path: '/help',
        },
        {
          icon: 'book',
          label: 'About',
          path: '/about',
        },
      ],
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setMode',
      'setDefaultFps',
      'setShowObjects',
      'setShowRegions',
      'setShowSkeletons',
      'setShowActions',
      'setLockSliders',
      'setGrayscale',
      'setShowPopup',
      'setZoom',
    ]),
  },
  mounted: function () {
    // get parameters from url
    const URLParameter = {}
    for (const pair of window.location.search.replace('?', '').split('&')) {
      const [key, value] = pair.split('=')
      URLParameter[key] = value
    }
    // set options in silence
    const defaultFps = URLParameter['defaultFps']
    if (defaultFps) {
      const fps = parseInt(defaultFps, 10)
      if (fps >= 1 && fps <= 60 && fps % 1 === 0) {
        this.setDefaultFps(fps)
      }
    }
    const showObjects = URLParameter['showObjects']
    if (showObjects) {
      if (showObjects.toLowerCase() === 'true') {
        this.setShowObjects(true)
      } else if (showObjects.toLowerCase() === 'false') {
        this.setShowObjects(false)
      }
    }
    const showRegions = URLParameter['showRegions']
    if (showRegions) {
      if (showRegions.toLowerCase() === 'true') {
        this.setShowRegions(true)
      } else if (showRegions.toLowerCase() === 'false') {
        this.setShowRegions(false)
      }
    }
    const showSkeletons = URLParameter['showSkeletons']
    if (showSkeletons) {
      if (showSkeletons.toLowerCase() === 'true') {
        this.setShowSkeletons(true)
      } else if (showSkeletons.toLowerCase() === 'false') {
        this.setShowSkeletons(false)
      }
    }
    const showActions = URLParameter['showActions']
    if (showActions) {
      if (showActions.toLowerCase() === 'true') {
        this.setShowActions(true)
      } else if (showActions.toLowerCase() === 'false') {
        this.setShowActions(false)
      }
    }
    const lockSliders = URLParameter['lockSliders']
    if (lockSliders) {
      if (lockSliders.toLowerCase() === 'true') {
        this.setLockSliders(true)
      } else if (lockSliders.toLowerCase() === 'false') {
        this.setLockSliders(false)
      }
    }
    const grayscale = URLParameter['grayscale']
    if (grayscale) {
      if (grayscale.toLowerCase() === 'true') {
        this.setGrayscale(true)
      } else if (grayscale.toLowerCase() === 'false') {
        this.setGrayscale(false)
      }
    }
    const showPopup = URLParameter['showPopup']
    if (showPopup) {
      if (showPopup.toLowerCase() === 'true') {
        this.setShowPopup(true)
      } else if (showPopup.toLowerCase() === 'false') {
        this.setShowPopup(false)
      }
    }
    const zoom = URLParameter['zoom']
    if (zoom) {
      if (zoom.toLowerCase() === 'true') {
        this.setZoom(true)
      } else if (zoom.toLowerCase() === 'false') {
        this.setZoom(false)
      }
    }
    const mode = URLParameter['mode']
    if (mode) {
      if (mode === 'object' || mode === 'region' || mode === 'skeleton') {
        this.setMode(mode)
      }
    }
    const debug = URLParameter['debug']
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
  template: APP_TEMPLATE,
})
