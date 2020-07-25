const CONTROL_PANEL_TEMPLATE = `
<q-list>
  <q-item>
    <q-item-section class="text-center">
      Copy
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="copyLeft" icon="arrow_back"></q-btn>
        <q-btn @click="copyRight" icon="arrow_forward"></q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="replaceLeft" icon="first_page"></q-btn>
        <q-btn @click="replaceRight" icon="last_page"></q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="interpolate" icon="double_arrow">interpolate</q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section class="text-center">Mode</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-option-group
      type="radio"
      v-model="mode"
      :options="[
        {label: 'Objects', value: 'objects'},
        {label: 'Regions', value: 'regions'},
        {label: 'Skeletons', value: 'skeletons'}
      ]"
    ></q-btn-toggle>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section class="text-center">Options</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-toggle v-model="lockSliders" label="Lock sliders"></q-toggle>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-toggle v-model="grayscale" label="Grayscale"></q-toggle>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section class="text-center">Frames</q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="swap" icon="swap_horiz">swap</q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
</q-list>
`

export default {
  data: () => {
    return {}
  },
  methods: {
    ...Vuex.mapMutations([
      'setMode',
      'setLockSliders',
      'setGrayscale',
    ]),
    copyLeft () {},
    copyRight () {},
    replaceLeft () {},
    replaceRight () {},
    interpolate () {},
    swap () {},
  },
  computed: {
    mode: {
      get () {
        return this.$store.state.annotation.mode
      },
      set (value) {
        this.setMode(value)
      },
    },
    lockSliders: {
      get () {
        return this.$store.state.annotation.lockSliders
      },
      set (value) {
        this.setLockSliders(value)
      },
    },
    grayscale: {
      get () {
        return this.$store.state.annotation.grayscale
      },
      set (value) {
        this.setGrayscale(value)
      },
    },
  },
  template: CONTROL_PANEL_TEMPLATE,
}
