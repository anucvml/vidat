<template>
  <div
      style="max-width: 800px; margin: 0 auto"
      class="q-gutter-md"
  >
    <div class="row">
      <div class="text-h5">Preferences</div>
      <q-space></q-space>
      <q-btn
          class="q-px-md q-mr-md"
          outline
          dense
          color="primary"
          icon="cached"
          @click="preferenceStore.reset"
          label="restore"
      ></q-btn>
    </div>
    <q-list class="text-body1">
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Sensitivity (pixels)<q-tooltip
                anchor="center right"
                self="center left"
            >The number of pixels for border detection in Canvas.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section>
          <q-input
              dense
              outlined
              v-model.number="sensitivity"
              type="number"
              :rules="[s => s >= 1 && s % 1 === 0 || 'Integer larger than 1.']"
              @mousewheel.prevent
              hide-bottom-space
          />
        </q-item-section>
      </q-item>
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Default FPS<q-tooltip
                anchor="center right"
                self="center left"
            >The default frame(s) per second if not specified in config or annotation file.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section>
          <q-input
              dense
              outlined
              v-model.number="defaultFps"
              type="number"
              :rules="[fps => fps >= 1 && fps <= 60 && fps % 1 === 0 || 'Integer between 1 and 60.']"
              @mousewheel.prevent
              hide-bottom-space
          />
        </q-item-section>
      </q-item>
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Default FPK<q-tooltip
                anchor="center right"
                self="center left"
            >The default frame(s) per keyframe if the keyframe list is not provided in annotation file.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section>
          <q-input
              dense
              outlined
              v-model.number="defaultFpk"
              type="number"
              :rules="[fpk => fpk >= 1 && fpk % 1 === 0 || 'Integer greater than 1.']"
              @mousewheel.prevent
              hide-bottom-space
          />
        </q-item-section>
      </q-item>
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Video Decoder<q-tooltip
                anchor="center right"
                self="center left"
            >Which video decoder is used to extract frames. Find more details in the documentation.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section>
          <q-select
              dense
              outlined
              v-model="decoder"
              :options="['auto', 'v1', 'v2']"
          />
        </q-item-section>
      </q-item>
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Objects<q-tooltip
                anchor="center right"
                self="center left"
            >Whether to show Objects mode or not.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
              color="green"
              v-model="objects"
              checked-icon="check"
              unchecked-icon="clear"
          ></q-toggle>
        </q-item-section>
      </q-item>
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Regions<q-tooltip
                anchor="center right"
                self="center left"
            >Whether to show Regions mode or not.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
              color="green"
              v-model="regions"
              checked-icon="check"
              unchecked-icon="clear"
          ></q-toggle>
        </q-item-section>
      </q-item>
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Skeletons<q-tooltip
                anchor="center right"
                self="center left"
            >Whether to show Skeletons mode or not.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
              color="green"
              v-model="skeletons"
              checked-icon="check"
              unchecked-icon="clear"
          ></q-toggle>
        </q-item-section>
      </q-item>
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Actions / Video segments<q-tooltip
                anchor="center right"
                self="center left"
            >Whether to show Actions / Video segments mode or not.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
              color="green"
              v-model="actions"
              checked-icon="check"
              unchecked-icon="clear"
          ></q-toggle>
        </q-item-section>
      </q-item>
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Mute video<q-tooltip
                anchor="center right"
                self="center left"
            >Whether to mute when playing video clips.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
              color="green"
              v-model="muted"
              checked-icon="check"
              unchecked-icon="clear"
          ></q-toggle>
        </q-item-section>
      </q-item>
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Grayscale video<q-tooltip
                anchor="center right"
                self="center left"
            >Whether to make video in grayscale mode.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
              color="green"
              v-model="grayscale"
              checked-icon="check"
              unchecked-icon="clear"
          ></q-toggle>
        </q-item-section>
      </q-item>
      <q-item
          tag="label"
          v-ripple
      >
        <q-item-section>
          <q-item-label>
            <span>Show Popup<q-tooltip
                anchor="center right"
                self="center left"
            >Whether to show popup edit menu when creating annotations on canvas.</q-tooltip></span>
          </q-item-label>
        </q-item-section>
        <q-item-section avatar>
          <q-toggle
              color="green"
              v-model="showPopup"
              checked-icon="check"
              unchecked-icon="clear"
          ></q-toggle>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { usePreferenceStore } from '~/store/preference.js'

const preferenceStore = usePreferenceStore()
const {
  sensitivity,
  defaultFps,
  defaultFpk,
  decoder,
  objects,
  regions,
  skeletons,
  actions,
  muted,
  grayscale,
  showPopup
} = storeToRefs(
    preferenceStore
)
</script>
