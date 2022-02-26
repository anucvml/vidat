import '@quasar/extras/material-icons/material-icons.css'
import { Dialog, Notify, Quasar } from 'quasar'
import quasarIconSet from 'quasar/icon-set/svg-material-icons'
import 'quasar/src/css/index.sass'
import { createApp } from 'vue'

import App from './App.vue'
import './assets/css/app.css'
import router from './router/index.js'
import store from './store/index.js'

const app = createApp(App)
app.use(store)
app.use(router)
app.use(Quasar, {
  plugins: {
    Dialog, Notify
  },
  iconSet: quasarIconSet,
  config: {
    brand: {
      primary: '#bf872b',
      secondary: '#f5edde'
    },
    notify: {},
    loading: {},
    loadingBar: {}
  }
})

app.mount('#app')
