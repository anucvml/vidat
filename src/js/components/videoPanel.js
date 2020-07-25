const VIDEO_PANEL_TEMPLATE = `
<div>
  {{position}}
  <canvas>123</canvas>
</div>
`

export default {
  props: ['position'],
  data: () => {
    return {}
  },
  methods: {},
  template: VIDEO_PANEL_TEMPLATE,
}
