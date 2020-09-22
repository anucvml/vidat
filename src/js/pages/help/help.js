const HELP_TEMPLATE = `
<div style="max-width: 800px; margin: 0 auto" class="q-gutter-md">
  <div class="text-h5">Help</div>
  <div class="text-body1">
    Click the top-left menu button (&#x2630;) to load and save data.
    Three annotation modes are supported:
    <ul>
    <li><b>Object:</b> Click and drag on frame to add a new bounding box.</li>
    <li><b>Region:</b> Click on frame to add next point to polygon region. Double-click to end.</li>
    <li><b>Skeleton:</b> Click and drag on frame to add new default skeleton.</li>
    </ul>
    Anchor points (&#x25a0; or &#x25cf;) can be dragged to reshape objects, regions and skeletons.
    Edges between anchors can be dragged to move annotations.
  </div>
  <div class="text-h5">Keyboard Shortcuts</div>
  <div class="row q-ma-none" v-for="shortcut in shortcuts" :key="shortcut.key">
    <div class="col text-center">
      <q-chip size='md'>{{ shortcut.key }}</q-chip>
    </div>
    <div class="col text-body1" style="line-height: 30px;">
      {{ shortcut.description }}
    </div>
  </div>
  <div class="text-h5">Tutorial Videos</div>
  <div class="text-body1">
    <q-btn type="a"
      href="https://www.youtube.com/playlist?list=PLD-7XrNHCcFLv938DO4yYcTrgaff9BJjN"
      target="_blank"
      icon="video_library">
      youtube playlist
    </q-btn>
  </div>
</div>
`

export default {
  data: () => {
    return {
      shortcuts: [
        {
          key: 'p',
          description: 'play / pause video segment',
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
          key: 'left-arrow',
          description: 'previous frame',
        },
        {
          key: 'right-arrow',
          description: 'next frame',
        },
        {
          key: 'page-up',
          description: 'jump to previous 10% of video',
        },
        {
          key: 'page-down',
          description: 'jump to next 10% of video',
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
