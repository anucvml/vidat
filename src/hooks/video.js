import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { useMainStore } from '~/store/index.js'

export const useVideo = () => {
  const annotationStore = useAnnotationStore()
  const mainStore = useMainStore()
  return {
    handleOpen: () => {
      if (annotationStore.hasVideo) {
        utils.confirm('Are you sure to open a new video? You will LOSE all data!').onOk(() => {
          annotationStore.reset()
          utils.importVideo().then(videoSrc => {
            annotationStore.video.src = videoSrc
            mainStore.drawer = false
          })
        })
      } else {
        utils.importVideo().then(videoSrc => {
          annotationStore.video.src = videoSrc
          mainStore.drawer = false
        })
      }
    },
    handleClose: () => {
      utils.confirm('Are you sure to close? You will LOSE all data!').onOk(() => {
        annotationStore.reset()
        mainStore.drawer = false
      })
    }
  }
}
