<template>
  <div v-if="src">
    <img
        class="cursor-pointer fit rounded-borders"
        :src="src"
        alt="thumbnail"
        @click="showPopup = !showPopup"
    />
    <q-page-sticky
        class="z-top"
        v-if="showPopup"
        :offset="offset"
    >
      <div class="relative-position">
        <img
            class="shadow-1 rounded-borders"
            :style="{'max-width': imgMaxWidth + 'px'}"
            style="transition: max-width 0.1s;"
            :src="src"
            alt="thumbnail"
            draggable="false"
            v-touch-pan.prevent.mouse="handleMove"
            @wheel.prevent="handleResize"
        />
        <q-btn
            class="absolute-top-right text-black"
            flat
            icon="cancel"
            @click="showPopup = false"
        ></q-btn>
      </div>
    </q-page-sticky>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  src: String | null | undefined
})
const showPopup = ref(false)

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
