<template>
  <TableBase
      title="Object Labels"
      storeKey="objectLabelData"
      :columnList="columnList"
      :importFunction="configurationStore.importObjectLabelData"
      @add="handleAdd"
      @delete="handleDelete"
  />
</template>

<script setup>
import { storeToRefs } from 'pinia'
import utils from '~/libs/utils.js'
import TableBase from '~/pages/configuration/components/TableBase.vue'
import { useConfigurationStore } from '~/store/configuration.js'

// Table
const columnList = [
  {
    name: 'name',
    align: 'center',
    label: 'name',
    field: 'name',
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
    name: 'operation',
    align: 'center',
    label: 'operation',
    field: 'operation',
    type: 'operation'
  }
]
const configurationStore = useConfigurationStore()
const { objectLabelData: tableData } = storeToRefs(configurationStore)
const handleAdd = () => {
  let lastId = tableData.value.at(-1).id
  tableData.value.push({
    id: lastId + 1,
    name: 'new',
    color: utils.randomColor()
  })
}
const handleDelete = (props) => {
  utils.confirm(
      'Are you sure to delete label ' + props.row.name + '?'
  ).onOk(() => {
    tableData.value.splice(tableData.value.findIndex(type => type.id === props.row.id), 1)
  })
}
</script>
