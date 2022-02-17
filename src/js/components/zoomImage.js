const ZOOM_IMAGE_TEMPLATE = `
  <img class="thumbnail" :src="src" alt="thumbnail"/>
`

export default {
  props: {
    src: String,
  },
  data: () => {
    return {}
  },
  methods: {},
  template: ZOOM_IMAGE_TEMPLATE,
}
