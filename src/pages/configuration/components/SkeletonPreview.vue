<template>
  <div class="q-px-md q-pb-md">
    <div class="q-table__title q-pb-sm">
      Preview (100px &times; 100px)
    </div>
    <q-card
        flat
        bordered
        style="width: 300px; margin: 0 auto"
    >
      <canvas
          style="height: 300px; width: 300px;"
          ref="preview"
          height="400"
          width="400"
      ></canvas>
    </q-card>
  </div>
</template>

<script setup>

import { onMounted, ref, watch } from 'vue'
import { SkeletonAnnotation } from '~/libs/annotationlib.js'
import { useConfigurationStore } from '~/store/configuration.js'

const props = defineProps({
  typeId: {
    required: true,
    type: Number
  }
})

const preview = ref()
onMounted(() => {
  const ctx = preview.value.getContext('2d')
  watch(() => {
        return useConfigurationStore().skeletonTypeData.find(type => type.id === props.typeId)
      },
      () => {
        ctx.clearRect(0, 0, preview.value.width, preview.value.height)
        const skeletonAnnotation = new SkeletonAnnotation(200, 200, props.typeId)
        skeletonAnnotation.ratio = 4
        skeletonAnnotation.highlight = true
        skeletonAnnotation.draw(ctx, true)
      },
      {
        immediate: true,
        deep: true
      }
  )
})
</script>
