export default {
  state: () => ({
    objectLabelData: JSON.parse(localStorage.getItem('objectLabelData')) ||
      [
        {
          id: 0,
          name: '<none>',
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
          name: '<none>',
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
  },
  actions: {},
}
