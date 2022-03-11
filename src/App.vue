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
            Caching video frames.
          </q-tooltip>
        </q-circular-progress>
        <q-btn
            :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
            flat
            round
            dense
            @click="q.dark.toggle"
        ></q-btn>
      </q-toolbar>
    </q-header>
    <Drawer></Drawer>
    <q-page-container>
      <q-page padding>
        <template v-if="annotationStore.hasVideo">
          <VideoLoaderV2 v-if="useV2"/>
          <VideoLoaderV1 v-else/>
        </template>
        <router-view></router-view>
      </q-page>
    </q-page-container>
    <q-footer class="bg-transparent">
      <q-toolbar>
        <q-toolbar-title
            class="text-center text-caption"
            :class="q.dark.isActive ? 'text-gray-4': 'text-black'"
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
import { useQuasar } from 'quasar'
import { computed } from 'vue'
import VideoLoaderV1 from '~/components/VideoLoaderV1.vue'
import VideoLoaderV2 from '~/components/VideoLoaderV2.vue'
import { useAnnotation } from '~/hooks/annotation.js'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { usePreferenceStore } from '~/store/preference.js'
import Drawer from './components/Drawer.vue'
import { useMainStore } from './store/index.js'

const mainStore = useMainStore()
let { drawer } = storeToRefs(mainStore)
const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()
const preferenceStore = usePreferenceStore()

const q = useQuasar()
q.dark.set('auto')

const useV2 = computed(() => {
  let ret
  if (preferenceStore.decoder === 'v1') {
    ret = false
  } else if (preferenceStore.decoder === 'v2') {
    ret = true
  } else {
    ret = !!window.VideoDecoder
  }
  console.log('Video Decoder:', ret ? 'V2' : 'V1')
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

// get parameters from url
const URLParameter = {}
for (const pair of window.location.search.replace('?', '').split('&')) {
  let [key, value] = pair.split('=')
  key = key.toLowerCase()
  URLParameter[key] = value
}
const {
  // annotation
  annotation,
  video,
  config,
  mode,
  // main
  zoom,
  submiturl: submitURL,
  // preference
  sensitivity,
  defaultfps: defaultFps,
  defaultfpk: defaultFpk,
  decoder: decoder,
  showobjects: showObjects,
  showregions: showRegions,
  showskeletons: showSkeletons,
  showactions: showActions,
  muted,
  grayscale,
  showpopup: showPopup
} = URLParameter
// annotation
if (annotation) {
  const { loadAnnotation } = useAnnotation()
  utils.readFile(decodeURIComponent(annotation)).then(res => {
    loadAnnotation(JSON.parse(res))
  }).catch(err => {
    utils.notify(`Could not load annotation: ${err}`, 'negative')
  })
}
if (!annotation && video) {
  annotationStore.video.src = decodeURIComponent(video)
}
if (!annotation && config) {
  utils.readFile(decodeURIComponent(config)).then(res => {
    configurationStore.importConfig(JSON.parse(res))
    utils.notify('Config loaded successfully!', 'positive')
  }).catch(err => {
    console.error(err)
    utils.notify(`Could not load config: ${config}: ${err}`, 'negative')
  })
}
const mode_dict = {
  'object': showObjects,
  'region': showRegions,
  'skeleton': showSkeletons
}
if (mode) {
  if (mode in mode_dict) {
    if (mode_dict[mode]?.toLowerCase() !== 'false') {
      annotationStore.mode = mode
    }
  }
}
// main
if (zoom) {
  if (zoom.toLowerCase() === 'true') {
    mainStore.zoom = true
  } else if (zoom.toLowerCase() === 'false') {
    mainStore.zoom = false
  }
}
if (submitURL) {
  mainStore.submitURL = decodeURIComponent(submitURL)
}
// preference
if (sensitivity) {
  const s = parseInt(sensitivity, 10)
  if (s >= 1 && s % 1 === 0) {
    preferenceStore.sensitivity = sensitivity
  }
}
if (defaultFps) {
  const fps = parseInt(defaultFps, 10)
  if (fps >= 1 && fps <= 60 && fps % 1 === 0) {
    preferenceStore.defaultFps = fps
  }
}
if (defaultFpk) {
  const fpk = parseInt(defaultFpk, 10)
  if (fpk >= 1 && fpk % 1 === 0) {
    preferenceStore.defaultFpk = fpk
  }
}
if (decoder) {
  if (['auto', 'v1', 'v2'].includes(decoder)) {
    preferenceStore.decoder = decoder
  }
}
if (showObjects) {
  if (showObjects.toLowerCase() === 'true') {
    preferenceStore.objects = true
  } else if (showObjects.toLowerCase() === 'false') {
    preferenceStore.objects = false
  }
}
if (showRegions) {
  if (showRegions.toLowerCase() === 'true') {
    preferenceStore.regions = true
  } else if (showRegions.toLowerCase() === 'false') {
    preferenceStore.regions = false
  }
}
if (showSkeletons) {
  if (showSkeletons.toLowerCase() === 'true') {
    preferenceStore.skeletons = true
  } else if (showSkeletons.toLowerCase() === 'false') {
    preferenceStore.skeletons = false
  }
}
if (showActions) {
  if (showActions.toLowerCase() === 'true') {
    preferenceStore.actions = true
  } else if (showActions.toLowerCase() === 'false') {
    preferenceStore.actions = false
  }
}
if (muted) {
  if (muted.toLowerCase() === 'true') {
    preferenceStore.muted = true
  } else if (muted.toLowerCase() === 'false') {
    preferenceStore.muted = false
  }
}
if (grayscale) {
  if (grayscale.toLowerCase() === 'true') {
    preferenceStore.grayscale = true
  } else if (grayscale.toLowerCase() === 'false') {
    preferenceStore.grayscale = false
  }
}
if (showPopup) {
  if (showPopup.toLowerCase() === 'true') {
    preferenceStore.showPopup = true
  } else if (showPopup.toLowerCase() === 'false') {
    preferenceStore.showPopup = false
  }
}
document.addEventListener('beforeunload', event => {
  if (annotationStore.hasVideo && !mainStore.isSaved) {
    event.returnValue = 'The annotations are not saved!'
  }
})
</script>

<style lang="sass">
.header
  backdrop-filter: blur(7px)
  background-color: rgba(0, 0, 0, .1)

body.body--dark .header
  background-color: rgba(29, 29, 29, 0.5)
</style>
