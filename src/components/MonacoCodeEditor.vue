<template>
  <div ref="monacoContainer"></div>
</template>

<script setup>
import 'monaco-editor/esm/vs/editor/editor.all.js'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js'
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js'
import 'monaco-editor/esm/vs/language/json/monaco.contribution'

import { useQuasar } from 'quasar'
import { onMounted, onUnmounted, ref, watch } from 'vue'

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
  onDidChangeModelContentHandler = monacoEditor.onDidChangeModelContent((() => {
    emits('update:modelValue', monacoEditor.getValue())
  }))
  watch(() => props.modelValue, (newValue) => {
    monacoEditor.getModel().setValue(newValue)
  })
})
onUnmounted(() => {
  onDidChangeModelContentHandler.dispose()
  monacoEditor.dispose()
})
</script>
