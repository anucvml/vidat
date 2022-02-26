<template>
  <q-drawer
      id="drawer"
      v-model="drawer"
      :width="300"
      :breakpoint="500"
      bordered
      overlay
      content-class="bg-grey-3"
  >
    <q-scroll-area class="fit">
      <q-list class="full-height">
        <DrawerVideoControl/>
        <q-separator/>
        <DrawerAnnotationControl/>
        <q-separator/>
        <q-item
            clickable
            v-ripple
            v-for="(item, index) in menuList"
            :key="index"
            :to="item.path"
            :active="$route.name && item.label.toLowerCase() === $route.name.toLowerCase()"
            @click="drawer = false"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon"></q-icon>
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
        <q-item class="fixed-bottom">
          <q-item-section class="text-center">
            <VersionBadge/>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import VersionBadge from '~/components/VersionBadge.vue'
import { useAnnotationStore } from '../store/annotation.js'
import { useMainStore } from '../store/index.js'
import DrawerAnnotationControl from './DrawerAnnotationControl.vue'
import DrawerVideoControl from './DrawerVideoControl.vue'

const menuList = [
  {
    icon: 'video_label',
    label: 'Annotation',
    path: '/'
  },
  {
    icon: 'settings',
    label: 'Configuration',
    path: '/configuration'
  },
  {
    icon: 'dashboard',
    label: 'Preference',
    path: '/preference'
  },
  {
    icon: 'help',
    label: 'Help',
    path: '/help'
  },
  {
    icon: 'book',
    label: 'About',
    path: '/about'
  }
]
const { drawer } = storeToRefs(useMainStore())
const annotationStore = useAnnotationStore()
const { video } = storeToRefs(annotationStore)
</script>
