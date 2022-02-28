<template>
  <div class="column flex-center">
    <img
        style="width: 150px; padding: 100px 0 50px 0;"
        src="/img/logo.svg"
        alt="Logo"
    >
    <div class="text-h4">Vidat</div>
    <VersionBadge/>
    <q-btn-group
        style="margin-top: 30px;"
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
    <div style="margin-top: 20px;">
      <router-link
          class="text-body1"
          style="margin: 0 10px; text-decoration: underline;"
          to="/help"
      ><span>Help</span></router-link>
      <a
          class="text-body1"
          style="margin: 0 10px; text-decoration: underline;"
          target="_blank"
          href="https://www.youtube.com/watch?v=XsxGac7Z4Wk&list=PLD-7XrNHCcFLv938DO4yYcTrgaff9BJjN"
      >Tutorial Videos</a>
      <router-link
          class="text-body1"
          style="margin: 0 10px; text-decoration: underline;"
          to="/about"
      ><span>About</span></router-link>
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
