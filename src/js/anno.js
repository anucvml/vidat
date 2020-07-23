/*******************************************************************************
 ** ANUVIDLIB: A Javascript library for browser-based video annotation.
 ** Copyright (C) 2020, Stephen Gould <stephen.gould@anu.edu.au>
 **
 ** Classes representing annotation types.
 *******************************************************************************/

const PROXIMITY = 5    // proximity in pixels for active object/keypoint

/* Frame Objects -------------------------------------------------------------*/

// Object bounding box representation. Coordinates between 0 and 1, where 1
// is the width or height of the image frame. Input argument must have fields
// x, y, width and height. May also have labelId, instanceId, colour and score.
class ObjectBox {
    constructor (json) {
        this.resize(json.x, json.y, json.width, json.height)

        this.labelId = ('labelId' in json) ? json.labelId : null
        this.instanceId = ('instanceId' in json) ? json.instanceId : null
        this.colour = ('colour' in json) ? json.colour : null
        this.score = ('score' in json) ? json.score : null
    }

    // Create a clone of this object.
    clone () {
        const obj = new ObjectBox(this)
        return obj
    }

    // Update box size.
    resize (x, y, w, h) {
        if (w < 0) {
            this.x = x + w
            this.width = -w
        } else {
            this.x = x
            this.width = w
        }

        if (h < 0) {
            this.y = y + h
            this.height = -h
        } else {
            this.y = y
            this.height = h
        }
    }

    // Draw the object onto a canvas (context). Highlight to provide visual indication of selected.
    draw (ctx, colourTable = null, highlight = false) {
        const lineWidth = highlight ? 3 : 1

        const u = this.x * ctx.canvas.width
        const v = this.y * ctx.canvas.height
        const w = this.width * ctx.canvas.width
        const h = this.height * ctx.canvas.height

        let colour = '#00ff00'
        if ((this.colour != null) && (this.colour != '')) {
            colour = this.colour
        } else if (this.labelId in colourTable) {
            colour = colourTable[this.labelId]
        }

        ctx.lineWidth = lineWidth + 2
        ctx.strokeStyle = '#000000'
        ctx.strokeRect(u, v, w, h)
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = colour
        ctx.strokeRect(u, v, w, h)

        const handle = 8
        if ((w > handle) && (h > handle)) {
            ctx.beginPath()
            ctx.moveTo(u, v + handle)
            ctx.lineTo(u, v)
            ctx.lineTo(u + handle, v)
            ctx.moveTo(u, v + h - handle)
            ctx.lineTo(u, v + h)
            ctx.lineTo(u + handle, v + h)
            ctx.moveTo(u + w, v + handle)
            ctx.lineTo(u + w, v)
            ctx.lineTo(u + w - handle, v)
            ctx.moveTo(u + w, v + h - handle)
            ctx.lineTo(u + w, v + h)
            ctx.lineTo(u + w - handle, v + h)
            ctx.lineWidth = lineWidth + 4
            ctx.strokeStyle = '#000000'
            ctx.stroke()
            ctx.lineWidth = lineWidth + 2
            ctx.strokeStyle = colour
            ctx.stroke()
        }
    }

    // Check if mouse is positioned near boundary of the box at the given image scale.
    nearBoundary (u, v, sx, sy) {
        if (((Math.abs(u - sx * this.x) <= PROXIMITY) || (Math.abs(u - sx * (this.x + this.width)) <= PROXIMITY)) &&
            (v - sy * this.y + PROXIMITY >= 0) && (sy * (this.y + this.height) - v + PROXIMITY >= 0))
            return true

        if (((Math.abs(v - sy * this.y) <= PROXIMITY) || (Math.abs(v - sy * (this.y + this.height)) <= PROXIMITY)) &&
            (u - sx * this.x + PROXIMITY >= 0) && (sx * (this.x + this.width) - u + PROXIMITY >= 0))
            return true

        return false
    }

    // Check if mouse is positioned near an anchor point, i.e., box corner, at the given image scale.
    nearAnchor (u, v, sx, sy) {
        if (((Math.abs(u - sx * this.x) <= PROXIMITY) || (Math.abs(u - sx * (this.x + this.width)) <= PROXIMITY)) &&
            ((Math.abs(v - sy * this.y) <= PROXIMITY) || (Math.abs(v - sy * (this.y + this.height)) <= PROXIMITY)))
            return true

        return false
    }

    // Return the opposite anchor (in pixels) to the nearest anchor point (or null if no anchor point is near).
    oppositeAnchor (u, v, sx, sy) {
        if ((Math.abs(u - sx * this.x) <= PROXIMITY) && (Math.abs(v - sy * this.y) <= PROXIMITY)) {
            return { u: sx * (this.x + this.width), v: sy * (this.y + this.height) }
        }
        if ((Math.abs(u - sx * this.x) <= PROXIMITY) && (Math.abs(v - sy * (this.y + this.height)) <= PROXIMITY)) {
            return { u: sx * (this.x + this.width), v: sy * this.y }
        }
        if ((Math.abs(u - sx * (this.x + this.width)) <= PROXIMITY) && (Math.abs(v - sy * this.y) <= PROXIMITY)) {
            return { u: sx * this.x, v: sy * (this.y + this.height) }
        }
        if ((Math.abs(u - sx * (this.x + this.width)) <= PROXIMITY) &&
            (Math.abs(v - sy * (this.y + this.height)) <= PROXIMITY)) {
            return { u: sx * this.x, v: sy * this.y }
        }

        return null
    }
}

/* Video Objects -------------------------------------------------------------*/

class VidSegment {
    constructor (json) {
        this.start = json.start
        this.end = json.end
        this.actionId = 'actionId' in json ? json.actionId : null
        this.description = 'description' in json ? json.description : ''
    }
}

/* Label Configuration -------------------------------------------------------*/

class LabelConfig {
    constructor (json = null) {
        this.actionLabels = ((json != null) && ('actionLabels' in json)) ? json.actionLabels : {}
        this.objectLabels = ((json != null) && ('objectLabels' in json)) ? json.objectLabels : {}

        // TODO: defaults for testing
        if (json == null) {
            this.actionLabels = {
                '<none>': '#00ff00',
                walk: '#ff0000',
                run: '#ffff00',
                swim: '#0000ff',
                fly: '#00ffff',
            }

            this.objectLabels = {
                '<none>': '#00ff00',
                person: '#ff0000',
                car: '#0000ff',
                bicycle: '#ff00ff',
            }
        }
    }

    // Load from file. Prompts for filename. Invoke callback when done. Accepts files saved by corresponding 'save'
    // method or files saved by the AnnotationContainer where the configuration is under the `lblConfig` field.
    load (callback = null) {
        const dlg = document.createElement('input')
        dlg.type = 'file'
        dlg.onchange = e => {
            let file = e.target.files[0]
            const reader = new FileReader()

            reader.onload = readerEvent => {
                const content = readerEvent.target.result
                let cfg = JSON.parse(content)

                // if annotation container file pull configuration from lblConfig
                if ('lblConfig' in cfg) {
                    cfg = cfg.lblConfig
                }

                // extract action and object labels if available
                if ('actionLabels' in cfg) {
                    this.actionLabels = cfg.actionLabels
                }
                if ('objectLabels' in cfg) {
                    this.objectLabels = cfg.objectLabels
                }

                if (callback != null)
                    callback()
            }

            reader.readAsText(file, 'UTF-8')
        }

        dlg.click()
    }

    // Save to file. Prompts for filename.
    save () {
        const filename = window.prompt('Enter configuration filename for saving:', 'config.txt')
        if ((filename == null) || (filename == ''))
            return

        const a = document.createElement('a')
        const file = new Blob([JSON.stringify(this)], { type: 'text/plain' })
        a.href = URL.createObjectURL(file)
        a.download = filename
        //a.target = "_blank";
        a.click()
        URL.revokeObjectURL(a.href)
    }

    // Convert actionLabels or objectLabels to a string. Parameter 'dict' should be one of
    // this.actionLabels or this.objectLabels.
    toString (dict) {
        let str = ''
        for (const k in dict) {
            str += String(k) + ': ' + dict[k] + '\n'
        }
        return str
    }

    // Creates a dictionary from a string of the form "<id>: <colour>\n ..."
    fromString (str) {
        const dict = {}
        const lines = str.split('\n')
        for (let i = 0; i < lines.length; i++) {
            const pair = lines[i].split(':')
            if (pair.length != 2) continue
            dict[pair[0].trim()] = pair[1].trim()
        }

        return dict
    }
}

/* Annotation Container ------------------------------------------------------*/

/*
** Holds all annotations for a given video. And provides utility functions.
*/

class AnnotationContainer {
    constructor (owner, numFrames = 0) {
        this.owner = owner                     // ANUVidLib object containing these annotations

        this.keyframes = []        // array of keyframe timestamps (in seconds)
        this.objectList = [[]]     // array of array of objects
        this.vidSegList = []       // array of temporal segments (action clips)

        if (numFrames > 0) {
            this.objectList.length = numFrames
            this.clearObjects()
        }
    }

    // Clear all annotations.
    clear () {
        this.keyframes = []
        this.clearObjects()
        this.clearVidSegs()
    }

    // Loads from file. Prompts for filename. Invokes callback after loaded.
    load (callback = null) {
        const dlg = document.createElement('input')
        dlg.type = 'file'
        dlg.onchange = e => {
            let file = e.target.files[0]
            const reader = new FileReader()

            reader.onload = readerEvent => {
                const content = readerEvent.target.result
                const json = JSON.parse(content)

                if ('lblConfig' in json)
                    this.owner.lblConfig = new LabelConfig(json.lblConfig)
                if ('keyframes' in json)
                    this.keyframes = json.keyframes
                if ('objectList' in json) {
                    this.clearObjects()
                    for (let i = 0; i < json.objectList.length; i++) {
                        const indx = this.owner.time2indx(json.objectList[i].ts)
                        if ((indx >= 0) && (indx < this.objectList.length)) {
                            for (let j = 0; j < json.objectList[i].objects.length; j++) {
                                this.objectList[indx].push(new ObjectBox(json.objectList[i].objects[j]))
                            }
                        }
                    }
                }
                if ('vidSegList' in json) {
                    this.clearVidSegs()
                    for (let i = 0; i < json.vidSegList.length; i++) {
                        if ((json.vidSegList[i].start >= 0) && (json.vidSegList[i].end <= this.owner.video.duration)) {
                            this.vidSegList.push(new VidSegment(json.vidSegList[i]))
                        }
                    }
                }

                if (callback != null)
                    callback()
            }

            reader.readAsText(file, 'UTF-8')
        }

        // invoke the save
        dlg.click()
    }

    // Save to file. Prompts for filename.
    save () {
        const filename = window.prompt('Enter configuration filename for saving:', 'annotations.txt')
        if ((filename == null) || (filename == ''))
            return

        // create object for saving
        const json = {
            version: this.owner.prefs.version,
            lblConfig: this.owner.lblConfig,
            keyframes: this.keyframes,
            objectList: [],
            vidSegList: this.vidSegList,
        }
        for (let i = 0; i < this.objectList.length; i++) {
            if (this.objectList[i].length > 0) {
                const ts = this.owner.indx2time(i)
                json.objectList.push({ ts: this.owner.indx2time(i), objects: this.objectList[i] })
            }
        }

        const a = document.createElement('a')
        const file = new Blob([JSON.stringify(json)], { type: 'text/plain' })
        a.href = URL.createObjectURL(file)
        a.download = filename
        //a.target = "_blank";
        a.click()
        URL.revokeObjectURL(a.href)
    }

    // Copy annotations from source frame to target frame.
    copy (srcIndex, tgtIndex, overwrite) {
        if (srcIndex == tgtIndex)
            return false

        if (overwrite) {
            this.objectList[tgtIndex] = []
        }

        for (let i = 0; i < this.objectList[srcIndex].length; i++) {
            this.objectList[tgtIndex].push(this.objectList[srcIndex][i].clone())
        }

        return true
    }

    // Draw frame-based annotations onto the given context.
    draw (ctx, frameIndex, activeObject = null) {

        // draw bounding box objects
        const colourTable = this.owner.lblConfig.objectLabels
        for (let i = 0; i < this.objectList[frameIndex].length; i++) {
            this.objectList[frameIndex][i].draw(ctx, colourTable, this.objectList[frameIndex][i] == activeObject)
        }
    }

    // Clear objects.
    clearObjects () {
        for (let i = 0; i < this.objectList.length; i++) {
            this.objectList[i] = []
        }
    }

    // Swap two objects (can be used to reorder objects in the same frame).
    swapObjects (frmIndexA, objIndexA, frmIndexB, objIndexB) {
        if ((objIndexA < 0) || (objIndexA >= this.objectList[frmIndexA].length) ||
            (objIndexB < 0) || (objIndexB >= this.objectList[frmIndexB].length))
            return false

        const obj = this.objectList[frmIndexA][objIndexA]
        this.objectList[frmIndexA][objIndexA] = this.objectList[frmIndexB][objIndexB]
        this.objectList[frmIndexB][objIndexB] = obj

        return true
    }

    // Clear video segments.
    clearVidSegs () {
        this.vidSegList = []
    }

    // Swap video segments.
    swapVidSegs (segIndexA, segIndexB) {
        if ((segIndexA < 0) || (segIndexA >= this.vidSegList.length) ||
            (segIndexB < 0) || (segIndexB >= this.vidSegList.length))
            return false

        const seg = this.vidSegList[segIndexA]
        this.vidSegList[segIndexA] = this.vidSegList[segIndexB]
        this.vidSegList[segIndexB] = seg

        return true
    }

    // Sort video clips.
    sortVidSegs (ascending = true) {
        this.vidSegList.sort(function (a, b) {
            if (a.start == b.start) return a.end - b.end
            return a.start - b.start
        })
        if (!ascending) {
            data.reverse()
        }
    }

    // Get information as a string.
    getInfoString () {
        let nKeyframes = this.keyframes.length
        let nFrames = this.objectList.length

        let nObjects = 0
        let nFramesWithObjects = 0
        for (let i = 0; i < nFrames; i++) {
            nObjects += this.objectList[i].length
            if (this.objectList[i].length > 0)
                nFramesWithObjects += 1
        }

        // Prints count and object description.
        function toStringHelper (n, singular, plural = null) {
            if (n == 0) return 'No ' + (plural == null ? singular + 's' : plural)
            if (n == 1) return String(n) + ' ' + singular
            return String(n) + ' ' + (plural == null ? singular + 's' : plural)
        }

        let str = toStringHelper(nKeyframes, 'keyframe') + '; '
        str += toStringHelper(nObjects, 'object') +
            (nObjects > 0 ? ' in ' + toStringHelper(nFramesWithObjects, 'frame') : '') + '; '
        str += toStringHelper(this.vidSegList.length, 'segment') + '.'
        return str
    }
}
