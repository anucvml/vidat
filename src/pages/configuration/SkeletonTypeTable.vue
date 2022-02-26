<template>
  <TableBase
      title="Skeleton Types"
      storeKey="skeletonTypeData"
      :columnList="columnList"
      :importFunction="configurationStore.importSkeletonTypeData"
      expand
      @add="handleAdd"
      @delete="handleDelete"
  >
    <template v-slot:expand="{props}">
      <q-td colspan="100%">
        <SkeletonPreview :type-id="props.row.id"/>
        <q-table
            flat
            dense
            row-key="id"
            :rows="props.row.pointList"
            :columns="[
                { name: 'name', align: 'center', label: 'name', field: 'name' },
                { name: 'x', align: 'left', label: 'x', field: 'x' },
                { name: 'y', align: 'left', label: 'y', field: 'y' },
                { name: 'operation', align: 'operation', label: 'operation', field: 'operation' }
                ]"
            :pagination="{ rowsPerPage: 0 }"
        >
          <template v-slot:top="pointProps">
            <div class="col-6 q-table__title">Points</div>
            <q-space></q-space>
            <q-btn
                size="sm"
                outline
                icon="add"
                @click="handleAddPoint(props)"
                label="add"
            ></q-btn>
          </template>
          <template v-slot:body="pointProps">
            <q-tr>
              <q-td>
                <q-input
                    input-class="text-center"
                    v-model="pointProps.row.name"
                    borderless
                    dense
                    hide-bottom-space
                    :rules="[ val => val.length !== 0 || 'Please enter at least 1 character' ]"
                />
              </q-td>
              <q-td>
                <q-input
                    v-model.number="pointProps.row.x"
                    borderless
                    dense
                    :debounce="1500"
                    @mousewheel.prevent
                />
              </q-td>
              <q-td>
                <q-input
                    v-model.number="pointProps.row.y"
                    borderless
                    dense
                    :debounce="1500"
                    @mousewheel.prevent
                />
              </q-td>
              <q-td>
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
            row-key="id"
            :rows="props.row.edgeList"
            :columns="[
                { name: 'from', align: 'left', label: 'from', field: 'from' },
                { name: 'to', align: 'left', label: 'to', field: 'to' },
                { name: 'operation', align: 'center', label: 'operation', field: 'operation' }
                ]"
            :pagination="{ rowsPerPage: 0 }"
        >
          <template v-slot:top="edgeProps">
            <div class="col-6 q-table__title">Edges</div>
            <q-space></q-space>
            <q-btn
                size="sm"
                outline
                icon="add"
                @click="handleAddEdge(props)"
                label="add"
            ></q-btn>
          </template>
          <template v-slot:body="edgeProps">
            <q-tr :props="edgeProps">
              <q-td>
                <q-select
                    v-model="edgeProps.row.from"
                    stack-label
                    dense
                    options-dense
                    borderless
                    map-options
                    emit-value
                    :options="pointOptions[props.key]"
                ></q-select>
              </q-td>
              <q-td>
                <q-select
                    v-model="edgeProps.row.to"
                    stack-label
                    dense
                    options-dense
                    borderless
                    map-options
                    emit-value
                    :options="pointOptions[props.key]"
                ></q-select>
              </q-td>
              <q-td>
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
    </template>
  </TableBase>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, nextTick } from 'vue'
import utils from '~/libs/utils.js'
import TableBase from '~/pages/configuration/components/TableBase.vue'
import { useConfigurationStore } from '~/store/configuration.js'
import SkeletonPreview from './components/SkeletonPreview.vue'

// Skeleton
const columnList = [
  {
    name: 'name',
    align: 'center',
    label: 'name',
    field: 'name',
    type: 'input'
  },
  {
    name: 'description',
    align: 'center',
    label: 'description',
    field: 'description',
    type: 'input'
  },
  {
    name: 'color',
    align: 'center',
    label: 'color',
    field: 'color',
    style: 'width: 120px',
    type: 'color'
  },
  {
    name: 'nPoints',
    align: 'center',
    label: '#points',
    field: (row) => row.pointList.length
  },
  {
    name: 'nEdges',
    align: 'center',
    label: '#edges',
    field: (row) => row.edgeList.length
  },
  {
    name: 'operation',
    align: 'center',
    label: 'operation',
    field: 'operation',
    type: 'operation'
  }
]
const configurationStore = useConfigurationStore()
const { skeletonTypeData: tableData } = storeToRefs(configurationStore)
const handleAdd = () => {
  let lastId = tableData.value.at(-1).id
  tableData.value.push({
    id: lastId + 1,
    name: 'new',
    description: '',
    color: utils.randomColor(),
    pointList: [],
    edgeList: []
  })
}
const handleDelete = (props) => {
  utils.confirm(
      'Are you sure to delete type ' + props.row.name + '?'
  ).onOk(() => {
    props.expand = false
    nextTick(() => {
      tableData.value.splice(tableData.value.findIndex(type => type.id === props.row.id), 1)
    })
  })
}
// Point
const handleAddPoint = (props) => {
  const pointList = props.row.pointList
  let lastId = pointList.length ? pointList.at(-1).id : -1
  pointList.push({
    id: lastId + 1,
    name: 'new',
    x: 0,
    y: 0
  })
}
const handleDeletePoint = (props, pointProps) => {
  const edgeList = props.row.edgeList
  const pointList = props.row.pointList
  const includeList = []
  for (const edge of edgeList) {
    if (edge.from === pointProps.row.id || edge.to === pointProps.row.id) {
      includeList.push(edge)
    }
  }
  if (includeList.length !== 0) {
    utils.notify('Please delete its corresponding edges first!' +
        includeList.map(edge => `\n(${edge.from} <=> ${edge.to})`), 'warning')
    return
  }
  utils.confirm(
      'Are you sure to delete point ' + pointProps.row.name + '?'
  ).onOk(() => {
    pointList.splice(pointList.findIndex(point => point.id === pointProps.row.id), 1)
  })
}
// Edge
const pointOptions = computed(() => {
  const ret = {}
  for (const type of tableData.value) {
    ret[type.id] = type.pointList.map(point => {
      return {
        label: point.name,
        value: point.id
      }
    })
    ret[type.id].unshift({
      label: 'center',
      value: -1
    })
  }
  return ret
})
const handleAddEdge = props => {
  const edgeList = props.row.edgeList
  let lastId = edgeList.length ? edgeList.at(-1).id : -1
  edgeList.push({
    id: lastId + 1,
    from: -1,
    to: -1
  })
}
const handleDeleteEdge = (props, edgeProps) => {
  utils.confirm(
      'Are you sure to delete edge (' + edgeProps.row.from + ' <=> ' + edgeProps.row.to + ')?'
  ).onOk(() => {
    const edgeList = props.row.edgeList
    edgeList.splice(edgeList.findIndex(edge => edge.id === edgeProps.row.id), 1)
  })
}
</script>
