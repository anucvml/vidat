export default {
  state: () => ({
    objectLabelData: JSON.parse(localStorage.getItem('objectLabelData')) ||
      [
        {
          'id': 0,
          'name': 'default',
          'color': '#00FF00',
        },
        {
          'id': 1,
          'name': 'leg',
          'color': '#FF0000',
        },
        {
          'id': 2,
          'name': 'table top',
          'color': '#0000FF',
        },
        {
          'id': 3,
          'name': 'table',
          'color': '#FF00FF',
        },
        {
          'id': 4,
          'name': 'shelf',
          'color': '#00FF00',
        },
        {
          'id': 5,
          'name': 'side panel',
          'color': '#118822',
        },
        {
          'id': 6,
          'name': 'top panel',
          'color': '#776688',
        },
        {
          'id': 7,
          'name': 'front panel',
          'color': '#6600EE',
        },
        {
          'id': 8,
          'name': 'back panel',
          'color': '#AAAA33',
        },
        {
          'id': 9,
          'name': 'bottom panel',
          'color': '#552277',
        },
        {
          'id': 10,
          'name': 'pin',
          'color': '#CC66FF',
        },
      ],
    actionLabelData: JSON.parse(localStorage.getItem('actionLabelData')) ||
      [
        {
          'id': 0,
          'name': 'default',
          'color': '#0000FF',
          'objects': [0],
        },
        {
          'id': 1,
          'name': 'pick up',
          'color': '#00FFFF',
          'objects': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        },
        {
          'id': 2,
          'name': 'lay down',
          'color': '#FF00FF',
          'objects': [0],
        },
        {
          'id': 3,
          'name': 'push',
          'color': '#85ad85',
          'objects': [0],
        },
        {
          'id': 4,
          'name': 'align leg screw with table thread',
          'color': '#adad91',
          'objects': [0],
        },
        {
          'id': 5,
          'name': 'spin leg',
          'color': '#CC55FF',
          'objects': [0],
        },
        {
          'id': 6,
          'name': 'tighten leg',
          'color': '#AABB22',
          'objects': [0],
        },
        {
          'id': 7,
          'name': 'rotate table',
          'color': '#FF2255',
          'objects': [0],
        },
        {
          'id': 8,
          'name': 'flip',
          'color': '#7755FF',
          'objects': [0],
        },
        {
          'id': 9,
          'name': 'attach shelf to table',
          'color': '#BB55BB',
          'objects': [0],
        },
        {
          'id': 10,
          'name': 'align side panel holes with front panel dowels',
          'color': '#EEBB33',
          'objects': [0],
        },
        {
          'id': 11,
          'name': 'attach drawer side panel',
          'color': '#DD5566',
          'objects': [0],
        },
        {
          'id': 12,
          'name': 'attach drawer back panel',
          'color': '#551144',
          'objects': [0],
        },
        {
          'id': 13,
          'name': 'slide bottom of drawer',
          'color': '#2299EE',
          'objects': [0],
        },
        {
          'id': 14,
          'name': 'insert drawer pin',
          'color': '#252545',
          'objects': [0],
        },
        {
          'id': 15,
          'name': 'position the drawer right side up',
          'color': '#99AA66',
          'objects': [0],
        },
        {
          'id': 16,
          'name': 'other',
          'color': '#77CCCC',
          'objects': [0],
        },
      ],
    preferenceData: JSON.parse(localStorage.getItem('preferenceData')) ||
      {
        objects: true,
        regions: true,
        skeletons: true,
        actions: true,
      },
  }),
  getters: {},
  mutations: {
    setObjectLabelData (state, value) {
      state.objectLabelData = value
      localStorage.setItem('objectLabelData', JSON.stringify(value))
    },
    setActionLabelData (state, value) {
      state.actionLabelData = value
      localStorage.setItem('actionLabelData', JSON.stringify(value))
    },
    setPreferenceData (state, value) {
      state.preferenceData = value
      localStorage.setItem('preferenceData', JSON.stringify(value))
    },
    setShowObjects (state, value) {
      Vue.set(state.preferenceData, 'objects', value)
    },
    setShowRegions (state, value) {
      Vue.set(state.preferenceData, 'regions', value)
    },
    setShowSkeletons (state, value) {
      Vue.set(state.preferenceData, 'skeletons', value)
    },
    setShowActions (state, value) {
      Vue.set(state.preferenceData, 'actions', value)
    },
  },
  actions: {},
}
