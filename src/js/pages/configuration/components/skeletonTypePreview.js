const SKELETON_TYPE_PREVIEW_TEMPLATE = `
<canvas ref="preview" height="400" width="400"></canvas>
`

import { SkeletonAnnotation } from '../../../libs/annotationlib.js'

export default {
  props: {
    'typeId': Number,
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
  template: SKELETON_TYPE_PREVIEW_TEMPLATE,
}
