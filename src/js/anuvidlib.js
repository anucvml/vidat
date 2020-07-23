/*******************************************************************************
 ** ANUVIDLIB: A Javascript library for browser-based video annotation.
 ** Copyright (C) 2020, Stephen Gould <stephen.gould@anu.edu.au>
 **
 *******************************************************************************/

/*
** Configuration.
*/

const VERSION = '0.1(alpha)'    // library version (useful for loading old file formats)
const FPS = 10                 // temporal resolution (frames per second)

// webpage control ids
const LEFTCANVASNAME = 'leftframe'
const LEFTSLIDERNAME = 'leftslider'
const LEFTSTATUSNAME = 'leftstatus'
const LEFTOBJTBLNAME = 'leftobjtable'

const RIGHTCANVASNAME = 'rightframe'
const RIGHTSLIDERNAME = 'rightslider'
const RIGHTSTATUSNAME = 'rightstatus'
const RIGHTOBJTBLNAME = 'rightobjtable'

const VIDSEGTABLENAME = 'vidsegtable'
const OBJINFOPOPUP = 'objectinfo'

/*
** Control callback utilities.
*/

// defocus the current control element when enter is pressed and move focus to target element
function defocusOnEnter (event, target = null) {
  if (event.keyCode === 13 || event.which === 13) {
    event.currentTarget.blur()
    if (target != null) {
      target.focus()
    }
  }
}

/*
** Drawing utilities.
*/

// Draw a rounded rectangle path for stroking or filling.
function roundedRect (ctx, x, y, width, height, rounded) {
  const radiansInCircle = 2 * Math.PI
  const halfRadians = (2 * Math.PI) / 2
  const quarterRadians = (2 * Math.PI) / 4

  ctx.beginPath()
  ctx.arc(rounded + x, rounded + y, rounded, -quarterRadians, halfRadians, true)
  ctx.lineTo(x, y + height - rounded)
  ctx.arc(rounded + x, height - rounded + y, rounded, halfRadians, quarterRadians, true)
  ctx.lineTo(x + width - rounded, y + height)
  ctx.arc(x + width - rounded, y + height - rounded, rounded, quarterRadians, 0, true)
  ctx.lineTo(x + width, y + rounded)
  ctx.arc(x + width - rounded, y + rounded, rounded, 0, -quarterRadians, true)
  ctx.lineTo(x + rounded, y)
  ctx.closePath()
}

/*
** Mouse drag context helper.
*/

class DragContext {
  // Drag mode.
  static get NONE () { return 0}

  static get MOVING () { return 1 }

  static get SIZING () { return 2 }

  constructor () {
    this.mode = DragContext.NONE
    this.mouseDownX = null
    this.mouseDownY = null
    this.lastMouseX = null
    this.lastMouseY = null
    this.anchor = null
    this.newObject = false
  }
}

/*
 * Preferences. Responsible for holding the user's editing and visualization preferences. Saves to browser local
 * storage between sessions. Handles showing/hiding a visual element when a preference is changed through the update
 * method. Does not handle redrawing.
 */

class ANUVidLibPreferences {
  constructor () {
    this.version = VERSION         // keep a copy of the version when storing
    this.reset()
  }

  // Reset defaults.
  reset () {
    this.greyframes = false        // draw video frames in greyscale (to make annotations more visible)
    this.tiedframes = false        // lock the offset between left and right frames
    this.showkeyframes = true      // show keyframe annotations
    this.showobjects = true        // show object (bounding box) annotations
    this.showregions = true        // show region (polygon outlines) annotations
    this.showvidsegs = true        // show video segment (and activity) annotations
    this.keyframedelta = 5         // default number of seconds between keyframes
  }

  // Load from browser local storage.
  load () {
    try {
      if (typeof (Storage) !== 'undefined') {
        if (localStorage.getItem('anucvml:prefs') != null) {
          const json = JSON.parse(localStorage.getItem('anucvml:prefs'))
          for (const k in json) {
            if (k in this) this[k] = json[k]
          }
        }
      }
    } catch (err) {
      // do nothing
    }

    // override to current version
    this.version = VERSION
  }

  // Save to browser local storage.
  save () {
    try {
      if (typeof (Storage) !== 'undefined') {
        localStorage.setItem('anucvml:prefs', JSON.stringify(this))
      }
    } catch (err) {
      // do nothing
    }
  }

  // Update a preference and show/hide corresponding visual element (usually a div).
  update (key, value, element_id = null) {
    this[key] = value
    if (element_id != null) {
      document.getElementById(element_id).style.display = value ? 'block' : 'none'
    }
  }
}

/*
** In-browser Video Labeler. Responsible for video rendering and user I/O.
*/
class ANUVidLib {
  // Constants.
  static get LEFT () { return 0 }

  static get RIGHT () { return 1 }

  static get BOTH () { return -1 }

  static get NONE () { return -2 }

  // Properties.
  get greyframes () { return this.prefs.greyframes }

  set greyframes (value) {
    this.prefs.greyframes = value
    this.redraw()
  }

  // Construct an ANUVidLib object with two canvases for displaying frames and text spans for showing status
  // information. Caches frames every second for faster feedback during scrubbing. Calls fcnUpdateGUI(this)
  // when a new video is loaded.
  constructor (fcnUpdateGUI = null) {
    const self = this

    //this.updateGUIFcn = fcnUpdateGUI;
    this.prefs = new ANUVidLibPreferences()    // gui preferences
    this.prefs.load()

    this.lblConfig = new LabelConfig()         // label configuration

    this.video = document.createElement('video')
    this.annotations = new AnnotationContainer(this)

    this.leftPanel = {
      side: ANUVidLib.LEFT,
      canvas: document.getElementById(LEFTCANVASNAME),
      slider: document.getElementById(LEFTSLIDERNAME),
      status: document.getElementById(LEFTSTATUSNAME),
      frame: new Image(),
      cachedGreyData: null,
      timestamp: null,
    }
    this.leftPanel.frame.onload = function () {
      self.leftPanel.cachedGreyData = null
      self.redraw(ANUVidLib.LEFT)
    }
    this.leftPanel.canvas.onmousemove = function (e) { self.mousemove(e, ANUVidLib.LEFT) }
    this.leftPanel.canvas.onmouseout = function (e) { self.mouseout(e, ANUVidLib.LEFT) }
    this.leftPanel.canvas.onmousedown = function (e) { self.mousedown(e, ANUVidLib.LEFT) }
    this.leftPanel.canvas.onmouseup = function (e) { self.mouseup(e, ANUVidLib.LEFT) }
    this.leftPanel.canvas.ondragstart = function (e) { return false }

    this.rightPanel = {
      side: ANUVidLib.RIGHT,
      canvas: document.getElementById(RIGHTCANVASNAME),
      slider: document.getElementById(RIGHTSLIDERNAME),
      status: document.getElementById(RIGHTSTATUSNAME),
      frame: new Image(),
      cachedGreyData: null,
      timestamp: null,
    }
    this.rightPanel.frame.onload = function () {
      self.rightPanel.cachedGreyData = null
      self.redraw(ANUVidLib.RIGHT)
    }
    this.rightPanel.canvas.onmousemove = function (e) { self.mousemove(e, ANUVidLib.RIGHT) }
    this.rightPanel.canvas.onmouseout = function (e) { self.mouseout(e, ANUVidLib.RIGHT) }
    this.rightPanel.canvas.onmousedown = function (e) { self.mousedown(e, ANUVidLib.RIGHT) }
    this.rightPanel.canvas.onmouseup = function (e) { self.mouseup(e, ANUVidLib.RIGHT) }
    this.rightPanel.canvas.ondragstart = function (e) { return false }

    this.leftPanel.other = this.rightPanel
    this.rightPanel.other = this.leftPanel

    this.activeObject = null
    this.dragContext = new DragContext()

    this.bFrameCacheComplete = false
    this.frameCache = []   // array of images

    this.vidRequestQ = []  // video queries (timestamp, who)

    this.video.addEventListener('loadeddata', function () {
      self.resize()
      self.leftPanel.slider.max = Math.floor(FPS * self.video.duration)
      self.leftPanel.slider.value = 0
      self.leftPanel.timestamp = null
      self.rightPanel.slider.max = Math.floor(FPS * self.video.duration)
      self.rightPanel.slider.value = 0
      self.rightPanel.timestamp = null

      self.annotations = new AnnotationContainer(self, Math.floor(FPS * self.video.duration))
      self.generateKeyframes(self.prefs.keyframedelta) // generate default keyframes indexes

      self.frameCache.length = Math.floor(self.video.duration) // space for 1 frame per second
      self.frameCache.fill(null)
      self.bFrameCacheComplete = false

      self.seekToIndex(0, 0)
      if (fcnUpdateGUI != null)
        fcnUpdateGUI(self)
    }, false)

    this.video.addEventListener('error', function () {
      window.alert('ERROR: could not load video "' + self.video.src + '"')
      self.frameCache = []
      self.annotations = new AnnotationContainer(self)
      self.leftPanel.frame = new Image()
      self.leftPanel.frame.onload = function () {
        self.leftPanel.cachedGreyData = null
        self.redraw(ANUVidLib.LEFT)
      }
      self.leftPanel.cachedGreyData = null
      self.leftPanel.slider.value = 0
      self.leftPanel.timestamp = null
      self.rightPanel.frame = new Image()
      self.rightPanel.frame.onload = function () {
        self.rightPanel.cachedGreyData = null
        self.redraw(ANUVidLib.RIGHT)
      }
      self.rightPanel.cachedGreyData = null
      self.rightPanel.slider.value = 0
      self.rightPanel.timestamp = null
      self.redraw(ANUVidLib.BOTH)
      self.leftPanel.status.innerHTML = 'none'
      self.rightPanel.status.innerHTML = 'none'
      if (fcnUpdateGUI != null)
        fcnUpdateGUI(self)
    }, false)

    this.video.addEventListener('seeked', function () {
      // extract the frame and redraw (triggered by onload)
      const canvas = document.createElement('canvas')
      canvas.width = self.video.videoWidth
      canvas.height = self.video.videoHeight
      canvas.getContext('2d').drawImage(self.video, 0, 0, canvas.width, canvas.height)

      // update the correct panel
      console.assert(self.vidRequestQ.length > 0, 'something went wrong')
      if (self.vidRequestQ[0].who === ANUVidLib.LEFT) {
        self.leftPanel.frame.src = canvas.toDataURL('image/jpeg')
      } else if (self.vidRequestQ[0].who === ANUVidLib.RIGHT) {
        self.rightPanel.frame.src = canvas.toDataURL('image/jpeg')
      }

      // cache frame if on one second boundary
      if (self.video.currentTime === Math.floor(self.video.currentTime)) {
        //console.log("caching frame at " + self.video.currentTime + " seconds");
        self.frameCache[self.video.currentTime] = canvas.toDataURL('image/jpeg')
      }

      // trigger next video query if there is one
      self.vidRequestQ.shift()
      if (self.vidRequestQ.length > 0) {
        self.video.currentTime = self.vidRequestQ[0].timestamp
      }
    }, false)

    this.resize()
    window.addEventListener('resize', function () { self.resize() }, false)
  }

  // Load a new video file. Resets data once loaded.
  loadVideo (fileURL) {
    this.video.src = fileURL
  }

  // Convert between indices and timestamps.
  indx2time (index) { return index / FPS }

  time2indx (timestamp) { return Math.round(FPS * timestamp) }

  // Seek to a specific index in the video. A negative number means don't update unless tied.
  seekToIndex (leftIndex, rightIndex) {
    console.assert((leftIndex >= 0) || (rightIndex >= 0))
    if (isNaN(this.video.duration)) {
      this.leftPanel.status.innerHTML = 'none'
      this.rightPanel.status.innerHTML = 'none'
      return
    }

    // deal with tied sliders
    if (this.prefs.tiedframes) {
      if (leftIndex < 0) {
        leftIndex = rightIndex - this.time2indx(this.rightPanel.timestamp) +
          this.time2indx(this.leftPanel.timestamp)
        // check we haven't gone past video boundary
        if ((leftIndex < 0) || (leftIndex > Math.floor(FPS * this.video.duration))) {
          leftIndex = Math.floor(Math.min(Math.max(0, leftIndex), FPS * this.video.duration), 0)
          rightIndex = leftIndex - this.time2indx(this.leftPanel.timestamp) +
            this.time2indx(this.rightPanel.timestamp)
          this.rightPanel.slider.value = rightIndex
        }
        this.leftPanel.slider.value = leftIndex
      } else if (rightIndex < 0) {
        rightIndex = leftIndex - this.time2indx(this.leftPanel.timestamp) +
          this.time2indx(this.rightPanel.timestamp)
        // check we haven't gone past video boundary
        if ((rightIndex < 0) || (rightIndex > Math.floor(FPS * this.video.duration))) {
          rightIndex = Math.floor(Math.min(Math.max(0, rightIndex), FPS * this.video.duration), 0)
          leftIndex = rightIndex - this.time2indx(this.rightPanel.timestamp) +
            this.time2indx(this.leftPanel.timestamp)
          this.leftPanel.slider.value = leftIndex
        }
        this.rightPanel.slider.value = rightIndex
      }
    }

    this.vidRequestQ = []
    if (leftIndex >= 0) {
      const index = Math.floor(Math.min(Math.max(0, leftIndex), FPS * this.video.duration), 0)
      const ts = this.indx2time(index)
      if ((index % FPS === 0) && (this.frameCache[ts] != null)) {
        this.leftPanel.frame.src = this.frameCache[ts]
      } else {
        this.vidRequestQ.push({ timestamp: ts, who: ANUVidLib.LEFT })
      }

      this.leftPanel.timestamp = ts
      this.leftPanel.status.innerHTML = ts.toFixed(2) + ' / ' + this.video.duration.toFixed(2) + 's [' +
        this.video.videoWidth + '-by-' + this.video.videoHeight + ']'
    }

    if (rightIndex >= 0) {
      const index = Math.floor(Math.min(Math.max(0, rightIndex), FPS * this.video.duration), 0)
      const ts = this.indx2time(index)
      if ((index % FPS === 0) && (this.frameCache[ts] != null)) {
        this.rightPanel.frame.src = this.frameCache[ts]
      } else {
        this.vidRequestQ.push({ timestamp: ts, who: ANUVidLib.RIGHT })
      }

      this.rightPanel.timestamp = ts
      this.rightPanel.status.innerHTML = ts.toFixed(2) + ' / ' + this.video.duration.toFixed(2) + 's [' +
        this.video.videoWidth + '-by-' + this.video.videoHeight + ']'
    }

    // add remaining frames at one-second boundaries for caching
    if (!this.bFrameCacheComplete) {
      this.bFrameCacheComplete = true
      for (let i = 0; i < this.video.duration; i++) {
        if (this.frameCache[i] == null) {
          this.bFrameCacheComplete = false
          this.vidRequestQ.push({ timestamp: i, who: ANUVidLib.NONE })
        }
      }

      if (this.bFrameCacheComplete) console.log('...finished caching frames')
    }

    // trigger first video request
    if (this.vidRequestQ.length > 0) {
      this.video.currentTime = this.vidRequestQ[0].timestamp
    }
  }

  // Seek to a specific timestamp in the video. A negative number means don't update unless tied.
  seekToTime (leftTime, rightTime, bUpdateSliders = true) {
    const leftIndex = this.time2indx(leftTime)
    const rightIndex = this.time2indx(rightTime)
    this.leftPanel.slider.value = leftIndex
    this.rightPanel.slider.value = rightIndex
    return this.seekToIndex(leftIndex, rightIndex)
  }

  // Swap left and right panels. Same effect as seekToTime(this.rightPanel.timestamp, this.leftPanel.timestamp, true)
  // but faster since no video seek is required.
  swap () {
    //this.seekToTime(this.rightPanel.timestamp, this.leftPanel.timestamp, true);
    //return;

    let tmp = this.leftPanel.frame.src
    this.leftPanel.frame.src = this.rightPanel.frame.src
    this.rightPanel.frame.src = tmp

    tmp = this.leftPanel.timestamp
    this.leftPanel.timestamp = this.rightPanel.timestamp
    this.rightPanel.timestamp = tmp

    this.leftPanel.slider.value = this.time2indx(this.leftPanel.timestamp)
    this.rightPanel.slider.value = this.time2indx(this.rightPanel.timestamp)

    //this.redraw();
  }

  // Resize left and right canvas when window size changes of new video is loaded.
  resize () {
    this.leftPanel.canvas.width = this.leftPanel.canvas.parentNode.clientWidth
    if (isNaN(this.video.duration)) {
      this.leftPanel.canvas.height = 9 / 16 * this.leftPanel.canvas.width
    } else {
      this.leftPanel.canvas.height = Math.floor(
        this.leftPanel.canvas.width * this.video.videoHeight / this.video.videoWidth)
    }
    this.rightPanel.canvas.width = this.leftPanel.canvas.width
    this.rightPanel.canvas.height = this.leftPanel.canvas.height

    this.leftPanel.cachedGreyData = null
    this.rightPanel.cachedGreyData = null
    this.redraw()
  }

  // Redraw frames and annotations. Parameter 'side' can be LEFT, RIGHT or BOTH.
  redraw (side = ANUVidLib.BOTH) {
    if (side === ANUVidLib.BOTH) {
      this.redraw(ANUVidLib.LEFT)
      this.redraw(ANUVidLib.RIGHT)
      return
    }

    console.assert((side === ANUVidLib.LEFT) || (side === ANUVidLib.RIGHT), 'invalid side')

    // draw left frame
    if (side === ANUVidLib.LEFT) {
      this.paint(this.leftPanel)
      this.refreshObjTable(this.leftPanel)
    }

    // draw right frame
    if (side === ANUVidLib.RIGHT) {
      this.paint(this.rightPanel)
      this.refreshObjTable(this.rightPanel)
    }
  }

  // Draw a frame and it's annotations.
  paint (panel) {
    // draw frame
    const context = panel.canvas.getContext('2d')
    if ((panel.frame != null) && (panel.frame.width > 0) && (panel.frame.height > 0)) {

      if (this.prefs.greyframes && (panel.cachedGreyData != null)) {
        context.putImageData(panel.cachedGreyData, 0, 0)
      } else {
        context.drawImage(panel.frame, 0, 0, panel.canvas.width, panel.canvas.height)

        if (this.prefs.greyframes) {
          panel.cachedGreyData = context.getImageData(0, 0, context.canvas.width, context.canvas.height)
          let pixels = panel.cachedGreyData.data
          const nPixels = pixels.length
          for (let i = 0; i < nPixels; i += 4) {
            let intensity = parseInt(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2])
            pixels[i] = intensity
            pixels[i + 1] = intensity
            pixels[i + 2] = intensity
          }
          context.putImageData(panel.cachedGreyData, 0, 0)
        }
      }
    } else {
      context.clearRect(0, 0, panel.canvas.width, panel.canvas.height)
    }

    // draw objects
    if (this.prefs.showobjects) {
      this.annotations.draw(context, this.time2indx(panel.timestamp), this.activeObject)
    }

    // draw border
    context.lineWidth = 7
    context.strokeStyle = '#ffffff'
    roundedRect(context, 0, -2, panel.canvas.width, panel.canvas.height + 5, 9)
    context.stroke()
    context.lineWidth = 5
    context.strokeStyle = '#000000'
    context.strokeRect(0, -2, panel.canvas.width, panel.canvas.height + 5)
    roundedRect(context, 0, -2, panel.canvas.width, panel.canvas.height + 5, 9)
    context.stroke()

    // update status
    if (panel.timestamp == null) {
      panel.status.innerHTML = 'none'
    } else {
      panel.status.innerHTML = panel.timestamp.toFixed(2) + ' / ' + this.video.duration.toFixed(2) + 's [' +
        this.video.videoWidth + '-by-' + this.video.videoHeight + ']'
    }
  }

  // Copy objects from source frame to target frame.
  copy (srcSide, tgtSide, overwrite) {
    const srcPanel = (srcSide === ANUVidLib.LEFT) ? this.leftPanel : this.rightPanel
    const tgtPanel = (tgtSide === ANUVidLib.LEFT) ? this.leftPanel : this.rightPanel
    const srcIndex = this.time2indx(srcPanel.timestamp)
    const tgtIndex = this.time2indx(tgtPanel.timestamp)
    if (srcIndex === tgtIndex)
      return

    this.annotations.copy(srcIndex, tgtIndex, overwrite)
    this.redraw(tgtSide)
  }

  // Refresh list of objects for the given panel.
  refreshObjTable (panel) {
// get object list and table reference
    const frameIndex = this.time2indx(panel.timestamp)
    const table = document.getElementById(panel.side === ANUVidLib.LEFT ? LEFTOBJTBLNAME : RIGHTOBJTBLNAME)

    // delete all rows (except header)
    for (let i = table.rows.length - 1; i >= 1; i--) {
      table.deleteRow(i)
    }

    // add objects
    const self = this  // for callbacks
    const width = self.video.videoWidth
    const height = self.video.videoHeight

    function insertInputHelper (row, value, update) {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = value
      input.onkeypress = function (event) { defocusOnEnter(event) }
      input.onblur = function (event) {
        update(event.target.value)
        self.paint(panel)
        self.paint(panel.other)
      }

      row.insertCell(-1).appendChild(input)
    }

    const objects = this.annotations.objectList[frameIndex]
    for (let i = 0; i < objects.length; i++) {
      let obj = objects[i]   // for callbacks

      const row = table.insertRow(-1)

      // x, y, width and height
      insertInputHelper(row, Math.round(obj.x * width), (v) => {obj.x = v / width})
      insertInputHelper(row, Math.round(obj.y * height), (v) => {obj.y = v / height})
      insertInputHelper(row, Math.round(obj.width * width), (v) => {obj.width = v / width})
      insertInputHelper(row, Math.round(obj.height * height), (v) => {obj.height = v / height})

      // label
      const select = document.createElement('select')
      select.style.width = '100%'
      for (const k in this.lblConfig.objectLabels) {
        const opt = document.createElement('option')
        opt.textContent = String(k)
        opt.value = String(k)
        select.appendChild(opt)
      }
      select.value = objects[i].labelId
      select.onkeypress = function (event) { defocusOnEnter(event) }
      select.onchange = function (event) {
        obj.labelId = event.target.value
        self.paint(panel)
        self.paint(panel.other)
      }
      select.onblur = function (event) {
        obj.labelId = event.target.value
        self.paint(panel)
        self.paint(panel.other)
      }
      row.insertCell(-1).appendChild(select)

      // instance id, colour and score
      insertInputHelper(row, obj.instanceId, (v) => {obj.instanceId = v})
      insertInputHelper(row, obj.colour, (v) => {obj.colour = v})
      insertInputHelper(row, obj.score, (v) => {obj.score = v})

      // buttons
      const cell = row.insertCell(8)
      cell.innerHTML = '<button title=\'delete\' onclick=\'v.annotations.objectList[' + frameIndex +
        '].splice(this.parentElement.parentElement.rowIndex - 1, 1); v.redraw();\'>&#x2718;</button>'
      cell.innerHTML += ' <button title=\'move up\' onclick=\'v.annotations.swapObjects(' + frameIndex + ',' +
        i + ',' + frameIndex + ',' + (i - 1) + '); v.redraw();\'>&#x1F819;</button>'
      cell.innerHTML += ' <button title=\'move down\' onclick=\'v.annotations.swapObjects(' + frameIndex + ',' +
        i + ',' + frameIndex + ',' + (i + 1) + '); v.redraw();\'>&#x1F81B;</button>'
      cell.style.textAlign = 'right'
    }
  }

  // Refresh the list of temporal segments.
  refreshVidSegTable (activeSeg = -1) {
// delete all rows (except the header)
    const table = document.getElementById(VIDSEGTABLENAME)
    for (let i = table.rows.length - 1; i > 0; i--) {
      table.deleteRow(i)
    }

    // now repopulate the table
    const nVidSegs = this.annotations.vidSegList.length
    for (let i = 0; i < nVidSegs; i++) {
      let seg = this.annotations.vidSegList[i]   // for callbacks

      const row = table.insertRow(-1)
      row.insertCell(0).innerHTML = seg.start
      row.insertCell(1).innerHTML = seg.end

      const select = document.createElement('select')
      select.classList.add('segdesc')
      select.style.width = '100%'
      for (const k in v.lblConfig.actionLabels) {
        const opt = document.createElement('option')
        opt.textContent = String(k)
        opt.value = String(k)
        select.appendChild(opt)
      }
      select.value = this.annotations.vidSegList[i].actionId
      select.onkeypress = function (event) { defocusOnEnter(event) }
      select.onchange = function (event) { seg.actionId = event.target.value }
      select.onblur = function (event) { seg.actionId = event.target.value }
      row.insertCell(2).appendChild(select)

      const input = document.createElement('input')
      input.type = 'text'
      input.classList.add('segdesc')
      input.value = this.annotations.vidSegList[i].description
      parent = row.insertCell(3)
      parent.appendChild(input)
      const cell = row.insertCell(4)
      cell.innerHTML = '<button title=\'delete\' onclick=\'v.annotations.vidSegList.splice(this.parentElement.parentElement.rowIndex - 1, 1); v.refreshVidSegTable();\'>&#x2718;</button>'
      cell.innerHTML += ' <button title=\'move up\' onclick=\'v.annotations.swapVidSegs(' + i + ', ' + (i - 1) +
        '); v.refreshVidSegTable();\'>&#x1F819;</button>'
      cell.innerHTML += ' <button title=\'move down\' onclick=\'v.annotations.swapVidSegs(' + i + ',' + (i + 1) +
        '); v.refreshVidSegTable();\'>&#x1F81B;</button>'
      cell.innerHTML += ' <button title=\'goto\' onclick=\'v.seekToTime(' + seg.start + ', ' + seg.end +
        ', true);\'>&#x2692;</button>'
      cell.style.textAlign = 'right'
      input.onkeypress = function (event) { defocusOnEnter(event, document.getElementById(LEFTSLIDERNAME)) }
      input.onblur = function (event) { seg.description = event.target.value }

      // Set focus on active segment
      if (i === activeSeg) {
        if (focus) input.focus()
      }
    }
  }

  // Generate keyframes are regular interval. If delta is null then requests time interval from user.
  generateKeyframes (delta = null) {
    if (delta == null) {
      const retVal = prompt('Generate keyframe every how many seconds?', this.prefs.keyframedelta)
      if (retVal == null) return false
      delta = parseFloat(retVal)
    }
    delta = Math.round(FPS * delta) / FPS
    if (delta <= 0)
      return false
    this.prefs.keyframedelta = delta // remember this value as the new default

    this.annotations.keyframes = []
    let ts = 0.0
    while (ts < this.video.duration) {
      this.annotations.keyframes.push(ts)
      ts += delta
    }

    this.drawKeyframes()
    return true
  }

  // Set keyframes from a comma-separated list.
  setKeyframes (str) {
    const timestamps = []
    const tokens = str.split(',')
    for (let i = 0; i < tokens.length; i++) {
      let ts = parseFloat(tokens[i])
      if (!isNaN(ts) && (ts >= 0.0) && (ts <= this.video.duration)) {
        timestamps.push(ts)
      }
    }
    timestamps.sort(function (a, b) {return a - b})
    this.annotations.keyframes = timestamps.filter((e, i, a) => (i === 0) || (e !== a[i - 1]))
    this.drawKeyframes()
  }

  drawKeyframes () {
    // TODO: better keyframe visualisation
    const el = document.getElementById('keyframeListId')
    const nKeyframes = this.annotations.keyframes.length
    if (nKeyframes === 0) {
      el.value = ''
      return
    }
    el.value = ''
    for (let i = 0; i < nKeyframes; i++) {
      if (i > 0) el.value += ', '
      el.value += this.annotations.keyframes[i]
    }
  }

  nextKeyframe () {
    // find next keyframe (based on right panel)
    const nKeyframes = this.annotations.keyframes.length
    let i = 1
    while ((i < nKeyframes) && (this.annotations.keyframes[i] <= this.rightPanel.timestamp)) {
      i += 1
    }

    if (i < nKeyframes) {
      this.seekToTime(this.annotations.keyframes[i - 1], this.annotations.keyframes[i])
      return true
    }

    return false
  }

  prevKeyframe () {
    // find previous keyframe (based on left panel)
    const nKeyframes = this.annotations.keyframes.length
    let i = 0
    while ((i < nKeyframes) && (this.annotations.keyframes[i] < this.leftPanel.timestamp)) {
      i += 1
    }

    if (i < nKeyframes) {
      this.seekToTime(i === 0 ? 0.0 : this.annotations.keyframes[i - 1], this.annotations.keyframes[i])
      return true
    }

    return false
  }

  // Clear object annotations for the current frame.
  clearObjects (side) {
    let frameIndex = v.time2indx(side === ANUVidLib.LEFT ? this.leftPanel.timestamp : this.rightPanel.timestamp)
    this.annotations.objectList[frameIndex] = []
    this.redraw(ANUVidLib.BOTH)
  }

  // Get active object at position (x, y) on given panel.
  findActiveObject (x, y, panel) {
    if (!this.prefs.showobjects)
      return null

    const frameIndex = this.time2indx(panel.timestamp)
    for (let i = this.annotations.objectList[frameIndex].length - 1; i >= 0; i--) {
      if (this.annotations.objectList[frameIndex][i].nearBoundary(x, y, panel.canvas.width,
        panel.canvas.height)) {
        return this.annotations.objectList[frameIndex][i]
      }
    }

    return null
  }

  // Delete the active object (as long as it's not being modified).
  deleteActiveObject () {
    if ((this.activeObject != null) && (this.dragContext.mode === DragContext.NONE)) {
      let frameIndex = this.time2indx(this.leftPanel.timestamp)
      for (let i = 0; i < this.annotations.objectList[frameIndex].length; i++) {
        if (this.annotations.objectList[frameIndex][i] === this.activeObject) {
          this.annotations.objectList[frameIndex].splice(i, 1)
          break
        }
      }
      frameIndex = this.time2indx(this.rightPanel.timestamp)
      for (let i = 0; i < this.annotations.objectList[frameIndex].length; i++) {
        if (this.annotations.objectList[frameIndex][i] === this.activeObject) {
          this.annotations.objectList[frameIndex].splice(i, 1)
          break
        }
      }

      this.activeObject = null
      this.redraw()
    }
  }

  newVidSeg () {
    this.annotations.vidSegList.push(
      new VidSegment({ start: this.leftPanel.timestamp, end: this.rightPanel.timestamp }))
    this.refreshVidSegTable(v.annotations.vidSegList.length - 1)
  }

  // Process mouse movement over a panel.
  mousemove (event, side) {
    let el
    console.assert((side === ANUVidLib.LEFT) || (side === ANUVidLib.RIGHT), 'invalid side')
    //console.log("mouse moving in " + ((side == ANUVidLib.LEFT) ? "left" : "right"));

    // get current panel
    const panel = (side === ANUVidLib.LEFT) ? this.leftPanel : this.rightPanel

    // compute delta movement (can't use event.movement{X,Y} because it doesn't take account of browser zoom)
    const deltaX = event.offsetX - this.dragContext.lastDownX
    const deltaY = event.offsetY - this.dragContext.lastDownY
    this.dragContext.lastDownX = event.offsetX
    this.dragContext.lastDownY = event.offsetY

    // handle dragging
    if (this.dragContext.mode === DragContext.MOVING) {
      this.activeObject.x += deltaX / panel.canvas.width
      this.activeObject.y += deltaY / panel.canvas.height
      this.paint(panel)
      if (this.leftPanel.timestamp === this.rightPanel.timestamp) {
        this.paint(panel.other)
      }
      return
    }

    if (this.dragContext.mode === DragContext.SIZING) {
      const x = this.dragContext.anchor.u / panel.canvas.width
      const y = this.dragContext.anchor.v / panel.canvas.height
      const w = deltaX / panel.canvas.width +
        ((x > this.activeObject.x) ? -this.activeObject.width : this.activeObject.width)
      const h = deltaY / panel.canvas.height +
        ((y > this.activeObject.y) ? -this.activeObject.height : this.activeObject.height)
      this.activeObject.resize(x, y, w, h)
      this.paint(panel)
      if (this.leftPanel.timestamp === this.rightPanel.timestamp) {
        this.paint(panel.other)
      }
      return
    }

    // search for an active object
    const lastActiveObject = this.activeObject
    this.activeObject = this.findActiveObject(event.offsetX, event.offsetY, panel)

    // update cursor
    panel.canvas.style.cursor = (this.activeObject) ? 'pointer' : 'auto'

    // TODO: experimenting
    if (this.activeObject) {
      el = document.getElementById(OBJINFOPOPUP)
      el.style.display = 'block'
      el.style.left = ((event.x - event.offsetX) + this.activeObject.x * panel.canvas.width) + 'px'
      el.style.top = ((event.y - event.offsetY) + (this.activeObject.y + this.activeObject.height) *
        panel.canvas.height + 8) + 'px'
    } else {
      el = document.getElementById(OBJINFOPOPUP)
      el.style.display = 'none'
    }

    // repaint if the active object changed
    if (this.activeObject !== lastActiveObject) {
      this.paint(panel)
    }
  }

  // Process mouse leaving a panel.
  mouseout (event, side) {
    this.dragContext.mode = DragContext.NONE
    if (this.activeObject != null) {
      this.activeObject = null
      this.paint((side === ANUVidLib.LEFT) ? this.leftPanel : this.rightPanel)
      if (this.leftPanel.timestamp === this.rightPanel.timestamp) {
        this.paint((side === ANUVidLib.RIGHT) ? this.leftPanel : this.rightPanel)
      }
    }
  }

  // Process mouse button press inside panel.
  mousedown (event, side) {
    // TODO: experimenting
    const el = document.getElementById(OBJINFOPOPUP)
    el.style.display = 'none'

    // search for an active object
    const panel = (side === ANUVidLib.LEFT) ? this.leftPanel : this.rightPanel
    this.activeObject = this.findActiveObject(event.offsetX, event.offsetY, panel)

    if ((this.activeObject != null) && (!event.shiftKey)) {
      // resize active object
      this.dragContext.anchor = this.activeObject.oppositeAnchor(event.offsetX, event.offsetY, panel.canvas.width,
        panel.canvas.height)
      if (this.dragContext.anchor == null) {
        this.dragContext.mode = DragContext.MOVING
      } else {
        this.dragContext.mode = DragContext.SIZING
      }
      this.dragContext.newObject = false
    } else {
      // add new object
      const frameIndex = this.time2indx(panel.timestamp)
      if (this.activeObject != null) {
        this.activeObject = this.activeObject.clone()
        this.dragContext.mode = DragContext.MOVING
      } else {
        this.activeObject = new ObjectBox({
          x: event.offsetX / panel.canvas.width,
          y: event.offsetY / panel.canvas.height,
          width: 0,
          height: 0,
        })
        this.dragContext.mode = DragContext.SIZING
      }
      this.annotations.objectList[frameIndex].push(this.activeObject)
      this.dragContext.anchor = this.activeObject.oppositeAnchor(event.offsetX, event.offsetY, panel.canvas.width,
        panel.canvas.height)
      this.dragContext.newObject = true
    }

    this.dragContext.mouseDownX = event.offsetX
    this.dragContext.mouseDownY = event.offsetY
    this.dragContext.lastDownX = event.offsetX
    this.dragContext.lastDownY = event.offsetY
  }

  // Process mouse button press inside panel.
  mouseup (event, side) {
    this.dragContext.mode = DragContext.NONE

    if (this.activeObject != null) {
      if (this.dragContext.newObject) {
        // delete mouse hasn't moved
        if ((event.offsetX === this.dragContext.mouseDownX) &&
          (event.offsetY === this.dragContext.mouseDownY)) {
          //console.log("removing new object");
          const frameIndex = this.time2indx(
            side === ANUVidLib.LEFT ? this.leftPanel.timestamp : this.rightPanel.timestamp)
          this.annotations.objectList[frameIndex].pop()
          this.dragContext.newObject = false
        }
      }

      //this.activeObject = null;
      this.redraw(this.leftPanel.timestamp === this.rightPanel.timestamp ? ANUVidLib.BOTH : side)

      // set focus of next component
      if (this.dragContext.newObject) {
        const tbl = document.getElementById(side === ANUVidLib.LEFT ? LEFTOBJTBLNAME : RIGHTOBJTBLNAME)
        tbl.rows[tbl.rows.length - 1].cells[4].firstElementChild.focus()
      }
    }
  }
}
