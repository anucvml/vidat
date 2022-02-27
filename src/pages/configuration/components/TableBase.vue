<template>
  <TableEditor
      v-if="showEdit"
      v-model="jsonData"
      :title="title"
      @close="toggleShowEdit"
  />
  <q-table
      v-show="!showEdit"
      :rows="tableData"
      :columns="columnList"
      row-key="id"
      :pagination="{ rowsPerPage: 0 }"
  >
    <template v-slot:top="props">
      <div class="col-6 q-table__title">{{ title }}</div>
      <q-space></q-space>
      <q-btn-group flat>
        <q-btn
            size="sm"
            outline
            icon="edit"
            @click="toggleShowEdit"
            label="edit"
        ></q-btn>
        <q-btn
            size="sm"
            outline
            icon="add"
            @click="$emit('add')"
            label="add"
        ></q-btn>
      </q-btn-group>
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
      <q-tr>
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
            <ZoomImage
                class="vertical-middle float-left"
                style="height: 40px;"
                :src="props.row.thumbnail"
            />
            <q-input
                input-class="text-center"
                v-model="props.row[col.field]"
                dense
                borderless
                :rules="[ val => val.length !== 0 || 'Please enter at least 1 character' ]"
                :disable="props.row[col.field] === 'default'"
                hide-bottom-space
            />
          </q-td>
          <q-td
              v-else-if="col.type === 'color'"
              class="cursor-pointer text-center"
          >
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
            >
              <q-color v-model="props.row.color"></q-color>
            </q-popup-edit>
          </q-td>
          <q-td v-else-if="col.type === 'operation'">
            <q-btn
                icon="delete"
                color="negative"
                flat
                dense
                style="width: 100%"
                :disabled="props.row.name === 'default'"
                @click="$emit('delete', props)"
            ></q-btn>
          </q-td>
          <q-td
              v-else
              class="text-center"
          >{{ typeof col.field === 'string' ? props.row[col.field] : col.field(props.row) }}
          </q-td>
        </template>
      </q-tr>
      <q-tr v-if="props.expand">
        <slot
            name="expand"
            :props="props"
        ></slot>
      </q-tr>
    </template>
  </q-table>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, ref } from 'vue'
import ZoomImage from '~/components/ZoomImage.vue'
import { useConfigurationStore } from '~/store/configuration.js'

const TableEditor = defineAsyncComponent(() => import('~/pages/configuration/components/TableEditor.vue'))

const props = defineProps({
  title: {
    required: true,
    type: String
  },
  storeKey: {
    required: true,
    type: String
  },
  columnList: {
    required: true,
    type: Array
  },
  importFunction: {
    required: true,
    type: Function
  },
  expand: {
    default: false,
    type: Boolean
  }
})

defineEmits(['add', 'delete'])

// Table
const configurationStore = useConfigurationStore()
const { [props.storeKey]: tableData } = storeToRefs(configurationStore)

// Edit
const showEdit = ref(false)
const toggleShowEdit = () => {
  showEdit.value = !showEdit.value
}
const jsonData = computed({
  get () {
    return JSON.stringify(tableData.value, null, 2)
  },
  set (newValue) {
    props.importFunction(JSON.parse(newValue))
  }
})
</script>
