<template>
  <q-layout
    view="hHh Lpr lff"
    style="height: 100%"
  >
    <q-header
      :class="['header', { 'text-dark': !$q.dark.isActive }]"
      :elevated="!$q.dark.isActive"
    >
      <q-toolbar>
        <q-btn
          flat
          round
          dense
          :icon="drawer ? 'menu_open' : 'menu'"
          @click="drawer = !drawer"
        ></q-btn>
        <q-toolbar-title class="text-center">
          <a
            class="q-mr-sm"
            href="/"
            target="_blank"
          >
            <q-avatar
              square
              size="md"
            >
              <img
                v-if="$q.dark.isActive"
                src="img/logo-dark.svg"
                alt="logo"
              />
              <img
                v-else
                src="img/logo.svg"
                alt="logo"
              />
            </q-avatar>
          </a>
          <a
            class="vertical-middle"
            href="https://www.anu.edu.au/"
            target="_blank"
          >
            ANU CVML
          </a>
          <span class="vertical-middle">VIDeo Annotation Tool</span>
        </q-toolbar-title>
        <q-spinner
          v-if="annotationStore.hasVideo && annotationStore.isCaching"
          class="q-mx-sm"
          size="24px"
          color="primary"
        >
          <q-tooltip
            anchor="center left"
            self="center right"
          >
            Loading video&hellip; VideoLoader: {{ activeLoaderLabel }}.
          </q-tooltip>
        </q-spinner>
        <q-btn
          :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
          flat
          round
          dense
          @click="$q.dark.toggle"
        ></q-btn>
      </q-toolbar>
    </q-header>
    <Drawer></Drawer>
    <q-page-container>
      <q-page padding>
        <template v-if="annotationStore.hasVideo">
          <VideoLoaderV3
            v-if="activeLoader === 'v3'"
            :fallback="isAuto"
            @failed="handleLoaderFailed"
          />
          <VideoLoaderV2
            v-else-if="activeLoader === 'v2'"
            :fallback="isAuto"
            @failed="handleLoaderFailed"
          />
          <VideoLoaderV1
            v-else-if="activeLoader === 'v1'"
            :fallback="isAuto"
            @failed="handleLoaderFailed"
          />
        </template>
        <router-view></router-view>
      </q-page>
    </q-page-container>
    <q-footer class="bg-transparent">
      <q-toolbar>
        <q-toolbar-title
          class="text-center text-caption"
          :class="$q.dark.isActive ? 'text-gray-4' : 'text-black'"
        >
          Copyright © 2023,
          <a
            href="https://github.com/anucvml/vidat"
            target="_blank"
          >
            ANU CVML </a
          >. All rights reserved.
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

import VideoLoaderV1 from '~/components/VideoLoaderV1.vue'
import VideoLoaderV2 from '~/components/VideoLoaderV2.vue'
import VideoLoaderV3 from '~/components/VideoLoaderV3.vue'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useMainStore } from '~/store/index.js'
import { usePreferenceStore } from '~/store/preference.js'

import Drawer from './Drawer.vue'

const mainStore = useMainStore()
let { drawer } = storeToRefs(mainStore)
const annotationStore = useAnnotationStore()
const preferenceStore = usePreferenceStore()

const AUTO_LOADERS = ['v3', 'v2', 'v1']
const activeLoader = ref(null)
const isAuto = computed(() => preferenceStore.decoder === 'auto')
const activeLoaderLabel = computed(() => (activeLoader.value ? activeLoader.value.toUpperCase() : 'none'))

const startSelectedLoader = () => {
  if (!annotationStore.hasVideo) {
    activeLoader.value = null
    return
  }
  activeLoader.value = isAuto.value ? AUTO_LOADERS[0] : preferenceStore.decoder
  console.debug('VideoLoader:', activeLoaderLabel.value)
}

const handleLoaderFailed = ({ loader, message }) => {
  if (!annotationStore.hasVideo || loader !== activeLoader.value || !isAuto.value) return

  const nextLoader = AUTO_LOADERS[AUTO_LOADERS.indexOf(loader) + 1]
  if (nextLoader) {
    console.warn(`VideoLoader ${loader.toUpperCase()} failed, trying ${nextLoader.toUpperCase()}: ${message}`)
    utils.notify(`VideoLoader ${loader.toUpperCase()} failed. Trying ${nextLoader.toUpperCase()}...`, 'warning')
    activeLoader.value = nextLoader
    return
  }

  utils.notify(`Could not load the video with any decoder: ${message}`, 'negative')
  annotationStore.reset()
}

watch(() => [annotationStore.video.src, preferenceStore.decoder], startSelectedLoader, { immediate: true })
</script>
