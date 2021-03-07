const DRAWER_TEMPLATE = `
<q-drawer
  id="drawer"
  v-model="drawer"
  :width="300"
  :breakpoint="500"
  bordered
  content-class="bg-grey-3"
>
  <q-scroll-area class="fit">
    <q-list class="full-height">
      <q-item dense class="q-mt-md text-h6">Video</q-item>
      <q-item dense v-if="video.src">
        <q-item-section>Duration</q-item-section>
        <q-item-section>{{ video.duration }}s @ {{ video.fps }}fps</q-item-section>
      </q-item>
      <q-item dense v-if="video.src">
        <q-item-section>Size</q-item-section>
        <q-item-section>{{ video.width }} &times; {{ video.height }}px &times; {{ video.frames }}</q-item-section>
      </q-item>
      <q-item dense>
        <q-item-section>
          <q-btn-group spread dense flat style="height: 36px">
            <q-btn
              icon="movie"
              @click="handleOpen"
              label="open"
            ></q-btn>
            <q-btn
              icon="close"
              @click="handleClose"
              v-if="video.src"
              label="close"
            ></q-btn>
          </q-btn-group>
        </q-item-section>
      </q-item>
      <q-separator v-if="video.src"></q-separator>
      <q-item dense class="text-h6" v-if="video.src">Annotations</q-item>
      <q-item dense v-if="video.src">
        <q-item-section>
          <q-btn-group spread dense flat style="height: 36px">
            <q-btn
              icon="file_upload"
              @click="handleLoad"
              label="load"
            ></q-btn>
            <q-btn
              icon="file_download"
              @click="handleSave"
              label="save"
            ></q-btn>
          </q-btn-group>
        </q-item-section>
      </q-item>
      <q-item dense v-if="video.src && submitURL">
        <q-item-section>
          <q-btn-group spread dense flat style="height: 36px">
            <q-btn
              icon="cloud_upload"
              label="submit"
              :loading="submitLoading"
              @click="handleSubmit"
            ></q-btn>
          </q-btn-group>
        </q-item-section>
      </q-item>
      <q-separator></q-separator>
      <q-item
        clickable
        v-ripple
        v-for="(item, index) in menuList"
        :key="index"
        :to="item.path"
        :active="item.label.toLowerCase() === $route.name.toLowerCase()"
        @click="drawer = false"
      >
        <q-item-section avatar>
          <q-icon :name="item.icon"></q-icon>
        </q-item-section>
        <q-item-section>{{ item.label }}</q-item-section>
      </q-item>
      <q-item class="fixed-bottom">
        <q-item-section class="text-center">
          <a href='https://github.com/anucvml/vidat/releases' target="_blank">{{ version }}</a>
        </q-item-section>
      </q-item>
    </q-list>
  </q-scroll-area>
</q-drawer>
`

import utils from '../libs/utils.js'

export default {
  data: () => {
    return {
      version: VERSION,
      menuList: [
        {
          icon: 'video_label',
          label: 'Annotation',
          path: '/annotation',
        },
        {
          icon: 'settings',
          label: 'Configuration',
          path: '/configuration',
        },
        {
          icon: 'dashboard',
          label: 'Preference',
          path: '/preference',
        },
        {
          icon: 'help',
          label: 'Help',
          path: '/help',
        },
        {
          icon: 'book',
          label: 'About',
          path: '/about',
        },
      ],
      submitLoading: false,
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setVideoSrc',
      'setVideoFPS',
      'closeVideo',
      'importAnnotation',
      'importConfig',
      'setIsSaved',
    ]),
    handleOpenWithFPS () {
      this.setVideoFPS(this.$store.state.settings.preferenceData.defaultFps)
      utils.importVideo().then(videoSrc => {
        this.setVideoSrc(videoSrc)
        this.drawer = false
      })
    },
    handleOpen () {
      if (this.video.src) {
        utils.confirm('Are you sure to open a new video? You will LOSE all data!').onOk(() => {
          this.closeVideo()
          this.handleOpenWithFPS()
        })
      }
      else {
        this.handleOpenWithFPS()
      }
    },
    handleClose () {
      utils.confirm('Are you sure to close? You will LOSE all data!').onOk(() => {
        this.closeVideo()
        this.drawer = false
      })
    },
    handleLoad () {
      utils.confirm(
        'Are you sure to load? This would override current data!',
      ).onOk(() => {
        utils.importFile().then(file => {
          try {
            const {
              version,
              annotation,
              config,
            } = JSON.parse(file)
            // version
            if (version !== VERSION) {
              utils.notify('Version mismatched, weird things are likely to happen! ' + version + '!=' + VERSION)
            }
            // annotation
            this.importAnnotation(annotation)
            // config
            this.importConfig(config)
            utils.notify('Load successfully!')
            this.drawer = false
          } catch (e) {
            utils.notify(e.toString())
            throw e
          }
        })
      })
    },
    handleSave () {
      utils.prompt(
        'Save',
        'Enter annotation filename for saving',
        'annotations').onOk(filename => {
        const data = {
          version: VERSION,
          annotation: this.$store.getters.exportAnnotation,
          config: this.$store.getters.exportConfig,
        }
        Quasar.utils.exportFile(
          filename + '.json',
          new Blob([JSON.stringify(data)]),
          { type: 'text/plain' },
        )
        this.setIsSaved(true)
        this.drawer = false
      })
    },
    handleSubmit () {
      this.submitLoading = true
      const data = {
        version: VERSION,
        annotation: this.$store.getters.exportAnnotation,
        config: this.$store.getters.exportConfig,
      }
      console.log('Submitting to: ' + this.submitURL)
      fetch(this.submitURL, {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).then(res => {
        this.submitLoading = false
        console.log('Success', res)
        res.text().then(text => {
          utils.notify('Success: ' + text)
        })
        this.setIsSaved(true)
      }).catch(err => {
        this.submitLoading = false
        console.log('Failed', err)
        utils.notify('Failed: ' + err, 'negative')
      })
    },
  },
  computed: {
    drawer: {
      get () {
        return this.$store.state.drawer
      },
      set (value) {
        this.$store.commit('setDrawer', value)
      },
    },
    submitURL () {
      return this.$store.state.submitURL
    },
    video () {
      return this.$store.state.annotation.video
    },
    preferenceData () {
      return this.$store.state.settings.preferenceData
    },
  },
  template: DRAWER_TEMPLATE,
}
