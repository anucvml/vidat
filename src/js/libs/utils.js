export default {
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
}
