import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      name: 'index',
      path: '/',
      redirect: '/annotation'
    },
    {
      name: 'annotation',
      path: '/annotation',
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
