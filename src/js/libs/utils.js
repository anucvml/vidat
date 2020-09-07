import store from '../store/store.js'

export default {
  confirm (message) {
    return Quasar.Dialog.create({
      title: 'Confirm',
      message: message,
      cancel: true,
      persistent: true,
    })
  },
  notify (message) {
    return Quasar.Notify.create({
      message: message,
      color: 'primary',
      position: 'bottom-right',
    })
  },
  prompt (title, message, defaultValue, type = 'text') {
    return Quasar.Dialog.create({
      title: title,
      message: message,
      prompt: {
        model: defaultValue,
        type: type,
      },
      cancel: true,
      persistent: true,
    })
  },
  importFile: () => {
    return new Promise(function (resolve, reject) {
      const dialog = document.createElement('input')
      dialog.type = 'file'
      dialog.accept = 'application/json'
      dialog.onchange = e => {
        const file = e.target.files[0]
        const reader = new FileReader()
        reader.onload = readerEvent => {
          resolve(readerEvent.target.result)
        }
        reader.readAsText(file, 'UTF-8')
      }
      dialog.click()
    })
  },
  importVideo: () => {
    return new Promise(function (resolve, reject) {
      const dialog = document.createElement('input')
      dialog.type = 'file'
      dialog.accept = 'video/*'
      dialog.onchange = e => {
        const file = e.target.files[0]
        resolve(URL.createObjectURL(file))
      }
      dialog.click()
    })
  },
  time2index (time) {
    return Math.round(store.state.annotation.video.fps * time)
  },
  index2time (index) { return parseFloat((index / store.state.annotation.video.fps).toFixed(3)) },
  toFixed2 (value) {
    if (value) {
      return value.toFixed(2)
    } else {
      return '0.00'
    }
  },
  randomColor () {
    return `#${('000000' + (Math.random() * 16777216 | 0).toString(16)).slice(-6)}`
  },
  deepClone (object) {
    let newObject = new object.constructor
    if (object === null) return object
    if (typeof object == 'function') return new Function('return ' + object.toString())()
    if (typeof object != 'object') return object
    if (object instanceof RegExp) return new RegExp(object)
    if (object instanceof Date) return new Date(object)
    for (let i in object) {
      newObject[i] = this.deepClone(object[i])
    }
    return newObject
  },
}
