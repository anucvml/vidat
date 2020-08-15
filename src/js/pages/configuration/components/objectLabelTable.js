const OBJECT_LABEL_TABLE_TEMPLATE = `
<q-table
  :data="tableData"
  :columns="columnList"
  title="Object Labels"
  row-key="id"
  :pagination.sync="pagination"
>
  <template v-slot:body="props">
    <q-tr :props="props">
      <q-td key="name" :props="props" style="font-size: 14px">
        {{ props.row.name }}
        <q-popup-edit
          auto-save
          v-model="props.row.name"
          title="Edit the label name"
          v-if="props.row.name !== 'default'"
          @save="saveTableData"
        >
          <q-input
            v-model="props.row.name"
            dense
            autofocus
            counter
            :rules="[ val => val.length != 0 || 'Please enter at least 1 character' ]"
          ></q-input>
        </q-popup-edit>
      </q-td>
      <q-td key="color" :props="props">
        <q-chip
          outline
          :style="{ 'border-color': props.row.color, 'color': props.row.color }"
        >
          {{ props.row.color.toUpperCase() }}
         </q-chip>
        <q-popup-edit
          auto-save
          v-model="props.row.color"
          title="Edit the label color"
          @save="saveTableData"
        >
          <q-color v-model="props.row.color"></q-color>
        </q-popup-edit>
      </q-td>
      <q-td key="delete" :props="props">
        <q-btn
          icon="delete"
          color="negative"
          flat
          dense
          style="width: 100%"
          :disabled="props.row.name === 'default'"
          @click="handleDelete(props)"
        ></q-btn>
      </q-td>
    </q-tr>
  </template>
  <template v-slot:bottom>
    <q-btn
      icon="add"
      color="primary"
      flat
      dense
      style="margin: 0 auto; width: 100%"
      @click="handleAdd()"
    ></q-btn>
  </template>
</q-table>
`

const columnList = [
  { name: 'name', align: 'center', label: 'name', field: 'name' },
  { name: 'color', align: 'center', label: 'color', field: 'color', style: 'width: 120px' },
  { name: 'delete', align: 'center', label: 'delete', field: 'delete' },
]

import utils from '../../../libs/utils.js'

export default {
  data: () => {
    return {
      columnList,
      pagination: { rowsPerPage: 0 },
    }
  },
  methods: {
    saveTableData () {
      this.$store.commit('setObjectLabelData', this.tableData)
    },
    handleDelete (props) {
      utils.confirm(
        'Are you sure to delete label ' + props.row.name + ' ?',
      ).onOk(() => {
        this.tableData.splice(this.tableData.findIndex(type => type.id === props.key), 1)
        this.saveTableData()
      })
    },
    handleAdd () {
      let lastId = this.tableData[this.tableData.length - 1].id
      this.tableData.push({
        id: lastId + 1,
        name: 'new',
        color: utils.randomColor(),
      })
      this.saveTableData()
    },
  },
  computed: {
    tableData () {
      return this.$store.state.settings.objectLabelData
    },
  },
  template: OBJECT_LABEL_TABLE_TEMPLATE,
}
