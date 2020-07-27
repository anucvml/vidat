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
        <q-btn @click="handleCopyLeft" icon="arrow_back"></q-btn>
        <q-btn @click="handleCopyRight" icon="arrow_forward"></q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="handleReplaceLeft" icon="first_page"></q-btn>
        <q-btn @click="handleReplaceRight" icon="last_page"></q-btn>
      </q-btn-group>
    </q-item-section>
  </q-item>
  <q-item>
    <q-item-section>
      <q-btn-group spread>
        <q-btn @click="handleInterpolate" icon="double_arrow">interpolate</q-btn>
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
        {label: 'Object', value: 'object'},
        {label: 'Region', value: 'region'},
        {label: 'Skeleton', value: 'skeleton'}
      ]"
    ></q-option-group>
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
       <q-btn class="full-width" @click="handleSwap" icon="swap_horiz">swap</q-btn>
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
      'setLockSlidersDistance',
      'setLeftCurrentFrame',
      'setRightCurrentFrame',
    ]),
    handleCopyLeft () {},
    handleCopyRight () {},
    handleReplaceLeft () {},
    handleReplaceRight () {},
    handleInterpolate () {},
    handleSwap () {
      const leftCurrentFrame = this.leftCurrentFrame
      this.leftCurrentFrame = this.rightCurrentFrame
      this.rightCurrentFrame = leftCurrentFrame
    },
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
        this.setLockSlidersDistance(this.rightCurrentFrame - this.leftCurrentFrame)
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
    leftCurrentFrame: {
      get () {
        return this.$store.state.annotation.leftCurrentFrame
      },
      set (value) {
        this.setLeftCurrentFrame(value)
      },
    },
    rightCurrentFrame: {
      get () {
        return this.$store.state.annotation.rightCurrentFrame
      },
      set (value) {
        this.setRightCurrentFrame(value)
      },
    },
  },
  template: CONTROL_PANEL_TEMPLATE,
}
