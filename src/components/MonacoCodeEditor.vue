<template>
  <div ref="monacoContainer"></div>
</template>

<script setup>
import * as monaco from 'monaco-editor/editor/editor.main.js'
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker'
import JsonWorker from 'monaco-editor/language/json/json.worker.js?worker'
import 'monaco-editor/language/json/monaco.contribution'
import { useQuasar } from 'quasar'
import { onMounted, onUnmounted, ref, watch } from 'vue'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new JsonWorker()
    return new EditorWorker()
  }
}

const props = defineProps({
  modelValue: {
    required: true,
    type: String
  },
  language: {
    required: true,
    type: String
  }
})
const emits = defineEmits(['update:modelValue'])

const q = useQuasar()

let monacoEditor
let onDidChangeModelContentHandler
const monacoContainer = ref()
onMounted(() => {
  monacoEditor = monaco.editor.create(monacoContainer.value, {
    value: props.modelValue,
    language: props.language,
    theme: q.dark.isActive ? 'vs-dark' : 'vs'
  })
  onDidChangeModelContentHandler = monacoEditor.onDidChangeModelContent(() => {
    emits('update:modelValue', monacoEditor.getValue())
  })
  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue !== monacoEditor.getValue()) {
        monacoEditor.getModel().setValue(newValue)
      }
    }
  )
})
onUnmounted(() => {
  onDidChangeModelContentHandler.dispose()
  monacoEditor.dispose()
})
</script>
