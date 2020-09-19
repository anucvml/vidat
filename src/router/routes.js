const routes = [
  {
    path: '/',
    component: () => import(/* webpackChunkName: 'Main' */ 'layouts/MainLayout.vue'),
    redirect: 'annotation',
    children: [
      {
        name: 'index',
        path: 'annotation',
        component: () => import(/* webpackChunkName: 'Main' */ 'pages/annotation/Annotation.vue'),
      },
      {
        name: 'configuration',
        path: 'configuration',
        component: () => import(/* webpackChunkName: 'Others' */ 'pages/configuration/Configuration.vue'),
      },
      {
        name: 'preference',
        path: 'preference',
        component: () => import(/* webpackChunkName: 'Others' */ 'pages/preference/Preference.vue'),
      },
      {
        name: 'help',
        path: 'help',
        component: () => import(/* webpackChunkName: 'Others' */ 'pages/help/Help.vue'),
      },
      {
        name: 'about',
        path: 'about',
        component: () => import(/* webpackChunkName: 'Others' */ 'pages/about/About.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import(/* webpackChunkName: 'Others' */ 'pages/notfound/NotFound.vue'),
  },
]

export default routes
