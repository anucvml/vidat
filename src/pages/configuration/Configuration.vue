<template>
  <div style="max-width: 800px; margin: 0 auto" class="q-gutter-md">
    <div class="row">
      <div class="text-h5">Configuration</div>
      <q-space></q-space>
      <q-btn-group>
        <q-btn class="q-px-md" dense @click="handleLoad" icon="publish" label="load"></q-btn>
        <q-btn class="q-px-md" dense color="primary" icon="get_app" @click="handleSave" label="save"></q-btn>
      </q-btn-group>
    </div>
    <object-label-table></object-label-table>
    <action-label-table></action-label-table>
    <skeleton-type-table></skeleton-type-table>
  </div>
</template>

<script>
import Vuex from 'vuex'
import { exportFile } from 'quasar'

import objectLabelTable from './components/ObjectLabelTable'
import actionLabelTable from './components/ActionLabelTable'
import skeletonTypeTable from './components/SkeletonTypeTable'
import utils from '../../libs/utils'

export default {
  name: 'configuration',
  components: {
    objectLabelTable,
    actionLabelTable,
    skeletonTypeTable,
  },
  methods: {
    ...Vuex.mapMutations([
      'importConfig',
    ]),
    handleLoad () {
      utils.confirm(
        'Are you sure to load? This would override the configuration!',
      ).onOk(() => {
        utils.importFile().then(file => {
          try {
            this.importConfig(JSON.parse(file))
            utils.notify('Load successfully!')
          } catch (e) {
            utils.notify(e.toString())
            throw e
          }
        })
      })
    },
    handleSave () {
      utils.prompt(
        'Save',
        'Enter configuration filename for saving',
        'config').onOk(filename => {
        const data = this.$store.getters.exportConfig
        const file = new Blob([JSON.stringify(data)], { type: 'text/plain' })
        exportFile(filename + '.json', file)
      })
    },
  },
}
</script>

<style scoped>

</style>
