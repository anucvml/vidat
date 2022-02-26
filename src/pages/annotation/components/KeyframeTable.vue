<template>
  <q-table
      class="full-width"
      dense
      flat
      :pagination="{ rowsPerPage: 5 }"
      :rows="annotationStore.keyframeList"
      :columns="columns"
  >
    <template v-slot:top="props">
      <div class="q-table__title">Keyframes</div>
      <q-space></q-space>
      <q-btn-group flat>
        <q-btn
            outline
            size="sm"
            icon="arrow_left"
            label="add left"
            @click="handleAddLeft"
        ></q-btn>
        <q-btn
            outline
            size="sm"
            icon="add"
            label="add"
            @click="handleAdd"
        ></q-btn>
        <q-btn
            outline
            size="sm"
            icon="arrow_right"
            label="add right"
            @click="handleAddRight"
        ></q-btn>
        <q-btn
            outline
            size="sm"
            icon="more_time"
            label="generate"
            @click="handleGenerate"
        ></q-btn>
        <q-btn
            outline
            size="sm"
            icon="save"
            label="export"
            @click="handleExport"
        ></q-btn>
      </q-btn-group>
    </template>
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td
            key="frame"
            :props="props"
        >
          {{ props.row }}
        </q-td>
        <q-td
            key="time"
            :props="props"
        >
          {{ utils.toFixed2(utils.index2time(props.row)) }}
        </q-td>
        <q-td
            key="nObject"
            :props="props"
        >
          {{
            annotationStore.objectAnnotationListMap[props.row]
                ? annotationStore.objectAnnotationListMap[props.row].length
                : 0
          }}
        </q-td>
        <q-td
            key="nRegion"
            :props="props"
        >
          {{
            annotationStore.regionAnnotationListMap[props.row]
                ? annotationStore.regionAnnotationListMap[props.row].length
                : 0
          }}
        </q-td>
        <q-td
            key="nSkeleton"
            :props="props"
        >
          {{
            annotationStore.skeletonAnnotationListMap[props.row]
                ? annotationStore.skeletonAnnotationListMap[props.row].length
                : 0
          }}
        </q-td>
        <q-td
            key="operation"
            :props="props"
        >
          <q-btn-group flat>
            <q-btn
                flat
                dense
                icon="gps_fixed"
                @click="handleLocate(props.row)"
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
      </q-tr>
    </template>
  </q-table>
</template>

<script setup>

import JSZip from 'jszip'
import { exportFile } from 'quasar'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { usePreferenceStore } from '~/store/preference.js'

const annotationStore = useAnnotationStore()
const preferenceStore = usePreferenceStore()
const columns = [
  { name: 'frame', align: 'center', label: 'frame' },
  { name: 'time', align: 'center', label: 'time' },
  { name: 'nObject', align: 'center', label: '# object' },
  { name: 'nRegion', align: 'center', label: '# region' },
  { name: 'nSkeleton', align: 'center', label: '# skeleton' },
  { name: 'operation', align: 'center', label: 'operation' }
]

const addKeyframe = (keyframe) => {
  const keyframeIndex = annotationStore.keyframeList.indexOf(keyframe)
  if (keyframeIndex === -1) {
    for (const i in annotationStore.keyframeList) {
      if (annotationStore.keyframeList[i] > keyframe) {
        annotationStore.keyframeList.splice(i, 0, keyframe)
        utils.notify(`Frame ${keyframe} is added successfully!`)
        return
      }
    }
    annotationStore.keyframeList.push(keyframe)
    utils.notify(`Frame ${keyframe} is added successfully!`)
  } else {
    utils.notify(`Frame ${keyframe} is already a keyframe!`)
  }
}
const handleAddLeft = () => {
  addKeyframe(annotationStore.leftCurrentFrame)
}
const handleAddRight = () => {
  addKeyframe(annotationStore.rightCurrentFrame)
}
const handleAdd = () => {
  utils.prompt(
      'Add keyframe',
      'Please input the id of frame you would like to mark as keyframe',
      0,
      'number'
  ).onOk((frame) => {
    frame = parseInt(frame)
    if (frame >= 0 && frame % 1 === 0 && frame <= annotationStore.video.frames) {
      addKeyframe(frame)
    } else {
      utils.notify(`Please enter an integer bigger than 0 and less than ${annotationStore.video.frames}`)
    }
  })
}
const handleGenerate = () => {
  utils.prompt(
      'Generate keyframes',
      'Generate keyframe every how many frames? Integer bigger or equal to 1.',
      preferenceStore.defaultFpk,
      'number'
  ).onOk((framePerKeyframe) => {
    framePerKeyframe = parseInt(framePerKeyframe)
    if (framePerKeyframe >= 1 && framePerKeyframe % 1 === 0) {
      const keyframeList = []
      for (let i = 0; i < annotationStore.video.frames; i += framePerKeyframe) {
        keyframeList.push(i)
      }
      annotationStore.keyframeList = keyframeList
    } else {
      utils.notify('Please enter an integer bigger than 1.')
    }
  })
}
const handleExport = () => {
  utils.prompt(
      'Save',
      'Enter keyframes filename for saving',
      'keyframes'
  ).onOk(filename => {
    // ensure that we have all the keyframes
    let isOk = true
    for (let i = 0; i < annotationStore.keyframeList.length; i++) {
      if (!annotationStore.cachedFrameList[annotationStore.keyframeList[i]]) {
        isOk = false
        break
      }
    }
    // export all keyframes as a zip file
    if (isOk) {
      const zip = new JSZip()
      for (let i = 0; i < annotationStore.keyframeList.length; i++) {
        const img = annotationStore.cachedFrameList[annotationStore.keyframeList[i]]
        zip.file(annotationStore.keyframeList[i] + '.jpg', img)
      }
      zip.generateAsync({ type: 'blob' }).then(blob => {
        exportFile(filename + '-' + annotationStore.video.fps + '-fps.zip', blob)
      })
    } else {
      utils.notify('Please wait for caching!')
    }
  })
}
const handleLocate = (keyframe) => {
  if (keyframe < annotationStore.rightCurrentFrame) {
    annotationStore.leftCurrentFrame = keyframe
  } else {
    annotationStore.leftCurrentFrame = keyframe
    annotationStore.rightCurrentFrame = keyframe
  }
}
const handleDelete = (keyframe) => {
  utils.confirm(`Are you sure delete keyframe ${keyframe}?`).onOk(() => {
    annotationStore.keyframeList.splice(annotationStore.keyframeList.indexOf(keyframe), 1)
  })
}
</script>
