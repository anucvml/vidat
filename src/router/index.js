import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'annotation',
      path: '/',
      component: () => import('../pages/annotation/Annotation.vue')
    },
    {
      name: 'configuration',
      path: '/configuration',
      component: () => import('../pages/configuration/Configuration.vue')
    },
    {
      name: 'preference',
      path: '/preference',
      component: () => import('../pages/preference/Preference.vue')
    },
    {
      name: 'help',
      path: '/help',
      component: () => import('../pages/help/Help.vue')
    },
    {
      name: 'about',
      path: '/about',
      component: () => import('../pages/about/About.vue')
    },
    {
      name: 'notfound',
      path: '/:pathMatch(.*)*',
      component: () => import('../pages/notfound/NotFound.vue')
    }
  ]
})

router.beforeEach((to, from) => {
  if (to.path === from.path || Object.keys(to.query).length || !Object.keys(from.query).length) return true
  return { ...to, query: from.query }
})

export default router
