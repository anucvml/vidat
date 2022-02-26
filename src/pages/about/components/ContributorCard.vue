<template>
  <a
      :href="contributor.url"
      target="_blank"
  >
    <q-card>
      <q-card-section>
        <q-avatar size="100px">
          <img
              :src="contributor.avatar"
              alt="avatar"
          >
        </q-avatar>
      </q-card-section>
      <q-card-section class="text-center">
        {{ contributor.name }}
      </q-card-section>
    </q-card>
  </a>
</template>

<script setup>
defineProps({
  contributor: {
    type: Object,
    required: true
  }
})
</script>
