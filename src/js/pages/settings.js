const SETTINGS_TEMPLATE = `
<q-page padding style="max-width: 800px; margin: 0 auto" class="q-gutter-md">
  <div class="text-h5">Settings</div>
  <div class="text-h6">Configuration</div>
  <label-table tableTitle="Object Labels" dataName="objectLabelData"></label-table>
  <label-table tableTitle="Action Labels" dataName="actionLabelData"></label-table>
  <div class="text-h6">Preferences</div>
</q-page>
`

import labelTable from '../components/labelTable.js'

export default {
  components: {
    labelTable,
  },
  data: () => {
    return {
      labelTable,
    }
  },
  methods: {},
  template: SETTINGS_TEMPLATE,
}
