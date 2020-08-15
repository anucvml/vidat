const SKELETON_TYPE_PREVIEW_TEMPLATE = `
<canvas ref="preview" height="100px" width="100px"></canvas>
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
        new SkeletonAnnotation(50, 50, this.typeId).draw(this.ctx)
      },
      {
        immediate: true,
        deep: true,
      },
    )
  },
  template: SKELETON_TYPE_PREVIEW_TEMPLATE,
}
