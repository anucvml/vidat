import { copyToClipboard, exportFile } from 'quasar'
import { ref } from 'vue'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { useMainStore } from '~/store/index.js'

export const useAnnotation = () => {
  const configurationStore = useConfigurationStore()
  const annotationStore = useAnnotationStore()
  const mainStore = useMainStore()
  const submitLoading = ref(false)
  const loadAnnotation = (obj) => {
    try {
      const {
        version,
        annotation,
        config
      } = obj
      // version
      if (version !== PACKAGE_VERSION) {
        utils.notify('Version mismatch, weird stuff is likely to happen! ' + version + ' != ' + PACKAGE_VERSION,
          'warning')
      }
      // config
      configurationStore.importConfig(config)
      // annotation
      annotationStore.importAnnotation(annotation)
      utils.notify('Annotation load successfully!', 'positive')
    } catch (e) {
      utils.notify(e.toString(), 'negative')
      throw e
    }
  }
  const loadAnnotationFromFile = () => {
    utils.importFile().then(file => {
      loadAnnotation(JSON.parse(file))
    })
  }
  return {
    loadAnnotation,
    handleLoad: () => {
      if (annotationStore.hasVideo) {
        utils.confirm(
          'Are you sure to load? This would override current data!'
        ).onOk(() => {
          loadAnnotationFromFile()
        })
      } else {
        loadAnnotationFromFile()
      }
    },
    handleSave: () => {
      utils.prompt(
        'Save',
        'Enter annotation filename for saving',
        'annotations').onOk(filename => {
        const data = {
          version: PACKAGE_VERSION,
          annotation: annotationStore.exportAnnotation(),
          config: configurationStore.exportConfig()
        }
        exportFile(
          filename + '.json',
          new Blob([JSON.stringify(data)]),
          { mimeType: 'text/plain' }
        )
        mainStore.drawer = false
      })
    },
    handleSubmit: () => {
      submitLoading.value = true
      const data = {
        version: PACKAGE_VERSION,
        annotation: annotationStore.exportAnnotation(),
        config: configurationStore.exportConfig()
      }
      console.log('Submitting to: ' + mainStore.submitURL)
      fetch(mainStore.submitURL, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).then(res => {
        submitLoading.value = false
        if (res.ok) {
          console.log('Success', res)
          res.json().then(data => {
            const { message, clipboard, type } = data
            if (message) {
              utils.notify('Server: ' + message, type || 'positive')
            }
            if (clipboard) {
              copyToClipboard(clipboard).then(() => {
                utils.notify('Copied to clipboard: ' + clipboard, 'positive')
              }).catch((err) => {
                  console.error('Failed to copy to clipboard', err)
                  utils.notify('Failed to copy to clipboard, please do it manually: ' + clipboard, 'negative', 10000)
                }
              )
            }
          })
        } else {
          console.error('Failed', res)
          utils.notify(`Failed to submit: ${res.statusText} (${res.status})`, 'warning')
        }
      }).catch(err => {
        submitLoading.value = false
        console.error('Failed', err)
        utils.notify('Failed to submit: ' + err, 'negative')
      })
    },
    submitLoading
  }
}
