const OBJECT_LABEL_TABLE_TEMPLATE = `
<div>
  <div v-show="showEdit">
    <q-card class="row q-pa-md">
      <div class="col-6 q-table__title">Object Labels</div>
      <q-space></q-space>
      <q-btn-group :flat="false">
        <q-btn icon="save" color="primary" @click="handleSave" label="save"></q-btn>
        <q-btn icon="close" color="negative" @click="handleCancel" label="cancel"></q-btn>
      </q-btn-group>
      <q-input
        class="full-width"
        style="font-family: console, monospace;"
        v-model="json"
        borderless
        autogrow
        type="textarea"
      ></q-input>
    </q-card>
  </div>
  <q-table
    v-show="!showEdit"
    :data="tableData"
    :columns="columnList"
    row-key="id"
    :pagination.sync="pagination"
  >
    <template v-slot:top="props">
      <div class="col-6 q-table__title">Object Labels</div>
      <q-space></q-space>
      <q-btn-group>
        <q-btn icon="edit" @click="showEdit = !showEdit; json = jsonData" label="edit"></q-btn>
        <q-btn icon="add" @click="handleAdd" label="add"></q-btn>
      </q-btn-group>
    </template>
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
  </q-table>
</div>
`

const columnList = [
  {
    name: 'name',
    align: 'center',
    label: 'name',
    field: 'name',
  },
  {
    name: 'color',
    align: 'center',
    label: 'color',
    field: 'color',
    style: 'width: 120px',
  },
  {
    name: 'delete',
    align: 'center',
    label: 'delete',
    field: 'delete',
  },
]

import utils from '../../../libs/utils.js'

export default {
  data: () => {
    return {
      columnList,
      pagination: { rowsPerPage: 0 },
      showEdit: false,
      json: null,
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setObjectLabelData',
      'importObjectLabelData',
      'setIsSaved',
    ]),
    saveTableData () {
      this.setObjectLabelData(this.tableData)
      this.setIsSaved(false)
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
      let lastId = this.tableData.length ? this.tableData[this.tableData.length - 1].id : -1
      this.tableData.push({
        id: lastId + 1,
        name: 'new',
        color: utils.randomColor(),
      })
      this.saveTableData()
    },
    handleSave () {
      if (this.json !== this.jsonData) {
        try {
          this.jsonData = this.json
          this.showEdit = !this.showEdit
        } catch (e) {
          utils.notify(e.toString())
          throw e
        }
      } else {
        this.showEdit = !this.showEdit
      }
    },
    handleCancel () {
      if (this.json !== this.jsonData) {
        utils.confirm('Are you sure to leave without save?').onOk(() => {
          this.json = this.jsonData
          this.showEdit = !this.showEdit
        })
      } else {
        this.showEdit = !this.showEdit
      }
    },
  },
  computed: {
    tableData () {
      return this.$store.state.settings.objectLabelData
    },
    jsonData: {
      get () {
        return JSON.stringify(this.$store.state.settings.objectLabelData, null, '   ')
      },
      set (value) {
        this.importObjectLabelData(JSON.parse(value))
      },
    },
  },
  template: OBJECT_LABEL_TABLE_TEMPLATE,
}
