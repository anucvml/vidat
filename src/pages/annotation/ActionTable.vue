<template>
  <q-table
    dense
    flat
    :rows="annotationStore.actionAnnotationList"
    row-key="start"
    :columns="columnList"
    :pagination="{ rowsPerPage: 0 }"
    :filter="actionFilterList"
    :filter-method="actionFilter"
    :sort-method="actionSort"
    binary-state-sort
  >
    <template v-slot:top="props">
      <div class="col-6 q-table__title">Actions / Video Segments</div>
      <q-space></q-space>
      <q-btn-group flat>
        <q-btn
          size="sm"
          outline
          :icon="showFilter ? 'expand_more' : 'expand_less'"
          label="filter"
          @click="showFilter = !showFilter"
        ></q-btn>
        <q-btn
          size="sm"
          outline
          icon="add"
          label="add"
          @click="handleAdd"
        >
          <q-tooltip>add current range (+)</q-tooltip>
        </q-btn>
        <q-btn
          size="sm"
          outline
          icon="new_label"
          label="add & advance"
          @click="handleAddAdvance"
        >
          <q-tooltip>add current range and advance for next</q-tooltip>
        </q-btn>
        <q-btn
          size="sm"
          outline
          icon="clear_all"
          label="clear"
          @click="handleClearAll"
        >
          <q-tooltip>Bulk clear all actions</q-tooltip>
        </q-btn>
      </q-btn-group>
      <div
        class="col-12"
        v-if="showFilter"
      >
        <div class="q-mb-sm">
          <q-btn-group
            dense
            flat
          >
            <q-btn
              outline
              size="sm"
              icon="apps"
              label="select all"
              @click="handleSelectAll"
            >
              <q-tooltip>select all actions</q-tooltip>
            </q-btn>
            <q-btn
              outline
              size="sm"
              icon="clear_all"
              label="clear all"
              @click="handleClearSelectedAll"
            >
              <q-tooltip>clear all actions</q-tooltip>
            </q-btn>
          </q-btn-group>
        </div>
        <div class="q-gutter-xs row truncate-chip-labels">
          <q-chip
            v-for="action in configurationStore.actionLabelData"
            :key="action.id"
            v-model:selected="actionFilterList[action.id]"
            :label="action.name"
            style="max-width: 150px"
            color="primary"
            text-color="white"
          >
            <q-tooltip>{{ action.name }}</q-tooltip>
          </q-chip>
        </div>
      </div>
    </template>
    <template v-slot:body="props">
      <q-tr
        :class="{
          'bg-warning': props.row.end - props.row.start <= 0,
          'bg-green-2': props.row === annotationStore.currentThumbnailAction
        }"
      >
        <q-tooltip
          anchor="top middle"
          v-if="props.row.end - props.row.start <= 0"
          >Duration should be greater than 0.
        </q-tooltip>
        <q-td auto-width>
          <q-input
            style="min-width: 100px"
            v-model.number="props.row.start"
            dense
            borderless
            type="number"
            :debounce="1500"
            @mousewheel.prevent
          ></q-input>
        </q-td>
        <q-td auto-width>
          <q-input
            style="min-width: 100px"
            v-model.number="props.row.end"
            dense
            borderless
            type="number"
            :debounce="1500"
            @mousewheel.prevent
          ></q-input>
        </q-td>
        <q-td auto-width>
          {{ utils.toFixed2(props.row.end - props.row.start) }}
        </q-td>
        <q-td>
          <img
            v-if="configurationStore.actionLabelData.find((label) => label.id === props.row.action).thumbnail"
            class="cursor-pointer rounded-borders vertical-middle float-left q-mr-md"
            style="height: 40px"
            :src="configurationStore.actionLabelData.find((label) => label.id === props.row.action).thumbnail"
            @click="handleThumbnailPreview(props)"
            alt="thumbnail"
          />
          <q-select
            v-model="props.row.action"
            :options="actionOptionList"
            dense
            options-dense
            borderless
            emit-value
            map-options
            @update:model-value="handleActionInput(props.row)"
          ></q-select>
        </q-td>
        <q-td>
          <q-select
            v-model="props.row.object"
            :options="objectOptionMap[props.row.action]"
            dense
            options-dense
            borderless
            emit-value
            map-options
          ></q-select>
        </q-td>
        <q-td
          auto-width
          class="cursor-pointer text-center"
        >
          <q-chip
            dense
            outline
            :style="{ 'border-color': props.row.color, color: props.row.color }"
          >
            {{ props.row.color.toUpperCase() }}
          </q-chip>
          <q-popup-edit
            auto-save
            v-model="props.row.color"
            title="Edit the action color"
          >
            <q-color v-model="props.row.color"></q-color>
          </q-popup-edit>
        </q-td>
        <q-td>
          <q-input
            v-model="props.row.description"
            dense
            borderless
            type="text"
          ></q-input>
        </q-td>
        <q-td auto-width>
          <q-btn-group
            spread
            flat
          >
            <q-btn
              flat
              dense
              icon="gps_fixed"
              style="width: 100%"
              @click="handleGoto(props.row)"
            >
              <q-tooltip>Locate to the action</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="edit_location_alt"
              style="width: 100%"
              @click="handleSet(props.row)"
            >
              <q-tooltip>Set current left / right frame as this action's start / end</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="delete"
              color="negative"
              style="width: 100%"
              @click="handleDelete(props.row)"
            ></q-btn>
          </q-btn-group>
        </q-td>
      </q-tr>
    </template>
  </q-table>
  <ActionThumbnailPreview />
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ActionAnnotation } from '~/libs/annotationlib.js'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { useMainStore } from '~/store/index.js'
import ActionThumbnailPreview from '~/components/ActionThumbnailPreview.vue'

const annotationStore = useAnnotationStore()
const configurationStore = useConfigurationStore()
const mainStore = useMainStore()

const columnList = [
  {
    name: 'start',
    align: 'center',
    label: 'start',
    field: 'start',
    sortable: true,
    sort: (a, b, rowA, rowB) => (a !== b ? a - b : rowA.end - rowB.end)
  },
  {
    name: 'end',
    align: 'center',
    label: 'end',
    field: 'end',
    sortable: true,
    sort: (a, b, rowA, rowB) => (a !== b ? a - b : rowA.start - rowB.start)
  },
  {
    name: 'duration',
    align: 'center',
    label: 'duration'
  },
  {
    name: 'action',
    align: 'center',
    label: 'action',
    field: 'action'
  },
  {
    name: 'object',
    align: 'center',
    label: 'object',
    field: 'object'
  },
  {
    name: 'color',
    align: 'center',
    label: 'color',
    field: 'color'
  },
  {
    name: 'description',
    align: 'center',
    label: 'description',
    field: 'description'
  },
  {
    name: 'operation',
    align: 'center',
    label: 'operation',
    field: 'operation'
  }
]

// header
const handleAdd = () => {
  annotationStore.actionAnnotationList.push(
    new ActionAnnotation(
      utils.index2time(annotationStore.leftCurrentFrame),
      utils.index2time(annotationStore.rightCurrentFrame),
      configurationStore.actionLabelData[0].id,
      configurationStore.actionLabelData[0].objects[0],
      configurationStore.actionLabelData[0].color,
      ''
    )
  )
}
const handleAddAdvance = () => {
  handleAdd()
  const nextFrame =
    annotationStore.rightCurrentFrame + 1 > annotationStore.video.frames
      ? annotationStore.rightCurrentFrame
      : annotationStore.rightCurrentFrame + 1
  // right frame -> next keyframe from action end frame + 1
  let min = annotationStore.video.frames
  let nearestKeyframe = nextFrame
  for (let i = 0; i < annotationStore.keyframeList.length; i++) {
    let distance = annotationStore.keyframeList[i] - nextFrame
    if (distance > 0 && distance < min) {
      min = distance
      nearestKeyframe = annotationStore.keyframeList[i]
    }
  }
  annotationStore.rightCurrentFrame = nearestKeyframe
  // left frame -> left frame => action end frame + 1
  annotationStore.leftCurrentFrame = nextFrame
}
const handleClearAll = () => {
  if (annotationStore.actionAnnotationList.length !== 0) {
    utils.confirm('Are you sure to delete ALL actions?').onOk(() => {
      annotationStore.currentThumbnailAction = null
      annotationStore.actionAnnotationList = []
    })
  } else {
    utils.notify('There are no actions!', 'warning')
  }
}

/// filter
const showFilter = ref(false)
const actionFilterList = ref({})
configurationStore.actionLabelData.forEach((label) => {
  actionFilterList.value[label.id] = true
})
const handleSelectAll = () => {
  configurationStore.actionLabelData.forEach((label) => {
    actionFilterList.value[label.id] = true
  })
}
const handleClearSelectedAll = () => {
  configurationStore.actionLabelData.forEach((label) => {
    actionFilterList.value[label.id] = false
  })
  actionFilterList.value[0] = true
}
const actionFilter = (rows, filter) => {
  return rows.filter((row) => filter[row.action])
}

// sort
annotationStore.currentSortedActionList = annotationStore.actionAnnotationList
const actionSort = (rows, sortBy, descending) => {
  const sortedRows = rows.slice().sort((a, b) => {
    const sortVal = a[sortBy] < b[sortBy] ? -1 : 1
    return descending ? sortVal : -sortVal
  })
  annotationStore.currentSortedActionList = sortedRows
  return sortedRows
}

// body
const actionOptionList = computed(() =>
  configurationStore.actionLabelData.map((label) => {
    return {
      label: label.name,
      value: label.id
    }
  })
)
const objectOptionMap = ref({})
for (let action of configurationStore.actionLabelData) {
  const objectOptionList = []
  for (let object of configurationStore.objectLabelData) {
    if (action.objects.includes(object.id)) {
      objectOptionList.push({
        label: object.name,
        value: object.id
      })
    }
  }
  objectOptionMap.value[action.id] = objectOptionList
}
const handleThumbnailPreview = (props) => {
  const { row } = props
  if (configurationStore.actionLabelData.find((label) => label.id === row.action).thumbnail) {
    annotationStore.currentThumbnailAction = annotationStore.currentThumbnailAction === row ? null : row
  }
}
const handleActionInput = (row) => {
  row.color = configurationStore.actionLabelData.find((label) => label.id === row.action).color
  row.object = configurationStore.actionLabelData.find((label) => label.id === row.action).objects[0]
}

/// operation
const handleGoto = (row) => {
  if (typeof row.start === 'number') {
    annotationStore.leftCurrentFrame = utils.time2index(row.start)
  }
  if (typeof row.end === 'number') {
    annotationStore.rightCurrentFrame = utils.time2index(row.end)
  }
}
const handleSet = (row) => {
  row.start = utils.index2time(annotationStore.leftCurrentFrame)
  row.end = utils.index2time(annotationStore.rightCurrentFrame)
}
const handleDelete = (row) => {
  utils.confirm('Are you sure to delete this action?').onOk(() => {
    annotationStore.currentThumbnailAction = null
    for (let i in annotationStore.actionAnnotationList) {
      if (annotationStore.actionAnnotationList[i] === row) {
        annotationStore.actionAnnotationList.splice(i, 1)
      }
    }
  })
}

// keybindings
const handleKeyup = (event) => {
  event.stopPropagation()
  if (event.target.nodeName.toLowerCase() === 'input') {
    return false
  }
  if (event.code === 'Equal') {
    handleAdd()
  }
}
onMounted(() => {
  document.addEventListener('keyup', handleKeyup, true)
})
onUnmounted(() => {
  document.removeEventListener('keyup', handleKeyup, true)
})
</script>
