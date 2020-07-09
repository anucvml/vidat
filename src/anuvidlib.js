/*******************************************************************************
** ANUVIDLIB: A Javascript library for browser-based video annotation.
** Copyright (C) 2020, Stephen Gould <stephen.gould@anu.edu.au>
**
*******************************************************************************/

/*
** Configuration.
*/

const VERSION = "0.1(alpha)"    // library version (useful for loading old file formats)
const FPS = 10;                 // temporal resolution (frames per second)

const DEFAULTKEYFRAMES = 5;     // default number of seconds between keyframes

// webpage control ids
const LEFTCANVASNAME  = "leftframe";
const LEFTSLIDERNAME  = "leftslider";
const LEFTSTATUSNAME  = "leftstatus";
const LEFTOBJTBLNAME  = "leftobjtable";

const RIGHTCANVASNAME = "rightframe";
const RIGHTSLIDERNAME = "rightslider";
const RIGHTSTATUSNAME = "rightstatus";
const RIGHTOBJTBLNAME = "rightobjtable";

const VIDSEGTABLENAME = "vidsegtable";
const OBJINFOPOPUP = "objectinfo";

/*
** Control callback utilities.
*/

// defocus the current control element when enter is pressed and move focus to target element
function defocusOnEnter(event, target = null) {
    if (event.keyCode == 13 || event.which == 13) {
        event.currentTarget.blur();
        if (target != null) {
            target.focus();
        }
    }
}

// Move a table row up. Warning: does not modify the content so table content should not depend on order. Also does not
// change underlying data from which the table was generated. Use inside a row's cell as, e.g.,
//   <button title='move up' onclick='moveRowUp(this.parentElement.parentElement, 1);'>&#x1F819;</button>
function moveRowUp(row, firstRow) {
    let table = row.parentNode;
    if (row.rowIndex <= firstRow)
        return;

    table.insertBefore(row, table.rows[row.rowIndex - 1]);
}

// Move a table row down. Warning: does not modify the content so table content should not depend on order.  Also does not
// change underlying data from which the table was generated.
function moveRowDown(row) {
    let table = row.parentNode;
    if (row.rowIndex >= table.rows.length - 1)
        return;

    table.insertBefore(table.rows[row.rowIndex + 1], row);
}

/*
** Drawing utilities.
*/

// Draw a rounded rectangle path for stroking or filling.
function roundedRect(ctx, x, y, width, height, rounded) {
    const radiansInCircle = 2 * Math.PI
    const halfRadians = (2 * Math.PI) / 2
    const quarterRadians = (2 * Math.PI) / 4

    ctx.beginPath();
    ctx.arc(rounded + x, rounded + y, rounded, -quarterRadians, halfRadians, true);
    ctx.lineTo(x, y + height - rounded);
    ctx.arc(rounded + x, height - rounded + y, rounded, halfRadians, quarterRadians, true);
    ctx.lineTo(x + width - rounded, y + height);
    ctx.arc(x + width - rounded, y + height - rounded, rounded, quarterRadians, 0, true);
    ctx.lineTo(x + width, y + rounded);
    ctx.arc(x + width - rounded, y + rounded, rounded, 0, -quarterRadians, true);
    ctx.lineTo(x + rounded, y);
    ctx.closePath();
}

/*
** Mouse drag context helper.
*/

class DragContext {
    // Drag mode.
    static get NONE() { return 0;}
    static get MOVING() { return 1; }
    static get SIZING() { return 2; }

    constructor() {
        this.mode = DragContext.NONE;
        this.mouseDownX = null;
        this.mouseDownY = null;
        this.anchor = null;
        this.newObject = false;
    }
}

/*
** In-browser Video Labeler. Responsible for video rendering and user I/O.
*/
class ANUVidLib {
    // Constants.
    static get LEFT() { return 0; }
    static get RIGHT() { return 1; }
    static get BOTH() { return -1; }
    static get NONE() { return -2; }

    // Properties.
    get greyframes() { return this._greyframes; }
    set greyframes(value) { this._greyframes = value; this.redraw(); }
    get tiedframes() { return this._tiedframes; }
    set tiedframes(value) { this._tiedframes = value; }

    // Construct an ANUVidLib object with two canvases for displaying frames and text spans for showing status
    // information. Caches frames every second for faster feedback during scrubbing.
    constructor() {
        var self = this;

        this._greyframes = false;
        this._tiedframes = false;
        this.video = document.createElement("video");
        this.annotations = new AnnotationContainer();

        this.leftPanel = {
            side: ANUVidLib.LEFT,
            canvas: document.getElementById(LEFTCANVASNAME),
            slider: document.getElementById(LEFTSLIDERNAME),
            status: document.getElementById(LEFTSTATUSNAME),
            frame: new Image(),
            cachedGreyData: null,
            timestamp: null
        };
        this.leftPanel.frame.onload = function() { self.leftPanel.cachedGreyData = null; self.redraw(ANUVidLib.LEFT); };
        this.leftPanel.canvas.onmousemove = function(e) { self.mousemove(e, ANUVidLib.LEFT); }
        this.leftPanel.canvas.onmouseout = function(e) { self.mouseout(e, ANUVidLib.LEFT); }
        this.leftPanel.canvas.onmousedown = function(e) { self.mousedown(e, ANUVidLib.LEFT); }
        this.leftPanel.canvas.onmouseup = function(e) { self.mouseup(e, ANUVidLib.LEFT); }
        this.leftPanel.canvas.ondragstart = function(e) { return false; }

        this.rightPanel = {
            side: ANUVidLib.RIGHT,
            canvas: document.getElementById(RIGHTCANVASNAME),
            slider: document.getElementById(RIGHTSLIDERNAME),
            status: document.getElementById(RIGHTSTATUSNAME),
            frame: new Image(),
            cachedGreyData: null,
            timestamp: null
        };
        this.rightPanel.frame.onload = function() { self.rightPanel.cachedGreyData = null; self.redraw(ANUVidLib.RIGHT); };
        this.rightPanel.canvas.onmousemove = function(e) { self.mousemove(e, ANUVidLib.RIGHT); }
        this.rightPanel.canvas.onmouseout = function(e) { self.mouseout(e, ANUVidLib.RIGHT); }
        this.rightPanel.canvas.onmousedown = function(e) { self.mousedown(e, ANUVidLib.RIGHT); }
        this.rightPanel.canvas.onmouseup = function(e) { self.mouseup(e, ANUVidLib.RIGHT); }
        this.rightPanel.canvas.ondragstart = function(e) { return false; }

        this.leftPanel.other = this.rightPanel;
        this.rightPanel.other = this.leftPanel;

        this.activeObject = null;
        this.dragContext = new DragContext();

        this.bFrameCacheComplete = false;
        this.frameCache = [];   // array of images

        this.vidRequestQ = [];  // video queries (timestamp, who)

        this.video.addEventListener('loadeddata', function() {
            self.resize();
            self.leftPanel.slider.max = Math.floor(FPS * self.video.duration);
            self.leftPanel.slider.value = 0;
            self.leftPanel.timestamp = null;
            self.rightPanel.slider.max = Math.floor(FPS * self.video.duration);
            self.rightPanel.slider.value = 0;
            self.rightPanel.timestamp = null;

            self.annotations = new AnnotationContainer(Math.floor(FPS * self.video.duration));
            self.generateKeyframes(DEFAULTKEYFRAMES); // generate default keyframes indexes

            self.frameCache.length = Math.floor(self.video.duration); // space for 1 frame per second
            self.frameCache.fill(null);
            self.bFrameCacheComplete = false;

            self.seekToIndex(0, 0);
        }, false);

        this.video.addEventListener('error', function() {
            window.alert("ERROR: could not load video \"" + self.video.src + "\"");
            self.frameCache = [];
            self.annotations = new AnnotationContainer();
            self.leftPanel.frame = new Image();
            self.leftPanel.frame.onload = function() { self.leftPanel.cachedGreyData = null; self.redraw(ANUVidLib.LEFT); };
            self.leftPanel.cachedGreyData = null;
            self.rightPanel.frame = new Image();
            self.rightPanel.frame.onload = function() { self.rightPanel.cachedGreyData = null; self.redraw(ANUVidLib.RIGHT); };
            self.rightPanel.cachedGreyData = null;
            self.redraw(ANUVidLib.BOTH);
            self.leftPanel.status.innerHTML = "none";
            self.rightPanel.status.innerHTML = "none";
        }, false);

        this.video.addEventListener('seeked', function() {
            // extract the frame and redraw (triggered by onload)
            const canvas = document.createElement("canvas");
            canvas.width = self.video.videoWidth;
            canvas.height = self.video.videoHeight;
            canvas.getContext('2d').drawImage(self.video, 0, 0, canvas.width, canvas.height);

            // update the correct panel
            console.assert(self.vidRequestQ.length > 0, "something went wrong");
            if (self.vidRequestQ[0].who == ANUVidLib.LEFT) {
                self.leftPanel.frame.src = canvas.toDataURL("image/jpeg");
            } else if (self.vidRequestQ[0].who == ANUVidLib.RIGHT) {
                self.rightPanel.frame.src = canvas.toDataURL("image/jpeg");
            }

            // cache frame if on one second boundary
            if (self.video.currentTime == Math.floor(self.video.currentTime)) {
                //console.log("caching frame at " + self.video.currentTime + " seconds");
                self.frameCache[self.video.currentTime] = canvas.toDataURL("image/jpeg");
            }

            // trigger next video query if there is one
            self.vidRequestQ.shift();
            if (self.vidRequestQ.length > 0) {
                self.video.currentTime = self.vidRequestQ[0].timestamp;
            }
        }, false);

        this.resize();
        window.addEventListener('resize', function() { self.resize(); }, false);
    }

    // Load a new video file. Resets data once loaded.
    loadVideo(fileURL) {
        this.video.src = fileURL;
        clearclips();
    }

    // Convert between indices and timestamps.
    indx2time(index) { return index / FPS; }
    time2indx(timestamp) { return Math.round(FPS * timestamp); }

    // Seek to a specific index in the video. A negative number means don't update unless tied.
    seekToIndex(leftIndex, rightIndex) {
        console.assert((leftIndex >= 0) || (rightIndex >= 0));
        if (isNaN(this.video.duration)) {
            this.leftPanel.status.innerHTML = "none";
            this.rightPanel.status.innerHTML = "none";
            return;
        }

        // deal with tied sliders
        if (this._tiedframes) {
            if (leftIndex < 0) {
                leftIndex = rightIndex - this.time2indx(this.rightPanel.timestamp) + this.time2indx(this.leftPanel.timestamp);
                // check we haven't gone past video boundary
                if ((leftIndex < 0) || (leftIndex > Math.floor(FPS * this.video.duration))) {
                    leftIndex = Math.floor(Math.min(Math.max(0, leftIndex), FPS * this.video.duration), 0);
                    rightIndex = leftIndex - this.time2indx(this.leftPanel.timestamp) + this.time2indx(this.rightPanel.timestamp);
                    this.rightPanel.slider.value = rightIndex;
                }
                this.leftPanel.slider.value = leftIndex;
            } else if (rightIndex < 0) {
                rightIndex = leftIndex - this.time2indx(this.leftPanel.timestamp) + this.time2indx(this.rightPanel.timestamp);
                // check we haven't gone past video boundary
                if ((rightIndex < 0) || (rightIndex > Math.floor(FPS * this.video.duration))) {
                    rightIndex = Math.floor(Math.min(Math.max(0, rightIndex), FPS * this.video.duration), 0);
                    leftIndex = rightIndex - this.time2indx(this.rightPanel.timestamp) + this.time2indx(this.leftPanel.timestamp);
                    this.leftPanel.slider.value = leftIndex;
                }
                this.rightPanel.slider.value = rightIndex;
            }
        }

        this.vidRequestQ = []
        if (leftIndex >= 0) {
            const index = Math.floor(Math.min(Math.max(0, leftIndex), FPS * this.video.duration), 0);
            const ts = this.indx2time(index);
            if ((index % FPS == 0) && (this.frameCache[ts] != null)) {
                this.leftPanel.frame.src = this.frameCache[ts];
            } else {
                this.vidRequestQ.push({timestamp: ts, who: ANUVidLib.LEFT});
            }

            this.leftPanel.timestamp = ts;
            this.leftPanel.status.innerHTML = ts.toFixed(2) + " / " + this.video.duration.toFixed(2) + "s [" +
                this.video.videoWidth + "-by-" + this.video.videoHeight + "]";
        }

        if (rightIndex >= 0) {
            const index = Math.floor(Math.min(Math.max(0, rightIndex), FPS * this.video.duration), 0);
            const ts = this.indx2time(index);
            if ((index % FPS == 0) && (this.frameCache[ts] != null)) {
                this.rightPanel.frame.src = this.frameCache[ts];
            } else {
                this.vidRequestQ.push({timestamp: ts, who: ANUVidLib.RIGHT});
            }

            this.rightPanel.timestamp = ts;
            this.rightPanel.status.innerHTML = ts.toFixed(2) + " / " + this.video.duration.toFixed(2) + "s [" +
                this.video.videoWidth + "-by-" + this.video.videoHeight + "]";
        }

        // add remaining frames at one-second boundaries for caching
        if (!this.bFrameCacheComplete) {
            this.bFrameCacheComplete = true;
            for (var i = 0; i < this.video.duration; i++) {
                if (this.frameCache[i] == null) {
                    this.bFrameCacheComplete = false;
                    this.vidRequestQ.push({timestamp: i, who: ANUVidLib.NONE});
                }
            }

            if (this.bFrameCacheComplete) console.log("...finished caching frames")
        }

        // trigger first video request
        if (this.vidRequestQ.length > 0) {
            this.video.currentTime = this.vidRequestQ[0].timestamp;
        }
    }

    // Seek to a specific timestamp in the video. A negative number means don't update unless tied.
    seekToTime(leftTime, rightTime, bUpdateSliders = true) {
        var leftIndex = this.time2indx(leftTime);
        var rightIndex = this.time2indx(rightTime);
        this.leftPanel.slider.value = leftIndex;
        this.rightPanel.slider.value = rightIndex;
        return this.seekToIndex(leftIndex, rightIndex);
    }

    // Swap left and right panels. Same effect as seekToTime(this.rightPanel.timestamp, this.leftPanel.timestamp, true)
    // but faster since no video seek is required.
    swap() {
        //this.seekToTime(this.rightPanel.timestamp, this.leftPanel.timestamp, true);
        //return;

        var tmp = this.leftPanel.frame.src;
        this.leftPanel.frame.src = this.rightPanel.frame.src;
        this.rightPanel.frame.src = tmp;

        tmp = this.leftPanel.timestamp;
        this.leftPanel.timestamp = this.rightPanel.timestamp;
        this.rightPanel.timestamp = tmp;

        this.leftPanel.slider.value = this.time2indx(this.leftPanel.timestamp);
        this.rightPanel.slider.value = this.time2indx(this.rightPanel.timestamp);

        //this.redraw();
    }

    // Resize left and right canvas when window size changes of new video is loaded.
    resize() {
        this.leftPanel.canvas.width = this.leftPanel.canvas.parentNode.clientWidth;
        if (isNaN(this.video.duration)) {
            this.leftPanel.canvas.height = 9 / 16 * this.leftPanel.canvas.width;
        } else {
            this.leftPanel.canvas.height = Math.floor(this.leftPanel.canvas.width * this.video.videoHeight / this.video.videoWidth);
        }
        this.rightPanel.canvas.width = this.leftPanel.canvas.width;
        this.rightPanel.canvas.height = this.leftPanel.canvas.height;

        this.leftPanel.cachedGreyData = null;
        this.rightPanel.cachedGreyData = null;
        this.redraw();
    }

    // Redraw frames and annotations. Parameter 'side' can be LEFT, RIGHT or BOTH.
    redraw(side = ANUVidLib.BOTH) {
        if (side == ANUVidLib.BOTH) {
            this.redraw(ANUVidLib.LEFT);
            this.redraw(ANUVidLib.RIGHT);
            return;
        }

        console.assert((side == ANUVidLib.LEFT) || (side == ANUVidLib.RIGHT), "invalid side")

        // draw left frame
        if (side == ANUVidLib.LEFT) {
            this.paint(this.leftPanel);
            this.refreshObjTable(this.leftPanel);
        }

        // draw right frame
        if (side == ANUVidLib.RIGHT) {
            this.paint(this.rightPanel);
            this.refreshObjTable(this.rightPanel);
        }
    }

    // Draw a frame and it's annotations.
    paint(panel) {
        // draw frame
        var context = panel.canvas.getContext('2d');
        if ((panel.frame != null) && (panel.frame.width > 0) && (panel.frame.height > 0)) {

            if (this.greyframes && (panel.cachedGreyData != null)) {
                context.putImageData(panel.cachedGreyData, 0, 0);
            } else {
                context.drawImage(panel.frame, 0, 0, panel.canvas.width, panel.canvas.height);

                if (this.greyframes) {
                    panel.cachedGreyData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
                    let pixels = panel.cachedGreyData.data;
                    for (var i = 0; i < pixels.length; i += 4) {
                        let intensity = parseInt(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
                        pixels[i] = intensity; pixels[i + 1] = intensity; pixels[i + 2] = intensity;
                    }
                    context.putImageData(panel.cachedGreyData, 0, 0);
                }
            }
        } else {
            context.clearRect(0, 0, panel.canvas.width, panel.canvas.height);
        }

        // draw objects
        this.annotations.draw(context, this.time2indx(panel.timestamp), this.activeObject);

        // draw border
        context.lineWidth = 7; context.strokeStyle = "#ffffff";
        roundedRect(context, 0, -2, panel.canvas.width, panel.canvas.height + 5, 9);
        context.stroke();
        context.lineWidth = 5; context.strokeStyle = "#000000";
        context.strokeRect(0, -2, panel.canvas.width, panel.canvas.height + 5);
        roundedRect(context, 0, -2, panel.canvas.width, panel.canvas.height + 5, 9);
        context.stroke();

        // update status
        if (panel.timestamp == null) {
            panel.status.innerHTML = "none";
        } else {
            panel.status.innerHTML = panel.timestamp.toFixed(2) + " / " + this.video.duration.toFixed(2) + "s [" +
                this.video.videoWidth + "-by-" + this.video.videoHeight + "]";
        }
    }

    // Copy objects from source frame to target frame.
    copy(srcSide, tgtSide, overwrite) {
        const srcPanel = (srcSide == ANUVidLib.LEFT) ? this.leftPanel : this.rightPanel;
        const tgtPanel = (tgtSide == ANUVidLib.LEFT) ? this.leftPanel : this.rightPanel;
        const srcIndex = this.time2indx(srcPanel.timestamp);
        const tgtIndex = this.time2indx(tgtPanel.timestamp);
        if (srcIndex == tgtIndex)
            return;

        this.annotations.copy(srcIndex, tgtIndex, overwrite);
        this.redraw(tgtSide);
    }

    // Refresh list of objects for the given panel.
    refreshObjTable(panel) {
        // get object list and table reference
        const frameIndex = this.time2indx(panel.timestamp);
        var table = document.getElementById(panel.side == ANUVidLib.LEFT ? LEFTOBJTBLNAME : RIGHTOBJTBLNAME);

        // delete all rows (except header)
        for (var i = table.rows.length - 1; i >= 1; i--) {
            table.deleteRow(i);
        }

        // TODO: cleanup below; helper function for inputs

        // add objects
        const self = this;  // for callbacks
        const width = self.video.videoWidth;
        const height = self.video.videoHeight;

        const objects = this.annotations.objectList[frameIndex];
        for (var i = 0; i < objects.length; i++) {
            let obj = objects[i];   // for callbacks

            var row = table.insertRow(-1);

            // x
            var input = document.createElement("input"); input.type = "text";
            input.value = Math.round(objects[i].x * width);
            input.onkeypress = function(event) { defocusOnEnter(event); }
            input.onblur = function(event) { obj.x = event.srcElement.value / width; self.paint(panel); self.paint(panel.other); };
            row.insertCell(0).appendChild(input);

            // y
            input = document.createElement("input"); input.type = "text";
            input.value = Math.round(objects[i].y * height);
            input.onkeypress = function(event) { defocusOnEnter(event); }
            input.onblur = function(event) { obj.y = event.srcElement.value / height; self.paint(panel); self.paint(panel.other); };
            row.insertCell(1).appendChild(input);

            // width
            input = document.createElement("input"); input.type = "text";
            input.value = Math.round(objects[i].width * width);
            input.onkeypress = function(event) { defocusOnEnter(event); }
            input.onblur = function(event) { obj.width = event.srcElement.value / width; self.paint(panel); self.paint(panel.other);};
            row.insertCell(2).appendChild(input);

            // height
            input = document.createElement("input"); input.type = "text";
            input.value = Math.round(objects[i].height * height);
            input.onkeypress = function(event) { defocusOnEnter(event); }
            input.onblur = function(event) { obj.height = event.srcElement.value / height; self.paint(panel); self.paint(panel.other); };
            row.insertCell(3).appendChild(input);

            // label
            input = document.createElement("select");
            input.style.width = "100%";
            for (var k in this.annotations.lblConfig.objectLabels) {
                var opt = document.createElement("option");
                opt.textContent = String(k);
                opt.value = String(k);
                input.appendChild(opt);
            }
            input.value = objects[i].labelId;
            input.onkeypress = function(event) { defocusOnEnter(event); }
            input.onblur = function(event) { obj.labelId = event.srcElement.value; self.paint(panel); self.paint(panel.other); };
            row.insertCell(4).appendChild(input);

            // instance id
            input = document.createElement("input"); input.type = "text";
            input.value = objects[i].instanceId;
            input.onkeypress = function(event) { defocusOnEnter(event); }
            input.onblur = function(event) { obj.instanceId = event.srcElement.value; self.paint(panel); self.paint(panel.other); };
            row.insertCell(5).appendChild(input);

            // colour
            input = document.createElement("input"); input.type = "text";
            input.value = objects[i].colour;
            input.onkeypress = function(event) { defocusOnEnter(event); }
            input.onblur = function(event) { obj.colour = event.srcElement.value; self.paint(panel); self.paint(panel.other); };
            row.insertCell(6).appendChild(input);

            // score
            input = document.createElement("input"); input.type = "text";
            input.value = objects[i].score;
            input.onkeypress = function(event) { defocusOnEnter(event); }
            input.onblur = function(event) { obj.score = event.srcElement.value; self.paint(panel); self.paint(panel.other); };
            row.insertCell(7).appendChild(input);

            var cell = row.insertCell(8);
            cell.innerHTML = "<button title='delete' onclick='v.annotations.objectList[" + frameIndex +
                "].splice(this.parentElement.parentElement.rowIndex - 1, 1); v.redraw();'>&#x2718;</button>";
            cell.innerHTML += " <button title='move up' onclick='v.annotations.swapObjects(" + frameIndex + "," +
                i + "," + frameIndex + "," + (i - 1) + "); v.redraw();'>&#x1F819;</button>";
            cell.innerHTML += " <button title='move down' onclick='v.annotations.swapObjects(" + frameIndex + "," +
                i + "," + frameIndex + "," + (i + 1) + "); v.redraw();'>&#x1F81B;</button>";
            cell.style.textAlign = "right";
        }
    }

    // Generate keyframes are regular interval. If delta is null then requests time interval from user.
    generateKeyframes(delta = null) {
        if (delta == null) {
            var retVal = prompt("Generate keyframe every how many seconds?", DEFAULTKEYFRAMES);
            if (retVal == null) return false;
            delta = parseFloat(retVal);
        }
        delta = Math.round(FPS * delta) / FPS;
        if (delta <= 0)
            return false;

        this.annotations.keyframes = [];
        var ts = 0.0;
        while (ts < this.video.duration) {
            this.annotations.keyframes.push(ts);
            ts += delta;
        }

        // TODO: better keyframe visualisation
        var el = document.getElementById("keyframeListId");
        if (this.annotations.keyframes.length == 0) {
            el.innerHTML = "(no keyframes)";
            return;
        }
        el.innerHTML = "";
        for (var i = 0; i < this.annotations.keyframes.length; i++) {
            if (i > 0) el.innerHTML += ", ";
            el.innerHTML += this.annotations.keyframes[i];
        }

        return true;
    }

    nextKeyframe() {
        // find next keyframe (based on right panel)
        var i = 1;
        while ((i < this.annotations.keyframes.length) && (this.annotations.keyframes[i] <= this.rightPanel.timestamp)) {
            i += 1;
        }

        if (i < this.annotations.keyframes.length) {
            this.seekToTime(this.annotations.keyframes[i - 1], this.annotations.keyframes[i]);
            return true;
        }

        return false;
    }

    prevKeyframe() {
        // find previous keyframe (based on left panel)
        var i = 0;
        while ((i < this.annotations.keyframes.length) && (this.annotations.keyframes[i] < this.leftPanel.timestamp)) {
            i += 1;
        }

        if (i < this.annotations.keyframes.length) {
            this.seekToTime(i == 0 ? 0.0 : this.annotations.keyframes[i - 1], this.annotations.keyframes[i]);
            return true;
        }

        return false;
    }

    // Clear object annotations for the current frame.
    clearObjects(side) {
        let frameIndex = v.time2indx(side == ANUVidLib.LEFT ? this.leftPanel.timestamp : this.rightPanel.timestamp);
        this.annotations.objectList[frameIndex] = [];
        this.redraw(ANUVidLib.BOTH);
    }

    // Get active object at position (x, y) on given panel.
    findActiveObject(x, y, panel) {
        const frameIndex = this.time2indx(panel.timestamp);
        for (var i = this.annotations.objectList[frameIndex].length - 1; i >= 0; i--) {
            if (this.annotations.objectList[frameIndex][i].nearBoundary(x, y, panel.canvas.width, panel.canvas.height)) {
                return this.annotations.objectList[frameIndex][i];
            }
        }

        return null;
    }

    // Delete the active object (as long as it's not being modified).
    deleteActiveObject() {
        if ((this.activeObject != null) && (this.dragContext.mode == DragContext.NONE)) {
            var frameIndex = this.time2indx(this.leftPanel.timestamp);
            for (var i = 0; i < this.annotations.objectList[frameIndex].length; i++) {
                if (this.annotations.objectList[frameIndex][i] === this.activeObject) {
                    this.annotations.objectList[frameIndex].splice(i, 1);
                    break;
                }
            }
            frameIndex = this.time2indx(this.rightPanel.timestamp);
            for (var i = 0; i < this.annotations.objectList[frameIndex].length; i++) {
                if (this.annotations.objectList[frameIndex][i] === this.activeObject) {
                    this.annotations.objectList[frameIndex].splice(i, 1);
                    break;
                }
            }

            this.activeObject = null;
            this.redraw();
        }
    }

    // Process mouse movement over a panel.
    mousemove(event, side) {
        console.assert((side == ANUVidLib.LEFT) || (side == ANUVidLib.RIGHT), "invalid side");
        //console.log("mouse moving in " + ((side == ANUVidLib.LEFT) ? "left" : "right"));

        // get current panel
        const panel = (side == ANUVidLib.LEFT) ? this.leftPanel : this.rightPanel;

        // handle dragging
        if (this.dragContext.mode == DragContext.MOVING) {
            this.activeObject.x += event.movementX / panel.canvas.width;
            this.activeObject.y += event.movementY / panel.canvas.height;
            this.paint(panel);
            if (this.leftPanel.timestamp == this.rightPanel.timestamp) {
                this.paint(panel.other);
            }
            return;
        }

        if (this.dragContext.mode == DragContext.SIZING) {
            const x = this.dragContext.anchor.u / panel.canvas.width;
            const y = this.dragContext.anchor.v / panel.canvas.height;
            const w = event.movementX / panel.canvas.width + ((x > this.activeObject.x) ? -this.activeObject.width : this.activeObject.width);
            const h = event.movementY / panel.canvas.height + ((y > this.activeObject.y) ? -this.activeObject.height : this.activeObject.height);
            this.activeObject.resize(x, y, w, h);
            this.paint(panel);
            if (this.leftPanel.timestamp == this.rightPanel.timestamp) {
                this.paint(panel.other);
            }
            return;
        }

        // search for an active object
        const lastActiveObject = this.activeObject;
        this.activeObject = this.findActiveObject(event.offsetX, event.offsetY, panel);

        // update cursor
        panel.canvas.style.cursor = (this.activeObject) ? "pointer" : "auto";

        // TODO: experimenting
        if (this.activeObject) {
            var el = document.getElementById(OBJINFOPOPUP);
            el.style.display = 'block';
            el.style.left = ((event.x - event.offsetX) + this.activeObject.x * panel.canvas.width) + "px";
            el.style.top = ((event.y - event.offsetY) + (this.activeObject.y + this.activeObject.height) * panel.canvas.height + 8) + "px";
        } else {
            var el = document.getElementById(OBJINFOPOPUP);
            el.style.display = 'none';
        }

        // repaint if the active object changed
        if (this.activeObject != lastActiveObject) {
            this.paint(panel);
        }
    }

    // Process mouse leaving a panel.
    mouseout(event, side) {
        this.dragContext.mode = DragContext.NONE;
        if (this.activeObject != null) {
            this.activeObject = null;
            this.paint((side == ANUVidLib.LEFT) ? this.leftPanel : this.rightPanel);
            if (this.leftPanel.timestamp == this.rightPanel.timestamp) {
                this.paint((side == ANUVidLib.RIGHT) ? this.leftPanel : this.rightPanel);
            }
        }
    }

    // Process mouse button press inside panel.
    mousedown(event, side) {
        // TODO: experimenting
        var el = document.getElementById(OBJINFOPOPUP);
        el.style.display = 'none';

        // search for an active object
        const panel = (side == ANUVidLib.LEFT) ? this.leftPanel : this.rightPanel;
        this.activeObject = this.findActiveObject(event.offsetX, event.offsetY, panel);

        if ((this.activeObject != null) && (!event.shiftKey)) {
            // resize active object
            this.dragContext.anchor = this.activeObject.oppositeAnchor(event.offsetX, event.offsetY, panel.canvas.width, panel.canvas.height);
            if (this.dragContext.anchor == null) {
                this.dragContext.mode = DragContext.MOVING;
            } else {
                this.dragContext.mode = DragContext.SIZING;
            }
            this.dragContext.newObject = false;
        } else {
            // add new object
            const frameIndex = this.time2indx(panel.timestamp);
            if (this.activeObject != null) {
                this.activeObject = this.activeObject.clone();
                this.dragContext.mode = DragContext.MOVING;
            } else {
                this.activeObject = new ObjectBox(event.offsetX / panel.canvas.width, event.offsetY / panel.canvas.height, 0, 0);
                this.dragContext.mode = DragContext.SIZING;
            }
            this.annotations.objectList[frameIndex].push(this.activeObject);
            this.dragContext.anchor = this.activeObject.oppositeAnchor(event.offsetX, event.offsetY, panel.canvas.width, panel.canvas.height);
            this.dragContext.newObject = true;
        }

        this.dragContext.mouseDownX = event.offsetX;
        this.dragContext.mouseDownY = event.offsetY;
    }

    // Process mouse button press inside panel.
    mouseup(event, side) {
        this.dragContext.mode = DragContext.NONE;

        if (this.activeObject != null) {
            if (this.dragContext.newObject) {
                // delete mouse hasn't moved
                if ((event.offsetX == this.dragContext.mouseDownX) && (event.offsetY == this.dragContext.mouseDownY)) {
                    //console.log("removing new object");
                    const frameIndex = this.time2indx(side == ANUVidLib.LEFT ? this.leftPanel.timestamp : this.rightPanel.timestamp);
                    this.annotations.objectList[frameIndex].pop();
                    this.dragContext.newObject = false;
                }
            }

            //this.activeObject = null;
            this.redraw(this.leftPanel.timestamp == this.rightPanel.timestamp ? ANUVidLib.BOTH : side);

            // set focus of next component
            if (this.dragContext.newObject) {
                var tbl = document.getElementById(side == ANUVidLib.LEFT ? LEFTOBJTBLNAME : RIGHTOBJTBLNAME);
                tbl.rows[tbl.rows.length - 1].cells[4].firstElementChild.focus();
            }
        }
    }
}

/*
** Annotation Utility Functions
*/

function newclip() {
    var table = document.getElementById(VIDSEGTABLENAME);
    addclip(table, v.leftPanel.timestamp, v.rightPanel.timestamp);
}

function addclip(table, ts_start, ts_end, actionId=null, description="", focus=true) {
    var row = table.insertRow(-1);
    row.insertCell(0).innerHTML = ts_start;
    row.insertCell(1).innerHTML = ts_end;

    var select = document.createElement("select");
    select.classList.add("segdesc"); select.style.width = "100%";
    for (var k in v.annotations.lblConfig.actionLabels) {
        var opt = document.createElement("option");
        opt.textContent = String(k);
        opt.value = String(k);
        select.appendChild(opt);
    }
    select.value = actionId;
    row.insertCell(2).appendChild(select);

    var input = document.createElement("input");
    input.type = "text"; input.classList.add("segdesc"); input.value = description;
    parent = row.insertCell(3);
    parent.appendChild(input);
    var cell = row.insertCell(4);
    cell.innerHTML = "<button title='delete' onclick='delclip(this.parentElement.parentElement);'>&#x2718;</button>";
    cell.innerHTML += " <button title='move up' onclick='moveRowUp(this.parentElement.parentElement, 1);'>&#x1F819;</button>";
    cell.innerHTML += " <button title='move down' onclick='moveRowDown(this.parentElement.parentElement);'>&#x1F81B;</button>";
    cell.innerHTML += " <button title='goto' onclick='v.seekToTime(" + ts_start + ", " + ts_end + ", true);'>&#x270E;</button>";
    cell.style.textAlign = "right";
    input.onkeypress = function(event) { defocusOnEnter(event, document.getElementById(LEFTSLIDERNAME)); }
    if (focus) input.focus();
}

function delclip(row) {
    var table = document.getElementById(VIDSEGTABLENAME);
    table.deleteRow(row.rowIndex);
}

function clearclips() {
    var table = document.getElementById(VIDSEGTABLENAME);
    for (var i = table.rows.length - 1; i > 0; i--) {
        table.deleteRow(i);
    }
}

function sortclips(ascending = true) {
    // extract start and end times from segement
    var table = document.getElementById(VIDSEGTABLENAME);
    var data = [];
    for (var i = 1; i < table.rows.length; i++) {
        data.push({s: table.rows[i].cells.item(0).innerHTML, t: table.rows[i].cells.item(1).innerHTML,
            v: table.rows[i].cells.item(2).firstElementChild.value});
    }

    // sort
    data.sort(function(a, b){if (a.s == b.s) return a.t - b.t; return a.s - b.s;});
    if (!ascending) {
        data.reverse();
    }

    // repopulate the table
    clearclips();
    for (var i = 0; i < data.length; i++) {
        addclip(table, data[i].s, data[i].t, data[i].v, false);
    }
}