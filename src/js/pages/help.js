const HELP_TEMPLATE = `
<div style="max-width: 800px; margin: 0 auto" class="q-gutter-md">
  <div class="text-h5">Help (TODO)</div>
  <div class="text-body1">Click the top-left menu button (☰) to load and save data.</div>
  <div class="text-body1">Click and drag on frame to add a new bounding box.</div>
  <div class="text-h5">Keyboard Shortcuts (TODO)</div>
  <pre>    h           :: help (this window)
    p           :: play video segment
    comma, <    :: advance to next keyframe
    period, >   :: retreat to previous keyframe
    [, {        :: select left slider
    ], }        :: select right slider
    left-arrow  :: previous frame (when slider is selected)
    right-arrow :: next frame (when slider is selected)
    page-up     :: jump to previous 10% of video (when slider is selected)
    page-down   :: jump to next 10% of video (when slider is selected)
    plus (+)    :: add a new segment
    delete      :: delete currently active object
    shift       :: duplicate currently active object when mouse down
    tab         :: move to next field when editing objects</pre>
  <div class="text-h5">Tutorial Videos (TODO)</div>
</div>
`

export default {
  data: () => {
    return {}
  },
  methods: {},
  template: HELP_TEMPLATE,
}
