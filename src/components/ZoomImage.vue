<template>
  <div v-if="src">
    <img
        class="cursor-pointer fit"
        :src="src"
        alt="thumbnail"
    />
    <q-popup-proxy v-model="showPopup">
      <q-card>
        <img
            class="cursor-pointer"
            style="max-width: 300px"
            :src="src"
            alt="thumbnail"
            @click="showPopup = false"
        />
      </q-card>
    </q-popup-proxy>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  src: String | null | undefined
})
const showPopup = ref(false)
</script>
