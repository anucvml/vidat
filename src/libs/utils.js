/**
 * Utils
 */

import store from '../store/index'
import { Dialog, Notify } from 'quasar'

export default {
  /**
   * Confirm popup
   * @param message
   * @returns {Promise}
   */
  confirm (message) {
    return Dialog.create({
      title: 'Confirm',
      message: message,
      cancel: true,
      persistent: true,
    })
  },
  /**
   * Notify popup
   * @param message
   * @returns {Promise}
   */
  notify (message) {
    return Notify.create({
      message: message,
      color: 'primary',
      position: 'bottom-right',
    })
  },
  /**
   * Prompt popup
   * @param title
   * @param message
   * @param defaultValue of input
   * @param type of input
   * @returns {Promise}
   */
  prompt (title, message, defaultValue, type = 'text') {
    return Dialog.create({
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
  /**
   * Read text file
   * @param pathname
   * @returns {Promise}
   */
  readFile: (pathname) => {
    return new Promise(function (resolve, reject) {
      fetch(pathname).then(res => {
        return res.text()
      }).then(text => {
        resolve(text)
      }).catch(err => {
        reject(err)
      })
    })
  },
  /**
   * Import a json file
   * @returns {Promise}
   */
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
  /**
   * Import a video file
   * @returns {Promise}
   */
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
  /**
   * Convert time to index
   * @param time
   * @returns {number}
   */
  time2index (time) {
    return Math.round(store.state.annotation.video.fps * time)
  },
  /**
   * Convert index to time
   * @param index
   * @returns {number}
   */
  index2time (index) { return parseFloat((index / store.state.annotation.video.fps).toFixed(3)) },
  /**
   * Convert a number to fixed 2 format
   * @param value
   * @returns {string}
   */
  toFixed2 (value) {
    if (value) {
      return value.toFixed(2)
    } else {
      return '0.00'
    }
  },
  /**
   * Generate a random color
   * @returns {string}
   */
  randomColor () {
    return `#${('000000' + (Math.random() * 16777216 | 0).toString(16)).slice(-6)}`
  },
  /**
   * DeepClone
   * @param object
   * @returns {Object}
   */
  deepClone (object) {
    const newObject = new object.constructor()
    if (object === null) return object
    // eslint-disable-next-line no-new-func
    if (typeof object === 'function') return new Function('return ' + object.toString())()
    if (typeof object !== 'object') return object
    if (object instanceof RegExp) return new RegExp(object)
    if (object instanceof Date) return new Date(object)
    for (const i in object) {
      newObject[i] = this.deepClone(object[i])
    }
    return newObject
  },
}
