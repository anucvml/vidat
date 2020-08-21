const ABOUT_TEMPLATE = `
<div style="max-width: 800px; margin: 0 auto" class="q-gutter-md">
  <div class="text-h5">About</div>
  <div class="text-body1">Developed by the Australian National University Machine Learning and Computer Vision group as a high quality yet simple and efficient to use open-source video annotation tool.</div>
  <div class="text-h5">Contributors</div>
  <div class="row q-gutter-md">
    <contributor-card
      v-for="contributor in contributorList"
      :key="contributor.name"
      :contributor="contributor"
    >
    </contributor-card>
  </div>
  </contributor-card>
</div>
`

import contributorCard from './components/contributorCard.js'

export default {
  components: {
    contributorCard,
  }
  ,
  data: () => {
    return {
      contributorList: [
        {
          name: 'Stephen Gould',
          url: 'https://github.com/sgould',
          avatar: 'https://avatars1.githubusercontent.com/u/1948931',
        },
        {
          name: 'Jiahao Zhang',
          url: 'https://github.com/DavidZhang73',
          avatar: 'https://avatars1.githubusercontent.com/u/33928385',
        },
        {
          name: 'Itzik Ben Shabat',
          url: 'https://github.com/sitzikbs',
          avatar: 'https://avatars1.githubusercontent.com/u/13794171',
        },
      ],
    }
  },
  methods: {},
  template: ABOUT_TEMPLATE,
}
