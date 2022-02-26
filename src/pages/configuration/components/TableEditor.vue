<template>
  <q-card>
    <div class="row q-table__top">
      <div class="col-6 q-table__title">{{ title }}</div>
      <q-space></q-space>
      <q-btn-group flat>
        <q-btn
            size="sm"
            outline
            icon="save"
            color="primary"
            @click="handleSave"
            label="save"
        ></q-btn>
        <q-btn
            size="sm"
            outline
            icon="close"
            color="negative"
            @click="handleCancel"
            label="cancel"
        ></q-btn>
      </q-btn-group>
    </div>
    <MonacoCodeEditor
        style="height: 70vh;"
        v-model="jsonString"
        language="json"
    />
  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import MonacoCodeEditor from '~/components/MonacoCodeEditor.vue'
import utils from '~/libs/utils.js'

const props = defineProps({
  modelValue: {
    required: true,
    type: String
  },
  title: {
    required: true,
    type: String
  }
})
const emits = defineEmits(['update:modelValue', 'close'])

const jsonString = ref(props.modelValue)
const handleSave = () => {
  try {
    emits('update:modelValue', jsonString.value)
    emits('close')
  } catch (e) {
    utils.notify(e.toString(), 'negative')
    throw e
  }
}
const handleCancel = () => {
  if (jsonString.value !== props.modelValue) {
    utils.confirm('Are you sure to leave without save?').onOk(() => {
      emits('close')
    })
  } else {
    emits('close')
  }
}
</script>
