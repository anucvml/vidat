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
    skeletonTypeData: JSON.parse(localStorage.getItem('skeletonTypeData')) ||
      [
        {
          id: 0,
          name: 'human',
          description: 'open pose',
          color: '#00FF00',
          pointList: [
            {
              id: 0,
              name: 'nose',
              x: 0,
              y: -30,
            },
            {
              id: 1,
              name: 'left eye',
              x: -3,
              y: -35,
            },
            {
              id: 2,
              name: 'right eye',
              x: 3,
              y: -35,
            },
            {
              id: 3,
              name: 'left ear',
              x: -7,
              y: -32,
            },
            {
              id: 4,
              name: 'right ear',
              x: 7,
              y: -32,
            },
            {
              id: 5,
              name: 'left shoulder',
              x: -13,
              y: -20,
            },
            {
              id: 6,
              name: 'right shoulder',
              x: 13,
              y: -20,
            },
            {
              id: 7,
              name: 'left wrist',
              x: -15,
              y: 10,
            },
            {
              id: 8,
              name: 'right wrist',
              x: 15,
              y: 10,
            },
            {
              id: 9,
              name: 'left hip',
              x: -8,
              y: 10,
            },
            {
              id: 10,
              name: 'right hip',
              x: 8,
              y: 10,
            },
            {
              id: 11,
              name: 'left knee',
              x: -9,
              y: 30,
            },
            {
              id: 12,
              name: 'right knee',
              x: 9,
              y: 30,
            },
            {
              id: 13,
              name: 'left ankle',
              x: -10,
              y: 45,
            },
            {
              id: 14,
              name: 'right ankle',
              x: 10,
              y: 45,
            },
          ],
          edgeList: [
            {
              id: 0,
              from: 0,
              to: 1,
            },
            {
              id: 1,
              from: 0,
              to: 2,
            },
            {
              id: 2,
              from: 0,
              to: 3,
            },
            {
              id: 3,
              from: 0,
              to: 4,
            },
            {
              id: 4,
              from: 0,
              to: 9,
            },
            {
              id: 5,
              from: 0,
              to: 10,
            },
            {
              id: 6,
              from: 5,
              to: 7,
            },
            {
              id: 7,
              from: 5,
              to: 6,
            },
            {
              id: 8,
              from: 6,
              to: 8,
            },
            {
              id: 9,
              from: 9,
              to: 11,
            },
            {
              id: 10,
              from: 11,
              to: 13,
            },
            {
              id: 11,
              from: 10,
              to: 12,
            },
            {
              id: 12,
              from: 12,
              to: 14,
            },
          ],
        },
      ],
    preferenceData: JSON.parse(localStorage.getItem('preferenceData')) ||
      {
        defaultFps: 10,
        objects: true,
        regions: true,
        skeletons: true,
        actions: true,
      },
    lockSliders: JSON.parse(localStorage.getItem('lockSliders')) || false,
    lockSlidersDistance: JSON.parse(localStorage.getItem('lockSlidersDistance')) || 0,
    grayscale: JSON.parse(localStorage.getItem('grayscale')) || false,
    showPopup: JSON.parse(localStorage.getItem('showPopup')) || false,
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
    setSkeletonTypeData (state, value) {
      state.skeletonTypeData = value
      localStorage.setItem('skeletonTypeData', JSON.stringify(value))
    },
    setPreferenceData (state, value) {
      state.preferenceData = value
      localStorage.setItem('preferenceData', JSON.stringify(value))
    },
    setDefaultFps (state, value) {
      Vue.set(state.preferenceData, 'defaultFps', value)
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
    setLockSliders (state, value) {
      Vue.set(state, 'lockSliders', value)
      localStorage.setItem('lockSliders', JSON.stringify(value))
    },
    setLockSlidersDistance (state, value) {
      Vue.set(state, 'lockSlidersDistance', value)
      localStorage.setItem('lockSlidersDistance', JSON.stringify(value))
    },
    setGrayscale (state, value) {
      Vue.set(state, 'grayscale', value)
      localStorage.setItem('grayscale', JSON.stringify(value))
    },
    setShowPopup (state, value) {
      Vue.set(state, 'showPopup', value)
      localStorage.setItem('showPopup', JSON.stringify(value))
    },
    importObjectLabelData (state, json) {
      // validate
      if (!json.length) {
        throw 'At least one object!'
      }
      if (json[0].name !== 'default') {
        throw 'The first object must be default'
      }
      const idList = []
      for (const object of json) {
        if (typeof (object.id) !== 'number') {
          throw 'Id must be integer'
        }
        if (idList.indexOf(object.id) !== -1) {
          throw 'Duplicated id'
        } else {
          idList.push(object.id)
        }
        if (typeof (object.name) !== 'string') {
          throw 'Name must be string'
        }
        if (typeof (object.name) !== 'string') {
          throw 'Color must be string'
        }
      }
      // save
      Vue.set(state, 'objectLabelData', json)
    },
    importActionLabelData (state, json) {
      // validate
      const objectIdList = state.objectLabelData.map(object => object.id)
      if (!json.length) {
        throw 'At least one action!'
      }
      if (json[0].name !== 'default') {
        throw 'The first action must be default'
      }
      const idList = []
      for (const action of json) {
        if (typeof (action.id) !== 'number') {
          throw 'Id must be integer'
        }
        if (idList.indexOf(action.id) !== -1) {
          throw 'Duplicated id'
        } else {
          idList.push(action.id)
        }
        if (typeof (action.name) !== 'string') {
          throw 'Name must be string'
        }
        if (typeof (action.name) !== 'string') {
          throw 'Color must be string'
        }
        if (!action.objects.length) {
          throw 'At least one action!'
        }
        if (action.objects[0] !== 0) {
          throw 'The first action must be default'
        }
        const objectIdList = []
        for (const objectId of action.objects) {
          if (typeof (objectId) !== 'number') {
            throw 'Object id must be integer'
          }
          if (objectIdList.indexOf(objectId) !== -1) {
            throw 'Duplicated object id'
          } else {
            objectIdList.push(objectId)
          }
          if (objectIdList.indexOf(objectId) === -1) {
            throw `Object id ${objectId} dose not exist`
          }
        }
      }
      // save
      Vue.set(state, 'actionLabelData', json)
    },
    importSkeletonTypeData (state, json) {
      // validate
      const idList = []
      for (const type of json) {
        if (typeof (type.id) !== 'number') {
          throw 'Id must be integer'
        }
        if (idList.indexOf(type.id) !== -1) {
          throw 'Duplicated id'
        } else {
          idList.push(type.id)
        }
        if (typeof (type.name) !== 'string') {
          throw 'Name must be string'
        }
        if (typeof (type.description) !== 'string') {
          throw 'Description must be string'
        }
        if (typeof (type.name) !== 'string') {
          throw 'Color must be string'
        }
        // pointList
        const pointIdList = []
        for (const point in json.pointList) {
          if (typeof (point.id) !== 'number') {
            throw 'Point id must be integer'
          }
          if (pointIdList.indexOf(point.id) !== -1) {
            throw 'Duplicated point id'
          } else {
            pointIdList.push(point.id)
          }
          if (typeof (point.name) !== 'string') {
            throw 'Point name must be string'
          }
          if (typeof (point.x) !== 'number') {
            throw 'Point x must be integer'
          }
          if (typeof (point.y) !== 'number') {
            throw 'Point y must be integer'
          }
        }
        // edgeList
        const edgeIdList = []
        for (const edge in json.edgeList) {
          if (typeof (edge.id) !== 'number') {
            throw 'Edge id must be integer'
          }
          if (edgeIdList.indexOf(edge.id) !== -1) {
            throw 'Duplicated edge id'
          } else {
            edgeIdList.push(edge.id)
          }
          if (typeof (edge.to) !== 'number') {
            throw 'Edge to must be integer'
          }
          if (pointIdList.indexOf(edge.to) === -1) {
            throw `Point id ${edge.to} dose not exist`
          }
          if (typeof (edge.from) !== 'number') {
            throw 'Edge from must be integer'
          }
          if (pointIdList.indexOf(edge.from) === -1) {
            throw `Point id ${edge.from} dose not exist`
          }
        }
      }
      // save
      Vue.set(state, 'skeletonTypeData', json)
    },
  },
  actions: {},
}
