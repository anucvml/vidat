const SKELETON_TYPE_TABLE_TEMPLATE = `
<div>
  <div v-show="showEdit">
    <q-card class="row q-pa-md">
      <div class="col-6 q-table__title">Skeleton Types</div>
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
    :pagination="pagination"
    row-key="id"
  >
    <template v-slot:top="props">
      <div class="col-6 q-table__title">Skeleton Types</div>
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
            title="Edit the type name"
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
        <q-td key="description" :props="props" style="font-size: 14px">
          <q-input
            v-model="props.row.description"
            borderless
            dense
            @input="saveTableData"
          ></q-input>
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
            title="Edit the type color"
            @save="saveTableData"
          >
            <q-color v-model="props.row.color"></q-color>
          </q-popup-edit>
        </q-td>
        <q-td key="nPoints" :props="props" style="font-size: 14px">
          {{ props.row.pointList.length }}
        </q-td>
        <q-td key="nEdges" :props="props" style="font-size: 14px">
          {{ props.row.edgeList.length }}
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
        <q-td colspan="100%" style="padding: 0;">
          <div class="q-px-md q-pb-md">
            <div class="q-table__title">
              Preview (100px &times; 100px)
            </div>
            <q-card flat bordered style="width: 400px; margin: 0 auto">
              <skeleton-type-preview class="full-width" :typeId="props.key"></skeleton-type-preview>
            </q-card>
          </div>
          <q-table
            flat
            dense
            :data="props.row.pointList"
            :columns="[
              { name: 'name', align: 'center', label: 'name', field: 'name' },
              { name: 'x', align: 'left', label: 'x', field: 'x' },
              { name: 'y', align: 'left', label: 'y', field: 'y' },
              { name: 'delete', align: 'center', label: 'delete', field: 'delete' },
            ]"
            :pagination="pagination"
            row-key="id"
          >
            <template v-slot:top="pointProps">
              <div class="col-6 q-table__title">Points</div>
              <q-space></q-space>
              <q-btn icon="add" @click="handleAddPoint(props)" label="add"></q-btn>
            </template>
            <template v-slot:body="pointProps">
              <q-tr :props="pointProps">
                <q-td key="name" :props="pointProps" style="font-size: 14px">
                  {{ pointProps.row.name }}
                  <q-popup-edit
                    auto-save
                    v-model="pointProps.row.name"
                    title="Edit the point name"
                    @save="saveTableData"
                  >
                    <q-input
                      v-model="pointProps.row.name"
                      dense
                      autofocus
                      counter
                      :rules="[ val => val.length != 0 || 'Please enter at least 1 character' ]"
                    ></q-input>
                  </q-popup-edit>
                </q-td>
                <q-td key="x" :props="pointProps" style="font-size: 14px">
                  <q-input
                    v-model.number="pointProps.row.x"
                    borderless
                    dense
                    @input="saveTableData"
                    :debounce="1500"
                    @mousewheel.prevent
                  ></q-input>
                </q-td>
                <q-td key="y" :props="pointProps" style="font-size: 14px">
                  <q-input
                    v-model.number="pointProps.row.y"
                    borderless
                    dense
                    @input="saveTableData"
                    :debounce="1500"
                    @mousewheel.prevent
                  ></q-input>
                </q-td>
                <q-td key="delete" :props="pointProps">
                  <q-btn
                    icon="delete"
                    color="negative"
                    flat
                    dense
                    style="width: 100%"
                    @click="handleDeletePoint(props, pointProps)"
                  ></q-btn>
                </q-td>
              </q-tr>
            </template>
          </q-table>
          <q-table
            flat
            dense
            :data="props.row.edgeList"
            :columns="[
              { name: 'from', align: 'left', label: 'from', field: 'from' },
              { name: 'to', align: 'left', label: 'to', field: 'to' },
              { name: 'delete', align: 'center', label: 'delete', field: 'delete' },
            ]"
            :pagination="pagination"
            row-key="id"
          >
            <template v-slot:top="edgeProps">
              <div class="col-6 q-table__title">Edges</div>
              <q-space></q-space>
              <q-btn icon="add" @click="handleAddEdge(props)" label="add"></q-btn>
            </template>
            <template v-slot:body="edgeProps">
              <q-tr :props="edgeProps">
                <q-td key="from" :props="edgeProps" style="font-size: 14px">
                  <q-select
                    v-model="edgeProps.row.from"
                    stack-label
                    dense
                    options-dense
                    borderless
                    map-options
                    emit-value
                    :options="pointOptions[props.key]"
                    @input="saveTableData"
                  ></q-select>
                </q-td>
                <q-td key="to" :props="edgeProps" style="font-size: 14px">
                  <q-select
                    v-model="edgeProps.row.to"
                    stack-label
                    dense
                    options-dense
                    borderless
                    map-options
                    emit-value
                    :options="pointOptions[props.key]"
                    @input="saveTableData"
                  ></q-select>
                </q-td>
                <q-td key="delete" :props="edgeProps">
                  <q-btn
                    icon="delete"
                    color="negative"
                    flat
                    dense
                    style="width: 100%"
                    @click="handleDeleteEdge(props, edgeProps)"
                  ></q-btn>
                </q-td>
              </q-tr>
            </template>
          </q-table>
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
    name: 'description',
    align: 'center',
    label: 'description',
    field: 'description',
  },
  {
    name: 'color',
    align: 'center',
    label: 'color',
    field: 'color',
    style: 'width: 120px',
  },
  {
    name: 'nPoints',
    align: 'center',
    label: '#points',
    field: 'nPoints',
  },
  {
    name: 'nEdges',
    align: 'center',
    label: '#edges',
    field: 'nEdges',
  },
  {
    name: 'delete',
    align: 'center',
    label: 'delete',
    field: 'delete',
  },
]

import skeletonTypePreview from './skeletonTypePreview.js'
import utils from '../../../libs/utils.js'

export default {
  components: {
    skeletonTypePreview,
  },
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
      'setSkeletonTypeData',
      'importSkeletonTypeData',
      'setIsSaved',
    ]),
    saveTableData () {
      this.setSkeletonTypeData(this.tableData)
      this.setIsSaved(false)
    },
    handleDelete (props) {
      utils.confirm(
        'Are you sure to delete type ' + props.row.name + ' ?',
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
        description: '',
        color: utils.randomColor(),
        pointList: [],
        edgeList: [],
      })
      this.saveTableData()
    },
    handleDeletePoint (props, pointProps) {
      utils.confirm(
        'Are you sure to delete point ' + pointProps.row.name + ' ?',
      ).onOk(() => {
        const pointList = props.row.pointList
        pointList.splice(pointList.findIndex(point => point.id === pointProps.key), 1)
        this.saveTableData()
      })
    },
    handleAddPoint (props) {
      const pointList = props.row.pointList
      let lastId = pointList.length ? pointList[pointList.length - 1].id : -1
      pointList.push({
        id: lastId + 1,
        name: 'new',
        x: 0,
        y: 0,
      })
      this.saveTableData()
    },
    handleDeleteEdge (props, edgeProps) {
      utils.confirm(
        'Are you sure to delete edge from ' + edgeProps.row.from + ' to ' + edgeProps.row.to + ' ?',
      ).onOk(() => {
        const edgeList = props.row.edgeList
        edgeList.splice(edgeList.findIndex(edge => edge.id === edgeProps.key), 1)
        this.saveTableData()
      })
    },
    handleAddEdge (props) {
      const edgeList = props.row.edgeList
      let lastId = edgeList.length ? edgeList[edgeList.length - 1].id : -1
      edgeList.push({
        id: lastId + 1,
        from: -1,
        to: -1,
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
      }
      else {
        this.showEdit = !this.showEdit
      }
    },
    handleCancel () {
      if (this.json !== this.jsonData) {
        utils.confirm('Are you sure to leave without save?').onOk(() => {
          this.json = this.jsonData
          this.showEdit = !this.showEdit
        })
      }
      else {
        this.showEdit = !this.showEdit
      }
    },
  },
  computed: {
    tableData () {
      return this.$store.state.settings.skeletonTypeData
    },
    jsonData: {
      get () {
        return JSON.stringify(this.$store.state.settings.skeletonTypeData, null, '   ')
      },
      set (value) {
        this.importSkeletonTypeData(JSON.parse(value))
      },
    },
    pointOptions () {
      const ret = {}
      for (const type of this.tableData) {
        ret[type.id] = type.pointList.map(point => {
          return {
            label: point.name,
            value: point.id,
          }
        })
        ret[type.id].unshift({
          label: 'center',
          value: -1,
        })
      }
      return ret
    },
  },
  template: SKELETON_TYPE_TABLE_TEMPLATE,
}
