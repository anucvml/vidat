const HELP_TEMPLATE = `
<div style="max-width: 800px; margin: 0 auto" class="q-gutter-md">
  <div class="text-h5">Help</div>
  <div class="text-body1">
    Click the top-left menu button (&#x2630;) to load and save data.
    Three annotation modes are supported:
    <ul>
    <li><b>Object:</b> Click and drag on frame to add a new bounding box.</li>
    <li><b>Region:</b> Click on frame to add next point to polygon region. Double-click to end.</li>
    <li><b>Skeleton:</b> Click and drag on frame to add a new skeleton with default pose.</li>
    </ul>
    Anchor points (&#x25a0; or &#x25cf;) can be dragged to reshape objects, regions and skeletons.
    Edges between anchors can be dragged to move annotations.
  </div>
  <div class="text-h5">Touch Support</div>
  <div class="text-body1">
    <ul>
    <li>Mode modifier switches will appear for devices with touchscreens (e.g., tablets), replacing modifier keys (shift, alt, etc.).</li>
    </ul>
  </div>
  <div class="text-h5">Keyboard Shortcuts</div>
  <div class="row q-ma-none" v-for="shortcut in shortcuts">
    <div class="col text-center">
      <q-chip size='md' v-for="key in shortcut.keys">{{ key }}</q-chip>
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
          keys: ['p'],
          description: 'play / pause video segment',
        },
        {
          keys: ['comma, <', 'period, >'],
          description: 'advance to previous / next keyframe',
        },
        {
          keys: ['left-arrow', 'right-arrow'],
          description: 'previous / next frame',
        },
        {
          keys: ['up-arrow', 'down-arrow'],
          description: 'cycle through the frame slider: right > range > left',
        },
        {
          keys: ['page-up', 'page-down'],
          description: 'jump to previous / next 10% of video',
        },
        {
          keys: ['plus (+)'],
          description: 'add a new action / video segment',
        },
        {
          keys: ['delete'],
          description: 'delete currently active object',
        },
        {
          keys: ['shift'],
          description: 'duplicate currently active object when mouse down',
        },
        {
          keys: ['alt'],
          description: 'add new point to a region when mouse down',
        },
        {
          keys: ['backspace'],
          description: 'delete current point in a region when mouse down',
        },
        {
          keys: ['tab'],
          description: 'move to next field when editing objects',
        },
      ],
    }
  },
  methods: {},
  template: HELP_TEMPLATE,
}
