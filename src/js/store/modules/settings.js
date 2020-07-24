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
  }),
  getters: {},
  mutations: {
    objectLabelData (state, value) {
      state.objectLabelData = value
      localStorage.setItem('objectLabelData', JSON.stringify(value))
    },
  },
  actions: {},
}
