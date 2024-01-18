import { createRouter, createWebHashHistory } from 'vue-router'

import Annotation from '~/pages/annotation/Annotation.vue'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      name: 'annotation',
      path: '/',
      component: Annotation
    },
    {
      name: 'configuration',
      path: '/configuration',
      component: () => import('~/pages/configuration/Configuration.vue')
    },
    {
      name: 'preference',
      path: '/preference',
      component: () => import('~/pages/preference/Preference.vue')
    },
    {
      name: 'help',
      path: '/help',
      component: () => import('~/pages/help/Help.vue')
    },
    {
      name: 'about',
      path: '/about',
      component: () => import('~/pages/about/About.vue')
    },
    {
      name: 'notfound',
      path: '/:pathMatch(.*)*',
      component: () => import('~/pages/notfound/NotFound.vue')
    }
  ]
})

router.beforeEach((to, from) => {
  useAnnotationStore().currentSortedActionList = []
  useAnnotationStore().currentThumbnailAction = null
  useConfigurationStore().currentThumbnailActionLabelId = null
  if (to.path === from.path || Object.keys(to.query).length || !Object.keys(from.query).length) return true
  return { ...to, query: from.query }
})

export default router
