const SKELETON_TABLE_TEMPLATE = `
<q-table
  dense
  flat
  :data="skeletonAnnotationList"
  row-key="pointList"
  :columns="columnList"
  :pagination.sync="pagination"
>
  <template v-slot:top="props">
    <div class="col-6 q-table__title">Skeleton</div>
    <q-space></q-space>
    <q-btn icon="clear_all" @click="handleClearAll">CLEAR</q-btn>
  </template>
  <template v-slot:header="props">
    <q-tr :props="props">
      <q-th auto-width></q-th>
      <q-th
        v-for="col in props.cols"
        :key="col.name"
        :props="props"
      >
        {{ col.label }}
      </q-th>
    </q-tr>
  </template>
  <template v-slot:body="props">
    <q-tr :props="props">
      <q-td auto-width>
        <q-btn
          size="sm"
          round
          dense
          @click="props.expand = !props.expand"
          :icon="props.expand ? 'expand_more' : 'chevron_right'"
        ></q-btn>
      </q-td>
      <q-td key="type" :props="props">
        {{ props.row.type.name }}
      </q-td>
      <q-td key="color" :props="props">
        <q-chip
          outline
          :style="{ 'border-color': props.row.color, 'color': props.row.color }"
        >
          {{ props.row.color.toUpperCase() }}
         </q-chip>
        <q-popup-edit
          auto-save
          v-model="props.row.color"
          title="Edit the object color"
        >
          <q-color v-model="props.row.color"></q-color>
        </q-popup-edit>
      </q-td>
      <q-td key="instance" :props="props">
        <q-input
          v-model.number="props.row.instance"
          dense
          borderless
          type="number"
        ></q-input>
      </q-td>
      <q-td key="score" :props="props">
        <q-input
          v-model.number="props.row.score"
          dense
          borderless
          type="number"
        ></q-input>
      </q-td>
      <q-td key="operation" :props="props">
        <q-btn-group spread flat>
          <q-btn
            flat
            dense
            icon="keyboard_arrow_up"
            style="width: 100%"
            @click="handleUp(props.row)"
          ></q-btn>
          <q-btn
            flat
            dense
            icon="keyboard_arrow_down"
            style="width: 100%"
            @click="handleDown(props.row)"
          ></q-btn>
          <q-btn
            flat
            dense
            icon="delete"
            color="negative"
            style="width: 100%"
            @click="handleDelete(props.row)"
          ></q-btn>
        </q-btn-group>
      </q-td>
    </q-tr>
    <q-tr v-show="props.expand" :props="props">
      <q-td colspan="100%" style="padding: 0;">
        <q-table
          dense
          flat
          hide-bottom
          :data="props.row.pointList"
          :columns="[
            { name: 'name', align: 'left', label: 'name', field: 'name' },
            { name: 'x', align: 'left', label: 'x', field: 'x' },
            { name: 'y', align: 'left', label: 'y', field: 'y' },
          ]"
          :pagination.sync="pagination"
        >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td key="name" :props="props">
              {{ props.row.name }}
            </q-td>
            <q-td key="x" :props="props">
              <q-input
                v-model.number="props.row.x"
                dense
                borderless
                type="number"
              ></q-input>
            </q-td>
            <q-td key="y" :props="props">
              <q-input
                v-model.number="props.row.y"
                dense
                borderless
                type="number"
              ></q-input>
            </q-td>
          </q-tr>
        </template>
        </q-table>
      </q-td>
    </q-tr>
  </template>
</q-table>
`

import utils from '../../../libs/utils.js'

const columnList = [
  { name: 'type', align: 'center', label: 'type', field: 'type' },
  { name: 'color', align: 'center', label: 'color', field: 'color', style: 'width: 120px' },
  { name: 'instance', align: 'center', label: 'instance', field: 'instance' },
  { name: 'score', align: 'center', label: 'score', field: 'score' },
  { name: 'operation', align: 'center', label: 'operation', field: 'operation' },
]

export default {
  props: {
    'position': String,
  },
  data: () => {
    return {
      columnList,
      pagination: { rowsPerPage: 0 },
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setAnnotationList',
    ]),
    handleUp (row) {
      for (let i = 0; i < this.skeletonAnnotationList.length; i++) {
        if (this.skeletonAnnotationList[i] === row) {
          if (i - 1 >= 0) {
            this.skeletonAnnotationList[i] = this.skeletonAnnotationList.splice(i - 1, 1,
              this.skeletonAnnotationList[i])[0]
          }
          break
        }
      }
    },
    handleDown (row) {
      for (let i = 0; i < this.skeletonAnnotationList.length; i++) {
        if (this.skeletonAnnotationList[i] === row) {
          if (i + 2 <= this.skeletonAnnotationList.length) {
            this.skeletonAnnotationList[i] = this.skeletonAnnotationList.splice(i + 1, 1,
              this.skeletonAnnotationList[i])[0]
          }
          break
        }
      }
    },
    handleDelete (row) {
      utils.confirm('Are you sure to delete this skeleton?').onOk(() => {
        for (let i in this.skeletonAnnotationList) {
          if (this.skeletonAnnotationList[i] === row) {
            this.skeletonAnnotationList.splice(i, 1)
          }
        }
      })
    },
    handleClearAll () {
      if (this.skeletonAnnotationList.length > 0) {
        utils.confirm('Are you sure to delete ALL skeletons?').onOk(() => {
          this.setAnnotationList({
            mode: 'skeleton',
            index: this.currentFrame,
            annotationList: [],
          })
        })
      } else {
        utils.notify('There are no regions!')
      }
    },
  },
  computed: {
    currentFrame () {
      return eval('this.$store.state.annotation.' + this.position + 'CurrentFrame')
    },
    skeletonAnnotationList () {
      return this.$store.state.annotation.skeletonAnnotationListMap[this.currentFrame]
    },
  },
  template: SKELETON_TABLE_TEMPLATE,
}
