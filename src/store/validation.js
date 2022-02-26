/**
 * Validation function to verify uploaded json files
 */

function validateObjectLabelData (json) {
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
    }
    else {
      idList.push(object.id)
    }
    if (typeof (object.name) !== 'string') {
      throw 'Name must be string'
    }
    if (typeof (object.name) !== 'string') {
      throw 'Color must be string'
    }
  }
}

function validateActionLabelData (json) {
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
    }
    else {
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
    const objectIdList = []
    for (const objectId of action.objects) {
      if (typeof (objectId) !== 'number') {
        throw 'Object id must be integer'
      }
      if (objectIdList.indexOf(objectId) !== -1) {
        throw 'Duplicated object id'
      }
      else {
        objectIdList.push(objectId)
      }
      if (objectIdList.indexOf(objectId) === -1) {
        throw `Object id ${objectId} dose not exist`
      }
    }
  }
}

function validateSkeletonTypeData (json) {
  const idList = []
  for (const type of json) {
    if (typeof (type.id) !== 'number') {
      throw 'Id must be integer'
    }
    if (idList.indexOf(type.id) !== -1) {
      throw 'Duplicated id'
    }
    else {
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
      }
      else {
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
      }
      else {
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
}

export {
  validateObjectLabelData,
  validateActionLabelData,
  validateSkeletonTypeData,
}
