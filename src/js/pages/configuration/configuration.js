const CONFIGURATION_TEMPLATE = `
<div style="max-width: 800px; margin: 0 auto" class="q-gutter-md">
  <div class="row">
    <div class="text-h5">Configuration</div>
    <q-space></q-space>
    <q-btn-group>
      <q-btn class="q-px-md" dense @click="handleLoad" icon="publish">Load</q-btn>
      <q-btn class="q-px-md" dense color="primary" icon="get_app" @click="handleSave">Save</q-btn>
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
      'importObjectLabelData',
      'importActionLabelData',
      'importSkeletonTypeData',
    ]),
    handleLoad () {
      utils.confirm(
        'Are you sure to load? This would override the configuration!',
      ).onOk(() => {
        utils.importFile().then(file => {
          try {
            const data = JSON.parse(file)
            if (data.objectLabelData) {
              this.importObjectLabelData(data.objectLabelData)
            }
            if (data.actionLabelData) {
              this.importActionLabelData(data.actionLabelData)
            }
            if (data.skeletonTypeData) {
              this.importSkeletonTypeData(data.skeletonTypeData)
            }
          } catch (e) {
            utils.notify(e.toString())
          }
          utils.notify('Load successfully!')
        })
      })
    },
    handleSave () {
      utils.prompt(
        'Save',
        'Enter configuration filename for saving',
        'config').onOk(filename => {
        const data = {
          objectLabelData: this.$store.state.settings.objectLabelData,
          actionLabelData: this.$store.state.settings.actionLabelData,
          skeletonTypeData: this.$store.state.settings.skeletonTypeData,
        }
        const file = new Blob([JSON.stringify(data)], { type: 'text/plain' })
        Quasar.utils.exportFile(filename + '.json', file)
      })
    },
  },
  template: CONFIGURATION_TEMPLATE,
}
