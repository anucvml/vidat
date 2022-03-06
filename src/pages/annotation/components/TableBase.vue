<template>
  <q-table
      dense
      flat
      :rows="annotationList"
      :row-key="rowKey"
      :columns="columnList"
      :pagination="{ rowsPerPage: 0 }"
  >
    <template v-slot:top="props">
      <div class="col-6 q-table__title">{{ title }}</div>
      <q-space></q-space>
      <q-btn
          size="sm"
          outline
          icon="clear_all"
          label="clear"
          @click="handleClearAll"
      ></q-btn>
    </template>
    <template v-slot:header="props">
      <q-tr>
        <q-th
            v-if="expand"
            auto-width
        ></q-th>
        <q-th
            v-for="col in props.cols"
            :key="col.name"
        >
          {{ col.label }}
        </q-th>
      </q-tr>
    </template>
    <template v-slot:body="props">
      <q-tr
          :class="{'highlighted' : props.row.highlight}"
          @mouseenter="props.row.highlight = true"
          @mouseleave="props.row.highlight = false"
      >
        <q-td
            v-if="expand"
            auto-width
        >
          <q-btn
              size="sm"
              flat
              round
              dense
              @click="props.expand = !props.expand"
              :icon="props.expand ? 'expand_more' : 'chevron_right'"
          ></q-btn>
        </q-td>
        <template
            v-for="col in props.cols"
            :key="props.row.field"
        >
          <q-td v-if="col.type === 'input'">
            <q-input
                input-class="text-center"
                v-model="props.row[col.field]"
                dense
                borderless
                hide-bottom-space
            />
          </q-td>
          <q-td v-else-if="col.type === 'number'">
            <q-input
                v-model.number="props.row[col.field]"
                dense
                borderless
                type="number"
                :debounce="1500"
                @mousewheel.prevent
            />
          </q-td>
          <q-td
              auto-width
              v-else-if="col.type === 'color'"
              class="cursor-pointer text-center"
          >
            <q-chip
                dense
                outline
                :style="{ 'border-color': props.row.color, 'color': props.row.color }"
            >
              {{ props.row.color.toUpperCase() }}
            </q-chip>
            <q-popup-edit
                auto-save
                v-model="props.row.color"
                title="Edit the label color"
            >
              <q-color v-model="props.row.color"></q-color>
            </q-popup-edit>
          </q-td>
          <q-td v-else-if="col.type === 'label'">
            <q-select
                ref="select"
                v-model="props.row.labelId"
                :options="labelOption"
                dense
                options-dense
                borderless
                emit-value
                map-options
                @update:model-value="handleLabelInput(props.row)"
            ></q-select>
          </q-td>
          <q-td
              auto-width
              v-else-if="col.type === 'operation'"
          >
            <q-btn-group
                spread
                flat
            >
              <q-btn
                  flat
                  dense
                  icon="keyboard_arrow_up"
                  @click="handleUp(props.row)"
              ></q-btn>
              <q-btn
                  flat
                  dense
                  icon="keyboard_arrow_down"
                  @click="handleDown(props.row)"
              ></q-btn>
              <q-btn
                  flat
                  dense
                  icon="delete"
                  color="negative"
                  @click="handleDelete(props.row)"
              ></q-btn>
            </q-btn-group>
          </q-td>
          <q-td
              v-else
              class="text-center"
          >{{ typeof col.field === 'string' ? props.row[col.field] : col.field(props.row) }}
          </q-td>
        </template>
      </q-tr>
      <q-tr v-if="props.expand">
        <q-td
            colspan="100%"
            style="padding: 0;"
        >
          <slot
              name="expand"
              :props="props"
          ></slot>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'

const props = defineProps({
  title: {
    required: true,
    type: String
  },
  storeKey: {
    required: true,
    type: String
  },
  rowKey: {
    required: true,
    type: String
  },
  position: {
    required: true,
    type: String
  },
  columnList: {
    required: true,
    type: Array
  },
  expand: {
    default: false,
    type: Boolean
  }
})
const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()
const annotationList = computed({
  get: () => annotationStore[props.storeKey][annotationStore[props.position + 'CurrentFrame']],
  set: newValue => {
    annotationStore[props.storeKey][annotationStore[props.position + 'CurrentFrame']] = newValue
  }
})
const labelOption = computed(() => configurationStore.objectLabelData.map(label => {
  return {
    label: label.name,
    value: label.id,
    color: label.color
  }
}))

const handleLabelInput = row => {
  row.color = configurationStore.objectLabelData.find(label => label.id === row.labelId).color
}
const handleUp = row => {
  for (let i = 0; i < annotationList.value.length; i++) {
    if (annotationList.value[i] === row) {
      if (i - 1 >= 0) {
        annotationList.value[i] = annotationList.value.splice(i - 1, 1, annotationList.value[i])[0]
      }
      break
    }
  }
}
const handleDown = (row) => {
  for (let i = 0; i < annotationList.value.length; i++) {
    if (annotationList.value[i] === row) {
      if (i + 2 <= annotationList.value.length) {
        annotationList.value[i] = annotationList.value.splice(i + 1, 1, annotationList.value[i])[0]
      }
      break
    }
  }
}
const handleDelete = row => {
  utils.confirm('Are you sure to delete this object?').onOk(() => {
    for (let i in annotationList.value) {
      if (annotationList.value[i] === row) {
        annotationList.value.splice(i, 1)
      }
    }
  })
}
const handleClearAll = () => {
  if (annotationList.value.length > 0) {
    utils.confirm('Are you sure to delete ALL objects?').onOk(() => {
      annotationList.value = []
    })
  } else {
    utils.notify('There are no objects!', 'warning')
  }
}
const currentInstance = getCurrentInstance()
const focusLast = () => {
  const selectList = currentInstance.ctx.$refs.select
  if (selectList) {
    selectList[selectList.length - 1].showPopup()
  }
}
defineExpose({
  focusLast
})
</script>

<style scoped>
.highlighted {
  background: rgba(0, 0, 0, 0.03);
}

.body--dark .highlighted {
  background: rgba(255, 255, 255, 0.07);
}
</style>
