<template>
  <div>
    <div class="row" style="min-height: 100px">
      <q-skeleton animation="none" class="col q-ma-sm"></q-skeleton>
    </div>
    <div class="row" style="min-height: 400px">
      <q-skeleton animation="none" class="col q-ma-sm"></q-skeleton>
      <q-skeleton animation="none" class="col-1 q-ma-sm"></q-skeleton>
      <q-skeleton animation="none" class="col q-ma-sm"></q-skeleton>
    </div>
    <div class="row" style="min-height: 100px">
      <q-skeleton animation="none" class="col q-ma-sm"></q-skeleton>
      <div class="col-1 q-ma-sm"></div>
      <q-skeleton animation="none" class="col q-ma-sm"></q-skeleton>
    </div>
    <div class="row" style="min-height: 100px">
      <q-skeleton animation="none" class="col q-ma-sm"></q-skeleton>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnnotationSkeleton',
}
</script>

<style scoped>
</style>
