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
</div>
`

import objectLabelTable from './components/objectLabelTable.js'
import actionLabelTable from './components/actionLabelTable.js'
import utils from '../../libs/utils.js'

export default {
  components: {
    objectLabelTable,
    actionLabelTable,
  },
  data: () => {
    return {}
  },
  methods: {
    handleLoad () {
      utils.confirm(
        'Are you sure to load? This would override the configuration!',
      ).onOk(() => {
        utils.importFile().then(file => {
          const fileData = JSON.parse(file)
          let objectLabelData = []
          let currentID = 0
          for (const key in fileData.objectLabels) {
            objectLabelData.push({
              id: currentID++,
              name: key,
              color: fileData.objectLabels[key],
            })
          }
          let actionLabelData = []
          currentID = 0
          for (const key in fileData.actionLabels) {
            actionLabelData.push({
              id: currentID++,
              name: key,
              color: fileData.actionLabels[key],
            })
          }
          this.$store.commit('objectLabelData', objectLabelData)
          this.$store.commit('actionLabelData', actionLabelData)
        })
      })
    },
    handleSave () {
      utils.prompt(
        'Save',
        'Enter configuration filename for saving',
        'config.json').onOk(filename => {
        let objectLabels = {}
        this.$store.state.settings.objectLabelData.forEach(element => {
          objectLabels[element.name] = element.color
        })
        let actionLabels = {}
        this.$store.state.settings.actionLabelData.forEach(element => {
          actionLabels[element.name] = element.color
        })
        const data = {
          objectLabels,
          actionLabels,
        }
        const file = new Blob([JSON.stringify(data)], { type: 'text/plain' })
        Quasar.utils.exportFile(filename, file)
      })
    },
  },
  template: CONFIGURATION_TEMPLATE,
}
