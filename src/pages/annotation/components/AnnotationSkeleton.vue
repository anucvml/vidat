<template>
  <div
    class="absolute column items-center justify-center"
    style="inset: 0"
  >
    <img
      v-if="$q.dark.isActive"
      style="width: 150px; padding-bottom: 50px"
      src="img/logo-dark.svg"
      alt="Logo"
    />
    <img
      v-else
      style="width: 150px; padding-bottom: 50px"
      src="img/logo.svg"
      alt="Logo"
    />
    <div class="text-h4">Vidat</div>
    <VersionBadge />
    <q-btn-group
      style="padding-top: 30px"
      flat
    >
      <q-btn
        outline
        icon="movie"
        color="primary"
        label="open video"
        @click="handleOpen"
      />
      <q-btn
        outline
        icon="file_upload"
        color="primary"
        label="load annotation"
        @click="handleLoad"
      />
    </q-btn-group>
    <div style="padding: 20px 0">
      <a
        class="text-body1"
        style="padding: 0 10px; text-decoration: underline"
        href="/?annotation=/annotation/example.json"
        >Demo</a
      >
      <router-link
        class="text-body1"
        style="padding: 0 10px; text-decoration: underline"
        to="/help"
        >Help</router-link
      >
      <a
        class="text-body1"
        style="padding: 0 10px; text-decoration: underline"
        target="_blank"
        href="https://www.youtube.com/watch?v=XsxGac7Z4Wk&list=PLD-7XrNHCcFLv938DO4yYcTrgaff9BJjN"
        >Tutorial Videos</a
      >
      <router-link
        class="text-body1"
        style="padding: 0 10px; text-decoration: underline"
        to="/about"
        >About</router-link
      >
    </div>
  </div>
</template>

<script setup>
import VersionBadge from '~/components/VersionBadge.vue'
import { useAnnotation } from '~/hooks/annotation.js'
import { useVideo } from '~/hooks/video.js'

const { handleOpen } = useVideo()
const { handleLoad } = useAnnotation()
</script>
