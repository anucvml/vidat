const NOTFOUND_TEMPLATE = `
<div>
  <router-link to="/annotation">
    <q-img src="img/404.svg" style="max-width: 40%" alt="404" class="absolute-center">
    </q-img>
  </router-link>
</div>
`

export default {
  data: () => {
    return {}
  },
  methods: {},
  template: NOTFOUND_TEMPLATE,
}
