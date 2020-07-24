const CONTRIBUTOR_CARD_TEMPLATE = `
<a :href="contributor.url">
  <q-card>
    <q-card-section>
      <q-avatar size="100px">
        <img :src="contributor.avatar" alt="avatar">
      </q-avatar>
    </q-card-section>
    <q-card-section class="text-center">
      {{contributor.name}}
    </q-card-section>
  </q-card>
</a>
`

export default {
  props: ['contributor'],
  template: CONTRIBUTOR_CARD_TEMPLATE,
}
