<template>
  <q-page-sticky
      class="z-top"
      v-if="mainStore.currentActionThumbnailSrc"
      :offset="offset"
  >
    <div class="relative-position">
      <img
          class="shadow-1 rounded-borders"
          :style="{'max-width': imgMaxWidth + 'px'}"
          style="transition: max-width 0.1s;"
          :src="mainStore.currentActionThumbnailSrc"
          alt="thumbnail"
          draggable="false"
          v-touch-pan.prevent.mouse="handleMove"
          @wheel.prevent="handleResize"
      />
      <q-btn
          class="absolute-top-right text-black"
          flat
          icon="cancel"
          @click="mainStore.currentActionThumbnailSrc = null"
      ></q-btn>
    </div>
  </q-page-sticky>
</template>

<script setup>
import { ref } from 'vue'
import { useMainStore } from '~/store/index.js'

const mainStore = useMainStore()

// draggable
const offset = ref([16, 16])
const handleMove = event => {
  offset.value = [
    offset.value[0] - event.delta.x,
    offset.value[1] - event.delta.y
  ]
}
// resizable
const imgMaxWidth = ref(400)
const handleResize = event => {
  imgMaxWidth.value += event.deltaY / -5
}
</script>
