const KEYFRAME_TABLE_TEMPLATE = `
<q-table
  class="full-width"
  dense
  flat
  :data="keyframeList"
  :pagination.sync="pagination"
  :columns="[
    { name: 'frame', align: 'center', label: '#frame' },
    { name: 'time', align: 'center', label: 'time' },
    { name: 'nObject', align: 'center', label: '# object' },
    { name: 'nRegion', align: 'center', label: '# region' },
    { name: 'nSkeleton', align: 'center', label: '# skeleton' },
    { name: 'operation', align: 'center', label: 'operation' },
  ]"
>
  <template v-slot:top="props">
    <div class="col-6 q-table__title">Keyframes</div>
    <q-space></q-space>
    <q-btn-group>
      <q-btn icon="add" @click="handleAdd" label="add"></q-btn>
      <q-btn icon="more_time" @click="handleGenerate" label="generate"></q-btn>
    </q-btn-group>
  </template>
  <template v-slot:body="props">
    <q-tr :props="props">
      <q-td key="frame" :props="props">
        {{ props.row }}
      </q-td>
      <q-td key="time" :props="props">
        {{ toFixed2(index2time(props.row)) }}
      </q-td>
      <q-td key="nObject" :props="props">
        {{ objectAnnotationListMap[props.row] ? objectAnnotationListMap[props.row].length : 0 }}
      </q-td>
      <q-td key="nRegion" :props="props">
        {{ regionAnnotationListMap[props.row] ? regionAnnotationListMap[props.row].length : 0 }}
      </q-td>
      <q-td key="nSkeleton" :props="props">
        {{ skeletonAnnotationListMap[props.row] ? skeletonAnnotationListMap[props.row].length : 0 }}
      </q-td>
      <q-td key="operation" :props="props">
        <q-btn-group spread flat>
          <q-btn
            flat
            dense
            icon="delete"
            color="negative"
            style="width: 100%"
            @click="handleDelete(props.row)"
          ></q-btn>
        </q-btn-group>
      </q-td>
    </q-tr>
  </template>
</q-table>
`

import utils from '../../../libs/utils.js'

export default {
  data: () => {
    return {
      index2time: utils.index2time,
      pagination: { rowsPerPage: 5 },
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setSecondPerKeyframe',
    ]),

    handleAdd () {

    },
    handleGenerate () {
      utils.prompt(
        'Generate keyframes',
        'Generate keyframe every how many seconds? Integer bigger or equal to 1.',
        5,
        'number',
      ).onOk((secondPerKeyframe) => {
        if (secondPerKeyframe >= 1 && secondPerKeyframe % 1 === 0) {
          this.setSecondPerKeyframe(parseInt(secondPerKeyframe))
        } else {
          utils.notify('Please enter an integer bigger than 1.')
        }
      })
    },
    handleDelete (keyframe) {

    },
  },
  computed: {
    keyframeList () {
      return this.$store.state.annotation.keyframeList
    },
    objectAnnotationListMap () {
      return this.$store.state.annotation.objectAnnotationListMap
    },
    regionAnnotationListMap () {
      return this.$store.state.annotation.regionAnnotationListMap
    },
    skeletonAnnotationListMap () {
      return this.$store.state.annotation.skeletonAnnotationListMap
    },
  },
  template: KEYFRAME_TABLE_TEMPLATE,
}
