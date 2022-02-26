<template>
  <TableBase
      title="Action Labels"
      storeKey="actionLabelData"
      :columnList="columnList"
      :importFunction="configurationStore.importActionLabelData"
      expand
      @add="handleAdd"
      @delete="handleDelete"
  >
    <template v-slot:expand="{props}">
      <q-td
          colspan="100%"
          style="white-space: normal;"
      >
        <div class="q-mb-sm">
          <q-btn-group
              dense
              flat
          >
            <q-btn
                size="sm"
                outline
                icon="apps"
                @click="handleSelectAll(props.row)"
                label="Select All"
            ></q-btn>
            <q-btn
                size="sm"
                outline
                icon="clear_all"
                @click="handleClearAll(props.row)"
                label="Clear All"
            ></q-btn>
          </q-btn-group>
        </div>
        <div class="q-gutter-xs">
          <q-chip
              square
              v-for="object in objectLabelData"
              :key="object.id"
              :selected="selectedObjectListMap[props.row.id][object.id]"
              :color="$q.dark.isActive ? 'primary' : 'secondary'"
              @update:selected="handleSelectUpdate(props.row.id, object.id)"
          >
            {{ object.name }}
          </q-chip>
        </div>
      </q-td>
    </template>
  </TableBase>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import utils from '~/libs/utils.js'
import TableBase from '~/pages/configuration/components/TableBase.vue'
import { useConfigurationStore } from '~/store/configuration.js'

// Action
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
    name: 'nObjects',
    align: 'center',
    label: '#objects',
    field: (row) => row.objects.length
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
const { actionLabelData: tableData, objectLabelData } = storeToRefs(configurationStore)
const handleAdd = () => {
  let lastId = tableData.value.at(-1).id
  tableData.value.push({
    id: lastId + 1,
    name: 'new',
    color: utils.randomColor(),
    objects: [0]
  })
}
const handleDelete = (props) => {
  utils.confirm(
      'Are you sure to delete label ' + props.row.name + '?'
  ).onOk(() => {
    tableData.value.splice(tableData.value.findIndex(type => type.id === props.row.id), 1)
  })
}
// Object
const handleSelectAll = row => {
  row.objects = objectLabelData.value.map(object => object.id)
}
const handleClearAll = row => {
  row.objects = [0]
}
const selectedObjectListMap = computed(() => {
  const ret = {}
  for (const action of tableData.value) {
    ret[action.id] = {}
    for (const object of objectLabelData.value) {
      ret[action.id][object.id] = action.objects.indexOf(object.id) !== -1
    }
  }
  return ret
})
const handleSelectUpdate = (actionID, objectID) => {
  const action = tableData.value.find(action => action.id === actionID)
  if (action.objects.indexOf(objectID) === -1) {
    action.objects.push(objectID)
    action.objects.sort((a, b) => a - b)
  } else {
    action.objects.splice(action.objects.indexOf(objectID), 1)
  }
}
</script>
