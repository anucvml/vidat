const ANNOTATION_SKELETON_TEMPLATE = `
<div>
  <div class="row" style="min-height: 100px"><q-skeleton animation="none" class="col q-ma-sm"></q-skeleton></div>
  <div class="row" style="min-height: 400px">
    <q-skeleton animation="none" class="col q-ma-sm"></q-skeleton>
    <q-skeleton animation="none" class="col-1 q-ma-sm"></q-skeleton>
    <q-skeleton animation="none" class="col q-ma-sm"></q-skeleton>
  </div>
  <div class="row" style="min-height: 100px">
    <q-skeleton animation="none" class="col q-ma-sm"></q-skeleton>
    <div class="col-1 q-ma-sm"></div>
    <q-skeleton animation="none" class="col q-ma-sm"></q-skeleton>
  </div>
  <div class="row" style="min-height: 100px"><q-skeleton animation="none" class="col q-ma-sm"></q-skeleton></div>
</div>
`

export default {
  data: () => {
    return {}
  },
  methods: {},
  template: ANNOTATION_SKELETON_TEMPLATE,
}
