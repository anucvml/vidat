const KEYFRAME_TABLE_TEMPLATE = `
<q-table
  class="full-width"
  dense
  flat
  :data="keyframeList"
  :pagination.sync="pagination"
  :columns="[
    { name: 'frame', align: 'center', label: 'frame' },
    { name: 'time', align: 'center', label: 'time' },
    { name: 'nObject', align: 'center', label: '# object' },
    { name: 'nRegion', align: 'center', label: '# region' },
    { name: 'nSkeleton', align: 'center', label: '# skeleton' },
    { name: 'operation', align: 'center', label: 'operation' },
  ]"
>
  <template v-slot:top="props">
    <div class="col-6 q-table__title">Keyframes</div>
    <q-space></q-space>
    <q-btn-group>
      <q-btn icon="arrow_left" @click="handleAddLeft" label="add left"></q-btn>
      <q-btn icon="add" @click="handleAdd" label="add"></q-btn>
      <q-btn icon="arrow_right" @click="handleAddRight" label="add right"></q-btn>
      <q-btn icon="more_time" @click="handleGenerate" label="generate"></q-btn>
      <q-btn icon="save" @click="handleExport" label="export"></q-btn>
    </q-btn-group>
  </template>
  <template v-slot:body="props">
    <q-tr :props="props">
      <q-td key="frame" :props="props">
        {{ props.row }}
      </q-td>
      <q-td key="time" :props="props">
        {{ toFixed2(index2time(props.row)) }}
      </q-td>
      <q-td key="nObject" :props="props">
        {{ objectAnnotationListMap[props.row] ? objectAnnotationListMap[props.row].length : 0 }}
      </q-td>
      <q-td key="nRegion" :props="props">
        {{ regionAnnotationListMap[props.row] ? regionAnnotationListMap[props.row].length : 0 }}
      </q-td>
      <q-td key="nSkeleton" :props="props">
        {{ skeletonAnnotationListMap[props.row] ? skeletonAnnotationListMap[props.row].length : 0 }}
      </q-td>
      <q-td key="operation" :props="props">
        <q-btn-group spread flat>
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
  </template>
</q-table>
`

import utils from '../../../libs/utils.js'

export default {
  data: () => {
    return {
      index2time: utils.index2time,
      toFixed2: utils.toFixed2,
      pagination: { rowsPerPage: 5 },
    }
  },
  methods: {
    ...Vuex.mapMutations([
      'setKeyframeList',
      'setLeftCurrentFrame',
      'setRightCurrentFrame',
    ]),
    handleAddCurrentFrame (currentFrame) {
      const currentKeyframeIndex = this.keyframeList.indexOf(currentFrame)
      if (currentKeyframeIndex === -1) {
        for (const i in this.keyframeList) {
          if (this.keyframeList[i] > currentFrame) {
            this.keyframeList.splice(i, 0, currentFrame)
            utils.notify(`Frame ${currentFrame} is added successfully!`)
            return
          }
        }
        this.keyframeList.push(currentFrame)
        utils.notify(`Frame ${currentFrame} is added successfully!`)
      } else {
        utils.notify(`Frame ${currentFrame} is already a keyframe!`)
      }
    },
    handleAddLeft () {
      this.handleAddCurrentFrame(this.leftCurrentFrame)
    },
    handleAddRight () {
      this.handleAddCurrentFrame(this.rightCurrentFrame)
    },
    handleAdd () {
      utils.prompt(
        'Add keyframe',
        'Please input the id of frame you would like to mark as keyframe',
        0,
        'number',
      ).onOk((frame) => {
        frame = parseInt(frame)
        if (frame >= 0 && frame % 1 === 0 && frame <= this.video.frames) {
          this.handleAddCurrentFrame(frame)
        } else {
          utils.notify(`Please enter an integer bigger than 0 and less than ${this.video.frames}`)
        }
      })
    },
    handleGenerate () {
      utils.prompt(
        'Generate keyframes',
        'Generate keyframe every how many frames? Integer bigger or equal to 1.',
        5,
        'number',
      ).onOk((framePerKeyframe) => {
        framePerKeyframe = parseInt(framePerKeyframe)
        if (framePerKeyframe >= 1 && framePerKeyframe % 1 === 0) {
          const keyframeList = []
          for (let i = 0; i < this.video.frames; i += framePerKeyframe) {
            keyframeList.push(parseInt(i))
          }
          this.setKeyframeList(keyframeList)
          this.setLeftCurrentFrame(keyframeList[0])
          this.setRightCurrentFrame(keyframeList[1] || keyframeList[0])
        } else {
          utils.notify('Please enter an integer bigger than 1.')
        }
      })
    },
    handleExport () {
      utils.prompt(
        'Save',
        'Enter keyframes filename for saving',
        'keyframes').onOk(filename => {
        // ensure that we have all the keyframes
        let isOk = true
        for (let i = 0; i < this.keyframeList.length; i++) {
          if (!this.cachedFrameList[this.keyframeList[i]]) {
            isOk = false
            break
          }
        }
        // export all keyframes as a zip file
        if (isOk) {
          const zip = new JSZip()
          for (let i = 0; i < this.keyframeList.length; i++) {
            const imgDataURL = this.cachedFrameList[this.keyframeList[i]]
            zip.file(
              this.keyframeList[i] + '.jpg',
              imgDataURL.slice(imgDataURL.indexOf(',') + 1),
              { base64: true },
            )
          }
          zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, filename + '-' + this.video.fps + '-fps.zip')
          })
        } else {
          utils.notify('Please wait for caching!')
        }
      })
    },
    handleDelete (keyframe) {
      utils.confirm(`Are you sure delete keyframe ${keyframe}?`).onOk(() => {
        this.keyframeList.splice(this.keyframeList.indexOf(keyframe), 1)
        this.setKeyframeList(this.keyframeList)
      })
    },
  },
  computed: {
    video () {
      return this.$store.state.annotation.video
    },
    keyframeList () {
      return this.$store.state.annotation.keyframeList
    },
    leftCurrentFrame () {
      return this.$store.state.annotation.leftCurrentFrame
    },
    rightCurrentFrame () {
      return this.$store.state.annotation.rightCurrentFrame
    },
    objectAnnotationListMap () {
      return this.$store.state.annotation.objectAnnotationListMap
    },
    regionAnnotationListMap () {
      return this.$store.state.annotation.regionAnnotationListMap
    },
    skeletonAnnotationListMap () {
      return this.$store.state.annotation.skeletonAnnotationListMap
    },
    cachedFrameList () {
      return this.$store.state.annotation.cachedFrameList
    },
  },
  template: KEYFRAME_TABLE_TEMPLATE,
}
