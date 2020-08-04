const APP_TEMPLATE = `
<q-layout view="hHh Lpr lFf" style="height: 100%">
  <q-header elevated>
    <q-toolbar>
      <q-btn flat @click="drawer = !drawer" round dense icon="menu" />
      <q-toolbar-title class="text-center">ANU CVML In-browser Video Annotation Tool</q-toolbar-title>
      <a href="https://www.anu.edu.au/" target="_blank">
        <q-avatar square>
          <img src="img/logo.png" alt="logo">
        </q-avatar>
      </a>
    </q-toolbar>
  </q-header>

  <q-footer class="bg-white" style="max-height: 40px">
    <q-toolbar>
      <q-toolbar-title class="text-black text-center text-weight-thin text-caption text-italic">
        Copyright © 2020, <a href='mailto:stephen.gould@anu.edu.au'>Stephen Gould</a>. All rights reserved.
      </q-toolbar-title>
    </q-toolbar>
  </q-footer>

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
          <q-item-section class="text-center">v1.0.0 Beta</q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>

  <q-page-container>
    <router-view></router-view>
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
      drawer: false,
      menuList: [
        {
          icon: 'video_label',
          label: 'Annotation',
          path: '/annotation',
        },
        {
          icon: 'settings',
          label: 'Settings',
          path: '/settings',
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
  mounted: function () {
    if (this.$route.name !== 'annotation') {
      this.$router.replace('/annotation')
    }
  },
  methods: {},
  template: APP_TEMPLATE,
})
