const CONFIGURATION_TEMPLATE = `
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
`

import objectLabelTable from './components/objectLabelTable.js'
import actionLabelTable from './components/actionLabelTable.js'
import skeletonTypeTable from './components/skeletonTypeTable.js'
import utils from '../../libs/utils.js'

export default {
  components: {
    objectLabelTable,
    actionLabelTable,
    skeletonTypeTable,
  },
  data: () => {
    return {}
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
            this.importConfig(file)
            utils.notify('Load successfully!')
          } catch (e) {
            utils.notify(e.toString())
          }
        })
      })
    },
    handleSave () {
      utils.prompt(
        'Save',
        'Enter configuration filename for saving',
        'config',
      ).onOk(filename => {
        const data = this.$store.getters.exportConfig
        const file = new Blob([JSON.stringify(data)], { type: 'text/plain' })
        Quasar.utils.exportFile(filename + '.json', file)
      })
    },
  },
  template: CONFIGURATION_TEMPLATE,
}
