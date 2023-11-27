<template>
  <div
    style="max-width: 800px; margin: 0 auto"
    class="q-gutter-md"
  >
    <h5>
      About<a
        href="https://github.com/anucvml/vidat"
        target="_blank"
        ><img
          v-if="$q.dark.isActive"
          style="height: 24px; margin-left: 6px"
          src="img/github-logo-dark.png"
          alt="github" /><img
          v-else
          style="height: 24px; margin-left: 6px"
          src="img/github-logo-light.png"
          alt="github"
      /></a>
    </h5>
    <div class="text-body1">
      Developed by the Australian National University Machine Learning and Computer Vision group as a high quality yet
      simple and efficient to use open-source video annotation tool.
    </div>
    <h5>Contributors</h5>
    <div class="row q-gutter-md q-ml-none">
      <ContributorCard
        v-for="contributor in contributorList"
        :key="contributor.name"
        :contributor="contributor"
      >
      </ContributorCard>
    </div>
  </div>
</template>

<script setup>
import ContributorCard from './components/ContributorCard.vue'

const contributorList = [
  {
    name: 'Jiahao Zhang',
    url: 'https://github.com/DavidZhang73',
    avatar: 'https://avatars1.githubusercontent.com/u/33928385'
  },
  {
    name: 'Stephen Gould',
    url: 'https://github.com/sgould',
    avatar: 'https://avatars1.githubusercontent.com/u/1948931'
  },
  {
    name: 'Itzik Ben Shabat',
    url: 'https://github.com/sitzikbs',
    avatar: 'https://avatars1.githubusercontent.com/u/13794171'
  }
]
</script>
