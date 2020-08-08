const ACTION_TABLE_TEMPLATE = `
<q-table
  dense
  flat
  :data="actionAnnotationList"
  row-key="start"
  :columns="columnList"
  :pagination.sync="pagination"
>
  <template v-slot:top="props">
    <div class="col-2 q-table__title">Actions</div>
    <q-space></q-space>
    <q-btn icon="add" @click="handleAdd">ADD</q-btn>
  </template>
  <template v-slot:body="props">
    <q-tr :props="props">
      <q-td key="start" :props="props">
        <q-input
          v-model.number="props.row.start"
          dense
          borderless
          type="number"
        ></q-input>
      </q-td>
      <q-td key="end" :props="props">
        <q-input
          v-model.number="props.row.end"
          dense
          borderless
          type="number"
        ></q-input>
      </q-td>
      <q-td key="action" :props="props">
        <q-select
          v-model="props.row.action"
          :options="actionOptionList"
          dense
          options-dense
          borderless
          emit-value
          map-options
          @input="handleActionInput(props.row)"
        ></q-select>
      </q-td>
      <q-td key="object" :props="props">
        <q-select
          v-model="props.row.object"
          :options="objectOption"
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
          :style="{ 'border-color': props.row.color, 'color': props.row.color }"
        >
          {{ props.row.color.toUpperCase() }}
         </q-chip>
        <q-popup-edit
          v-model="props.row.color"
          title="Edit the action color"
        >
          <q-color v-model="props.row.color"></q-color>
        </q-popup-edit>
      </q-td>
      <q-td key="description" :props="props">
        <q-input
          v-model.number="props.row.description"
          dense
          borderless
          type="text"
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

const columnList = [
  { name: 'start', align: 'center', label: 'start', field: 'start' },
  { name: 'end', align: 'center', label: 'end', field: 'end' },
  { name: 'action', align: 'center', label: 'action', field: 'action' },
  { name: 'object', align: 'center', label: 'object', field: 'object' },
  { name: 'color', align: 'center', label: 'color', field: 'color' },
  { name: 'description', align: 'center', label: 'description', field: 'description' },
  { name: 'operation', align: 'center', label: 'operation', field: 'operation' },
]

import utils from '../libs/utils.js'

export default {
  data: () => {
    return {
      columnList,
      pagination: { rowsPerPage: 0 },
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setActionAnnotationList',
    ]),
    handleAdd () {
      const last = this.actionAnnotationList[this.actionAnnotationList.length - 1]
      this.actionAnnotationList.push({
        start: last && last.end ? last.end : utils.index2time(this.leftCurrentFrame),
        end: null,
        action: 0,
        object: 0,
        color: this.actionOptionList[0].color,
        description: '',
      })
    },
    handleActionInput (row) {
      row.color = this.actionOptionList[row.action].color
    },
    handleUp (row) {
      for (let i = 0; i < this.actionAnnotationList.length; i++) {
        if (this.actionAnnotationList[i] === row) {
          if (i - 1 >= 0) {
            this.actionAnnotationList[i] = this.actionAnnotationList.splice(i - 1, 1, this.actionAnnotationList[i])[0]
          }
          break
        }
      }
    },
    handleDown (row) {
      for (let i = 0; i < this.actionAnnotationList.length; i++) {
        if (this.actionAnnotationList[i] === row) {
          if (i + 2 <= this.actionAnnotationList.length) {
            this.actionAnnotationList[i] = this.actionAnnotationList.splice(i + 1, 1, this.actionAnnotationList[i])[0]
          }
          break
        }
      }
    },
    handleDelete (row) {
      utils.confirm('Are you sure to delete this action?').onOk(() => {
        for (let i in this.actionAnnotationList) {
          if (this.actionAnnotationList[i] === row) {
            this.actionAnnotationList.splice(i, 1)
          }
        }
      })
    },
  },
  computed: {
    actionAnnotationList: {
      get () {
        return this.$store.state.annotation.actionAnnotationList
      },
      set (value) {
        this.setActionAnnotationList(value)
      },
    },
    leftCurrentFrame () {
      return this.$store.state.annotation.leftCurrentFrame
    },
    actionOptionList () {
      const actionLabelData = this.$store.state.settings.actionLabelData
      let actionOptionList = []
      for (let actionLabel of actionLabelData) {
        actionOptionList.push({
          label: actionLabel.name,
          value: actionLabel.id,
          color: actionLabel.color,
        })
      }
      return actionOptionList
    },
  },
  template: ACTION_TABLE_TEMPLATE,
}
