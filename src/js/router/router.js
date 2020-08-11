import annotation from '../pages/annotation/annotation.js'
import settings from '../pages/settings/settings.js'
import help from '../pages/help/help.js'
import about from '../pages/about/about.js'
import notfound from '../pages/notfound/notfound.js'

export default new VueRouter({
  routes: [
    { name: 'index', path: '/', redirect: '/annotation' },
    { name: 'annotation', path: '/annotation', component: annotation },
    { name: 'settings', path: '/settings', component: settings },
    { name: 'help', path: '/help', component: help },
    { name: 'about', path: '/about', component: about },
    { name: 'notfound', path: '*', component: notfound },
  ],
})
