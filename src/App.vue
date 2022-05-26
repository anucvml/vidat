<template>
  <q-scroll-area
      v-if="$q.platform.is.desktop"
      style="height: 100vh; max-width: 100vw;"
      :thumb-style="{ right: '3px',  width: '4px' }"
  >
    <Layout/>
  </q-scroll-area>
  <Layout v-else/>
</template>

<script setup>
import { useFavicon, usePreferredDark } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { useQuasar } from 'quasar'
import { computed } from 'vue'
import Layout from '~/components/Layout.vue'
import { useAnnotation } from '~/hooks/annotation.js'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { usePreferenceStore } from '~/store/preference.js'
import { useMainStore } from './store/index.js'

const mainStore = useMainStore()
let { drawer } = storeToRefs(mainStore)
const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()
const preferenceStore = usePreferenceStore()

const q = useQuasar()
q.dark.set('auto')

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
  const videoSrc = decodeURIComponent(video)
  annotationStore.video.src = videoSrc
  mainStore.videoFormat = videoSrc.split('.').at(-1).toLowerCase()
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
// un-save notice
window.addEventListener('beforeunload', event => {
  if (annotationStore.hasVideo && !mainStore.isSaved) {
    event.returnValue = 'The annotations are not saved!'
  }
})
// auto change favicon
const isDark = usePreferredDark()
const favicon = computed(() => isDark.value ? '/img/logo-dark.svg' : '/img/logo.svg')
useFavicon(favicon)
</script>

<style lang="sass">
.header
  backdrop-filter: blur(7px)
  background-color: rgba(0, 0, 0, .1)

body.body--dark .header
  background-color: rgba(29, 29, 29, 0.5)
</style>
