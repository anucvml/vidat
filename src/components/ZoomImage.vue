<template>
  <div v-if="src">
    <img
        class="cursor-pointer fit rounded-borders"
        :src="src"
        alt="thumbnail"
    />
    <q-popup-proxy
        persistent
        v-model="showPopup"
    >
      <q-card>
        <img
            class="cursor-pointer"
            style="max-width: 400px"
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
