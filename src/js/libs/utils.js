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
      dialog.accept = 'text/plain'
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
}
