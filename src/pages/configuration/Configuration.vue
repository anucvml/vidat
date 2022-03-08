<template>
  <div
      style="max-width: 800px; margin: 0 auto"
      class="q-gutter-md"
  >
    <div class="row">
      <div class="text-h5">Configuration</div>
      <q-space></q-space>
      <q-btn-group flat>
        <q-btn
            outline
            icon="publish"
            label="load"
            @click="handleLoad"
        ></q-btn>
        <q-btn
            outline
            color="primary"
            icon="get_app"
            label="save"
            @click="handleSave"
        ></q-btn>
      </q-btn-group>
    </div>
    <ObjectLabelTable/>
    <ActionLabelTable/>
    <SkeletonTypeTable/>
  </div>
</template>

<script setup>
import { exportFile } from 'quasar'
import { useConfigurationStore } from '~/store/configuration.js'
import utils from '../../libs/utils.js'
import ActionLabelTable from './ActionLabelTable.vue'
import ObjectLabelTable from './ObjectLabelTable.vue'
import SkeletonTypeTable from './SkeletonTypeTable.vue'

const configurationStore = useConfigurationStore()
const handleLoad = () => {
  utils.confirm(
      'Are you sure to load? This would override the configuration!'
  ).onOk(() => {
    utils.importFile().then(file => {
      try {
        configurationStore.importConfig(JSON.parse(file))
        utils.notify('Load successfully!', 'positive')
      } catch (e) {
        console.error(e)
        utils.notify(`Could not load config: ${e}`, 'negative')
      }
    })
  })
}
const handleSave = () => {
  utils.prompt(
      'Save',
      'Enter configuration filename for saving',
      'config'
  ).onOk(filename => {
    const data = configurationStore.exportConfig()
    const file = new Blob([JSON.stringify(data)], { type: 'text/plain' })
    exportFile(filename + '.json', file)
  })
}
</script>
