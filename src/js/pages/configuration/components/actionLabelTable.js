const ACTION_LABEL_TABLE_TEMPLATE = `
<div>
  <div v-show="showEdit">
    <q-card class="row q-pa-md">
      <div class="col-6 q-table__title">Action Labels</div>
      <q-space></q-space>
      <q-btn-group :flat="false">
        <q-btn icon="save" color="primary" @click="handleSave" label="save"></q-btn>
        <q-btn icon="close" color="negative" @click="handleCancel" label="cancel"></q-btn>
      </q-btn-group>
      <q-input
        class="full-width"
        style="font-family: console;"
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
    :pagination.sync="pagination"
    row-key="id"
  >
    <template v-slot:top="props">
      <div class="col-6 q-table__title">Action Labels</div>
      <q-space></q-space>
      <q-btn-group>
        <q-btn icon="edit" @click="showEdit = !showEdit; json = jsonData" label="edit"></q-btn>
        <q-btn icon="add" @click="handleAdd" label="add"></q-btn>
      </q-btn-group>
    </template>
    <template v-slot:header="props">
      <q-tr :props="props">
        <q-th auto-width></q-th>
        <q-th
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
        >
          {{ col.label }}
        </q-th>
      </q-tr>
    </template>
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td auto-width>
          <q-btn
            size="sm"
            round
            dense
            @click="props.expand = !props.expand"
            :icon="props.expand ? 'expand_more' : 'chevron_right'"
          ></q-btn>
        </q-td>
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
        <q-td key="nObjects" :props="props" style="font-size: 14px">
          {{ props.row.objects.length }}
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
      <q-tr v-show="props.expand" :props="props">
        <q-td colspan="100%" style="white-space: normal;">
          <div class="q-mb-sm">
            <q-btn-group dense flat>
              <q-btn icon="apps" @click="handleSelectAll(props.row)"></q-btn>
              <q-btn icon="clear_all" @click="handleClearAll(props.row)"></q-btn>
            </q-btn-group>
          </div>
          <div class="q-gutter-xs">
            <q-chip
              v-for="object in objectLabelList"
              :key="object.id"
              :selected.sync="selectedObjectListMap[props.row.id][object.id]"
              color="primary"
              text-color="white"
              @update:selected="handleSelected(props.row.id, object.id)"
            >
              {{ object.name }}
            </q-chip>
          </div>
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
    name: 'nObjects',
    align: 'center',
    label: '#objects',
    field: 'nObjects',
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
      'setActionLabelData',
      'importActionLabelData',
      'setIsSaved',
    ]),
    saveTableData () {
      this.setActionLabelData(this.tableData)
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
        objects: [0],
      })
      this.saveTableData()
    },
    handleSelected (actionID, objectID) {
      const action = this.tableData.filter(action => action.id === actionID)[0]
      if (action.objects.indexOf(objectID) === -1) {
        action.objects.push(objectID)
        action.objects.sort((a, b) => a - b)
      } else {
        action.objects.splice(action.objects.indexOf(objectID), 1)
      }
      this.saveTableData()
    },
    handleSelectAll (row) {
      row.objects = this.objectLabelList.map(object => object.id)
      this.saveTableData()
    },
    handleClearAll (row) {
      row.objects = []
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
      return this.$store.state.settings.actionLabelData
    },
    jsonData: {
      get () {
        return JSON.stringify(this.$store.state.settings.actionLabelData, null, '   ')
      },
      set (value) {
        this.importActionLabelData(JSON.parse(value))
      },
    },
    objectLabelList () {
      return this.$store.state.settings.objectLabelData
    },
    selectedObjectListMap () {
      const ret = {}
      for (let action of this.tableData) {
        ret[action.id] = {}
        for (let object of this.objectLabelList) {
          ret[action.id][object.id] = action.objects.indexOf(object.id) !== -1
        }
      }
      return ret
    },
  },
  template: ACTION_LABEL_TABLE_TEMPLATE,
}
