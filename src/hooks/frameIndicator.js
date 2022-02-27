import { useQuasar } from 'quasar'
import { computed } from 'vue'
import utils from '~/libs/utils.js'
import { useAnnotationStore } from '~/store/annotation.js'
import { usePreferenceStore } from '~/store/preference.js'

export const frameIndicator = () => {
  const ALWAYS_SHOW = true // TODO: load from preferenceStore

  const HEIGHT_UNIT = 16
  const HEIGHT_MARKER = 8

  const COLOR_BACKGROUND = 'linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2))'
  const COLOR_BACKGROUND_DARK = 'linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2))'
  const COLOR_KEYFRAME = 'linear-gradient(#000, #000)'
  const COLOR_OBJECT = 'linear-gradient(var(--q-primary), var(--q-primary))'
  const COLOR_REGION = 'linear-gradient(var(--q-info), var(--q-info))'
  const COLOR_SKELETON = 'linear-gradient(var(--q-positive), var(--q-positive))'
  const COLOR_ACTION = 'linear-gradient(var(--q-accent), var(--q-accent))'

  const annotationStore = useAnnotationStore()
  const preferenceStore = usePreferenceStore()
  const q = useQuasar()

  let bgImageList = []
  let bgPositionList = []
  let bgSizeList = []

  const getBackgroundStyleList = (positionHeightOffset = 0) => {
    bgImageList.push(q.dark.isActive ? COLOR_BACKGROUND_DARK : COLOR_BACKGROUND)
    bgPositionList.push(
      `0% ${12 + positionHeightOffset}px`)
    bgSizeList.push(`100% ${HEIGHT_MARKER}px`)
  }

  const getStyleList = (frameList, color, positionHeightOffset = 0) => {
    const markerWidthUnit = 100 / (annotationStore.video.frames - 1)
    for (let [frame, width] of frameList) {
      const markerWidth = width * markerWidthUnit
      bgImageList.push(color)
      bgPositionList.push(
        `${10000 * frame / (annotationStore.video.frames - 1) / (100 - markerWidth) - 0.5 * markerWidthUnit}% ${12 +
        positionHeightOffset}px`)
      bgSizeList.push(`${markerWidth}% ${HEIGHT_MARKER}px`)
    }
  }

  const rangeStyle = computed(() => {
    bgImageList = []
    bgPositionList = []
    bgSizeList = []

    let positionHeightOffset = 0

    getStyleList(
      annotationStore.keyframeList.map(keyframe => [keyframe, 1]),
      COLOR_KEYFRAME,
      positionHeightOffset
    )

    if (preferenceStore.objects) {
      const frameList = Object.entries(annotationStore.objectAnnotationListMap).
        filter(([, annotationList]) => annotationList.length).
        map(([frame]) => [parseInt(frame), 1])
      if (ALWAYS_SHOW || frameList.length) {
        positionHeightOffset += HEIGHT_UNIT
        getBackgroundStyleList(positionHeightOffset)
        getStyleList(
          frameList,
          COLOR_OBJECT,
          positionHeightOffset
        )
      }
    }

    if (preferenceStore.regions) {
      const frameList = Object.entries(annotationStore.regionAnnotationListMap).
        filter(([, annotationList]) => annotationList.length).
        map(([frame]) => [parseInt(frame), 1])
      if (ALWAYS_SHOW ||frameList.length) {
        positionHeightOffset += HEIGHT_UNIT
        getBackgroundStyleList(positionHeightOffset)
        getStyleList(
          frameList,
          COLOR_REGION,
          positionHeightOffset
        )
      }
    }

    if (preferenceStore.skeletons) {
      const frameList = Object.entries(annotationStore.skeletonAnnotationListMap).
        filter(([, annotationList]) => annotationList.length).
        map(([frame]) => [parseInt(frame), 1])
      if (ALWAYS_SHOW ||frameList.length) {
        positionHeightOffset += HEIGHT_UNIT
        getBackgroundStyleList(positionHeightOffset)
        getStyleList(
          frameList,
          COLOR_SKELETON,
          positionHeightOffset
        )
      }
    }

    if (preferenceStore.actions) {
      const frameList = annotationStore.actionAnnotationList.map(
        action => {
          const startFrame = utils.time2index(action.start)
          const endFrame = utils.time2index(action.end)
          return [startFrame, (endFrame - startFrame + 1)]
        })
      if (ALWAYS_SHOW || frameList.length) {
        positionHeightOffset += HEIGHT_UNIT
        getBackgroundStyleList(positionHeightOffset)
        getStyleList(
          frameList,
          COLOR_ACTION,
          positionHeightOffset
        )
      }
    }

    return {
      '--marker-height': `${32 + positionHeightOffset}px`,
      '--marker-bg-image': bgImageList.join(','),
      '--marker-bg-position': bgPositionList.join(','),
      '--marker-bg-size': bgSizeList.join(',')
    }
  })
  return {
    rangeStyle
  }
}
