const OBJECT_TABLE_TEMPLATE = `
<q-table
  title="Objects"
  dense
  flat
  :data="objectAnnotationList"
  row-key="x"
  :columns="columnList"
  :pagination.sync="pagination"
>
  <template v-slot:body="props">
    <q-tr :props="props">
      <q-td key="x" :props="props">
        {{ props.row.x | toFixed2 }}
      </q-td>
      <q-td key="y" :props="props">
        {{ props.row.y | toFixed2 }}
      </q-td>
      <q-td key="width" :props="props">
        {{ props.row.width | toFixed2 }}
      </q-td>
      <q-td key="height" :props="props">
        {{ props.row.height | toFixed2 }}
      </q-td>
      <q-td key="label" :props="props">
        <q-select
          v-model="props.row.labelId"
          :options="labelOption"
          dense
          options-dense
          borderless
          emit-value
          map-options
        ></q-select>
      </q-td>
      <q-td key="color" :props="props">
        <q-chip
          outline
          v-if="labelOption[props.row.labelId].color"
          :style="{ 'border-color': labelOption[props.row.labelId].color, 'color': labelOption[props.row.labelId].color }"
        >
          {{ labelOption[props.row.labelId].color.toUpperCase() }}
         </q-chip>
      </q-td>
      <q-td key="instance" :props="props">
        <q-input
          v-model="props.row.instance"
          dense
          borderless
        ></q-input>
      </q-td>
      <q-td key="score" :props="props">
        <q-input
          v-model="props.row.score"
          dense
          borderless
        ></q-input>
      </q-td>
      <q-td key="operation" :props="props">
        <q-btn-group spread flat>
          <q-btn
            flat
            dense
            icon="keyboard_arrow_up"
            style="width: 100%"
            @click="handleUp(props.row)"
          ></q-btn>
          <q-btn
            flat
            dense
            icon="keyboard_arrow_down"
            style="width: 100%"
            @click="handleDown(props.row)"
          ></q-btn>
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

import utils from '../libs/utils.js'

const columnList = [
  { name: 'x', align: 'center', label: 'x', field: 'x' },
  { name: 'y', align: 'center', label: 'y', field: 'y' },
  { name: 'width', align: 'center', label: 'width', field: 'width' },
  { name: 'height', align: 'center', label: 'height', field: 'height' },
  { name: 'label', align: 'center', label: 'label', field: 'labelId' },
  { name: 'color', align: 'center', label: 'color', field: 'color' },
  { name: 'instance', align: 'center', label: 'instance', field: 'instance' },
  { name: 'score', align: 'center', label: 'score', field: 'score' },
  { name: 'operation', align: 'center', label: 'operation', field: 'operation' },
]

export default {
  props: {
    'position': String,
  },
  data: () => {
    return {
      columnList,
      pagination: { rowsPerPage: 0 },
    }
  },
  methods: {
    handleUp (row) {
      for (let i = 0; i < this.objectAnnotationList.length; i++) {
        if (this.objectAnnotationList[i] === row) {
          if (i - 1 >= 0) {
            this.objectAnnotationList[i] = this.objectAnnotationList.splice(i - 1, 1, this.objectAnnotationList[i])[0]
          }
          break
        }
      }
    },
    handleDown (row) {
      for (let i = 0; i < this.objectAnnotationList.length; i++) {
        if (this.objectAnnotationList[i] === row) {
          if (i + 2 <= this.objectAnnotationList.length) {
            this.objectAnnotationList[i] = this.objectAnnotationList.splice(i + 1, 1, this.objectAnnotationList[i])[0]
          }
          break
        }
      }
    },
    handleDelete (row) {
      utils.confirm('Are you sure to delete this object?').onOk(() => {
        for (let i in this.objectAnnotationList) {
          if (this.objectAnnotationList[i] === row) {
            this.objectAnnotationList.splice(i, 1)
          }
        }
      })
    },
  },
  computed: {
    currentFrame () {
      return eval('this.$store.state.annotation.' + this.position + 'CurrentFrame')
    },
    objectAnnotationList () {
      return this.$store.state.annotation.objectAnnotationListMap[this.currentFrame]
    },
    labelOption () {
      const objectLabelData = this.$store.state.settings.objectLabelData
      let labelOption = []
      for (let objectLabel of objectLabelData) {
        labelOption.push({
          label: objectLabel.name,
          value: objectLabel.id,
          color: objectLabel.color,
        })
      }
      return labelOption
    },
  },
  filters: {
    'toFixed2': function (value) {
      if (value) {
        return value.toFixed(2)
      } else {
        return '0.00'
      }
    },
  },
  template: OBJECT_TABLE_TEMPLATE,
}
