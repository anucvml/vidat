const DRAWER_TEMPLATE = `
<q-drawer
  v-model="drawer"
  :width="300"
  :breakpoint="500"
  bordered
  content-class="bg-grey-3"
>
  <q-scroll-area class="fit">
    <q-list class="full-height">
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
    }
  },
  methods: {},
  computed: {
    drawer: {
      get () {
        return this.$store.state.drawer
      },
      set (value) {
        this.$store.commit('setDrawer', value)
      },
    },
  },
  template: DRAWER_TEMPLATE,
}
