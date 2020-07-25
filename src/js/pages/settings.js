const SETTINGS_TEMPLATE = `
<q-page padding style="max-width: 800px; margin: 0 auto" class="q-gutter-md">
  <div class="text-h5">Settings</div>
  <div class="row">
    <div class="text-h6">Configuration</div>
    <q-space></q-space>
    <q-btn-group>
      <q-btn class="q-px-md" dense @click="handleLoad" icon="publish">Load</q-btn>
      <q-btn class="q-px-md" dense color="primary" icon="get_app" @click="handleSave">Save</q-btn>
    </q-btn-group>
  </div>
  <label-table tableTitle="Object Labels" dataName="objectLabelData"></label-table>
  <label-table tableTitle="Action Labels" dataName="actionLabelData"></label-table>
  <div class="row">
    <div class="text-h6">Preferences (Show/Hide)</div>
    <q-space></q-space>
    <q-btn class="q-px-md" dense color="primary" icon="cached" @click="handleRestore">Restore</q-btn>
  </div>
  <q-list>
    <q-item tag="label" v-ripple>
      <q-item-section>
        <q-item-label>Keyframes</q-item-label>
      </q-item-section>
      <q-item-section avatar>
        <q-toggle
          color="green"
          v-model="preference.keyframes"
          checked-icon="check"
          unchecked-icon="clear"
          @input="handleSavePreference"
        ></q-toggle>
      </q-item-section>
    </q-item>
    <q-item tag="label" v-ripple>
      <q-item-section>
        <q-item-label>Objects (bounding boxes)</q-item-label>
      </q-item-section>
      <q-item-section avatar>
        <q-toggle
          color="green"
          v-model="preference.objects"
          checked-icon="check"
          unchecked-icon="clear"
          @input="handleSavePreference"
        ></q-toggle>
      </q-item-section>
    </q-item>
    <q-item tag="label" v-ripple>
      <q-item-section>
        <q-item-label>Regions (polygon outlines)</q-item-label>
      </q-item-section>
      <q-item-section avatar>
        <q-toggle
          color="green"
          v-model="preference.regions"
          checked-icon="check"
          unchecked-icon="clear"
          @input="handleSavePreference"
        ></q-toggle>
      </q-item-section>
    </q-item>
    <q-item tag="label" v-ripple>
      <q-item-section>
        <q-item-label>Video segments</q-item-label>
      </q-item-section>
      <q-item-section avatar>
        <q-toggle
          color="green"
          v-model="preference.videoSegments"
          checked-icon="check"
          unchecked-icon="clear"
          @input="handleSavePreference"
        ></q-toggle>
      </q-item-section>
    </q-item>
  </q-list>
</q-page>
`

import labelTable from '../components/labelTable.js'
import utils from '../libs/utils.js'

export default {
  components: {
    labelTable,
  },
  data: () => {
    return {
      labelTable,
    }
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
        'config.txt').onOk(filename => {
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
    handleRestore () {
      this.preference = {
        keyframes: true,
        objects: true,
        regions: true,
        videoSegments: true,
      }
      this.handleSavePreference()
    },
    handleSavePreference () {
      this.$store.commit('preferenceData', this.preference)
    },
  },
  computed: {
    preference () {
      return this.$store.state.settings.preferenceData
    },
  },
  template: SETTINGS_TEMPLATE,
}
