<template>
  <q-layout
      view="hHh Lpr lff"
      style="height: 100%"
  >
    <q-header
        :class="['header', {'text-dark': !$q.dark.isActive}]"
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
              href="https://www.anu.edu.au/"
              target="_blank"
          >
            <q-avatar
                square
                size="md"
            >
              <img
                  v-if="$q.dark.isActive"
                  src="/img/logo-dark.svg"
                  alt="logo"
              >
              <img
                  v-else
                  src="/img/logo.svg"
                  alt="logo"
              >
            </q-avatar>
          </a>
          <router-link
              class="vertical-middle"
              :to="'/'"
          >
            ANU CVML Video Annotation Tool
          </router-link>
        </q-toolbar-title>
        <q-circular-progress
            v-if="annotationStore.hasVideo && annotationStore.isCaching"
            class="q-mx-sm"
            show-value
            font-size="10px"
            :value="progress"
            size="30px"
            :thickness="0.2"
            color="primary"
            track-color="grey-3"
        >
          {{ progress }}%
          <q-tooltip
              anchor="center left"
              self="center right"
          >
            Caching video frames. VideoLoader: {{ useV2 ? 'V2' : 'V1' }}.
          </q-tooltip>
        </q-circular-progress>
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
          <VideoLoaderV2 v-if="useV2"/>
          <VideoLoaderV1 v-else/>
          <ActionThumbnailPreview v-if="preferenceStore.actions"/>
        </template>
        <router-view></router-view>
      </q-page>
    </q-page-container>
    <q-footer class="bg-transparent">
      <q-toolbar>
        <q-toolbar-title
            class="text-center text-caption"
            :class="$q.dark.isActive ? 'text-gray-4': 'text-black'"
        >
          Copyright © 2022,
          <a
              href="https://github.com/anucvml/vidat"
              target="_blank"
          >
            ANU CVML
          </a>. All rights reserved.
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import ActionThumbnailPreview from '~/components/ActionThumbnailPreview.vue'
import VideoLoaderV1 from '~/components/VideoLoaderV1.vue'
import VideoLoaderV2 from '~/components/VideoLoaderV2.vue'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { useMainStore } from '~/store/index.js'
import { usePreferenceStore } from '~/store/preference.js'
import Drawer from './Drawer.vue'

const mainStore = useMainStore()
let { drawer } = storeToRefs(mainStore)
const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()
const preferenceStore = usePreferenceStore()

const useV2 = computed(() => {
  let ret
  if (preferenceStore.decoder === 'v1') {
    ret = false
  } else if (preferenceStore.decoder === 'v2') {
    ret = true
  } else {
    const isSupported = window.VideoDecoder && window.EncodedVideoChunk && window.OffscreenCanvas
    ret = isSupported && (mainStore.videoFormat === null || mainStore.videoFormat === 'mp4')
  }
  console.debug('VideoLoader:', ret ? 'V2' : 'V1')
  return ret
})

const progress = computed(() => {
  if (!isNaN(annotationStore.video.frames && annotationStore.cachedFrameList.length)) {
    return Math.round(
        annotationStore.cachedFrameList.filter(frame => frame).length / annotationStore.video.frames * 100)
  } else {
    return 0
  }
})
</script>
