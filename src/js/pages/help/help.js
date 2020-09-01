const HELP_TEMPLATE = `
<div style="max-width: 800px; margin: 0 auto" class="q-gutter-md">
  <div class="text-h5">Help (TODO)</div>
  <div class="text-body1">Click the top-left menu button (☰) to load and save data.</div>
  <div class="text-body1">Click and drag on frame to add a new bounding box.</div>
  <div class="text-h5">Keyboard Shortcuts</div>
  <div class="row q-ma-none" v-for="shortcut in shortcuts" :key="shortcut.key">
    <div class="col text-center">
      <q-chip size='md'>{{ shortcut.key }}</q-chip>
    </div>
    <div class="col text-body1" style="line-height: 30px;">
      {{ shortcut.description }}
    </div>
  </div>
  <div class="text-h5">Tutorial Videos (TODO)</div>
</div>
`

export default {
  data: () => {
    return {
      shortcuts: [
        {
          key: 'p',
          description: 'play video segment',
        },
        {
          key: 'comma, <',
          description: 'advance to next keyframe',
        },
        {
          key: 'period, >',
          description: 'retreat to previous keyframe',
        },
        {
          key: '[, {',
          description: 'select left slider(TODO)',
        },
        {
          key: '], }',
          description: 'select right slider(TODO)',
        },
        {
          key: 'left-arrow',
          description: 'previous frame (when slider is selected)',
        },
        {
          key: 'right-arrow',
          description: 'next frame (when slider is selected)',
        },
        {
          key: 'page-up',
          description: 'jump to previous 10% of video (when slider is selected)',
        },
        {
          key: 'page-down',
          description: 'jump to next 10% of video (when slider is selected)',
        },
        {
          key: 'plus (+)',
          description: 'add a new action / video segment',
        },
        {
          key: 'delete',
          description: 'delete currently active object',
        },
        {
          key: 'shift',
          description: 'duplicate currently active object when mouse down',
        },
        {
          key: 'alt',
          description: 'add new point to a region when mouse down',
        },
        {
          key: 'backspace',
          description: 'delete current point in a region when mouse down',
        },
        {
          key: 'tab',
          description: 'move to next field when editing objects',
        },
      ],
    }
  },
  methods: {},
  template: HELP_TEMPLATE,
}
