<template>
  <canvas ref="preview" height="400" width="400"></canvas>
</template>

<script>

import { SkeletonAnnotation } from 'src/libs/annotationlib'

export default {
  name: 'SkeletonTypePreview',
  props: {
    typeId: Number,
  },
  data: () => {
    return {
      ctx: null,
    }
  },
  mounted () {
    this.ctx = this.$refs.preview.getContext('2d')
    this.$watch(
      function () {
        return this.$store.state.settings.skeletonTypeData.find(type => type.id === this.typeId)
      },
      function () {
        this.ctx.clearRect(0, 0, this.$refs.preview.width, this.$refs.preview.height)
        const skeletonAnnotation = new SkeletonAnnotation(200, 200, this.typeId)
        skeletonAnnotation.ratio = 4
        skeletonAnnotation.highlight = true
        skeletonAnnotation.draw(this.ctx, true)
      },
      {
        immediate: true,
        deep: true,
      },
    )
  },
}
</script>

<style scoped>

</style>
