<template>
  <TableBase
      ref="table"
      title="Regions"
      storeKey="regionAnnotationListMap"
      rowKey="pointList"
      :position="position"
      :columnList="columnList"
      expand
  >
    <template v-slot:expand="{props}">
      <q-table
          dense
          flat
          hide-bottom
          :rows="props.row.pointList"
          :columns="[
            { name: 'x', align: 'left', label: 'x', field: 'x' },
            { name: 'y', align: 'left', label: 'y', field: 'y' },
          ]"
          :pagination="{ rowsPerPage: 0 }"
      >
        <template v-slot:body="props">
          <q-tr>
            <q-td>
              <q-input
                  v-model.number="props.row.x"
                  dense
                  borderless
                  type="number"
                  :debounce="1500"
                  @mousewheel.prevent
              />
            </q-td>
            <q-td>
              <q-input
                  v-model.number="props.row.y"
                  dense
                  borderless
                  type="number"
                  :debounce="1500"
                  @mousewheel.prevent
              />
            </q-td>
          </q-tr>
        </template>
      </q-table>
    </template>
  </TableBase>
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
    name: 'pointList',
    align: 'center',
    label: '#points',
    field: row => row.pointList.length
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
