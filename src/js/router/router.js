/**
 * Vue router
 */

import annotation from '../pages/annotation/annotation.js'
import configuration from '../pages/configuration/configuration.js'
import preference from '../pages/preference/preference.js'
import help from '../pages/help/help.js'
import about from '../pages/about/about.js'
import notfound from '../pages/notfound/notfound.js'

export default new VueRouter({
  routes: [
    { name: 'index', path: '/', redirect: '/annotation' },
    { name: 'annotation', path: '/annotation', component: annotation },
    { name: 'configuration', path: '/configuration', component: configuration },
    { name: 'preference', path: '/preference', component: preference },
    { name: 'help', path: '/help', component: help },
    { name: 'about', path: '/about', component: about },
    { name: 'notfound', path: '*', component: notfound },
  ],
})
