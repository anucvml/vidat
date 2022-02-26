<template>
  <TableBase
      ref="table"
      title="Objects"
      storeKey="objectAnnotationListMap"
      rowKey="x"
      :position="position"
      :columnList="columnList"
  />
</template>

<script setup>
import { ref } from 'vue'
import TableBase from '~/pages/annotation/components/TableBase.vue'

const props = defineProps({
  position: {
    type: String,
    required: true
  }
})
const columnList = [
  {
    name: 'x',
    align: 'center',
    label: 'x',
    field: 'x',
    type: 'number'
  },
  {
    name: 'y',
    align: 'center',
    label: 'y',
    field: 'y',
    type: 'number'
  },
  {
    name: 'width',
    align: 'center',
    label: 'width',
    field: 'width',
    type: 'number'
  },
  {
    name: 'height',
    align: 'center',
    label: 'height',
    field: 'height',
    type: 'number'
  },
  {
    name: 'label',
    align: 'center',
    label: 'label',
    field: 'labelId',
    type: 'label'
  },
  {
    name: 'color',
    align: 'center',
    label: 'color',
    field: 'color',
    type: 'color'
  },
  {
    name: 'instance',
    align: 'center',
    label: 'instance',
    field: 'instance',
    type: 'number'
  },
  {
    name: 'score',
    align: 'center',
    label: 'score',
    field: 'score',
    type: 'number'
  },
  {
    name: 'operation',
    align: 'center',
    label: 'operation',
    field: 'operation',
    type: 'operation'
  }
]
const table = ref()
const focusLast = () => {
  table.value.focusLast()
}
defineExpose({
  focusLast
})
</script>
