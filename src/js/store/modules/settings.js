export default {
  state: () => ({
    objectLabelData: JSON.parse(localStorage.getItem('objectLabelData')) ||
      [
        {
          id: 0,
          name: 'default',
          color: '#00ff00',
        },
        {
          id: 1,
          name: 'person',
          color: '#ff0000',
        },
        {
          id: 2,
          name: 'car',
          color: '#0000ff',
        },
        {
          id: 3,
          name: 'bicycle',
          color: '#ff00ff',
        },
      ],
    actionLabelData: JSON.parse(localStorage.getItem('actionLabelData')) ||
      [
        {
          id: 0,
          name: 'default',
          color: '#00ff00',
        },
        {
          id: 1,
          name: 'walk',
          color: '#ff0000',
        },
        {
          id: 2,
          name: 'run',
          color: '#0000ff',
        },
        {
          id: 3,
          name: 'swim',
          color: '#ff00ff',
        },
        {
          id: 4,
          name: 'fly',
          color: '#00ffff',
        },
      ],
    preferenceData: JSON.parse(localStorage.getItem('preferenceData')) ||
      {
        keyframes: true,
        objects: true,
        regions: true,
        videoSegments: true,
      },
  }),
  getters: {},
  mutations: {
    objectLabelData (state, value) {
      state.objectLabelData = value
      localStorage.setItem('objectLabelData', JSON.stringify(value))
    },
    actionLabelData (state, value) {
      state.actionLabelData = value
      localStorage.setItem('actionLabelData', JSON.stringify(value))
    },
    preferenceData (state, value) {
      state.preferenceData = value
      localStorage.setItem('preferenceData', JSON.stringify(value))
    },
  },
  actions: {},
}
