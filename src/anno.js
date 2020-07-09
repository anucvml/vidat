/*******************************************************************************
** ANUVIDLIB: A Javascript library for browser-based video annotation.
** Copyright (C) 2020, Stephen Gould <stephen.gould@anu.edu.au>
**
** Classes representing annotation types.
*******************************************************************************/

const PROXIMITY = 5;    // proximity in pixels for active object/keypoint

/* Frame Objects -------------------------------------------------------------*/

// Object bounding box representation. Coordinates between 0 and 1, where 1
// is the width or height of the image frame.
class ObjectBox {
    constructor(x, y, w, h, labelId = null, instanceId = null, colour = null, score = 1.0) {
        this.resize(x, y, w, h);

        this.labelId = labelId;
        this.instanceId = instanceId;
        this.colour = colour;
        this.score = score;
    }

    // Create a clone of this object.
    clone() {
        var obj = new ObjectBox(this.x, this.y, this.width, this.height,
            this.labelId, this.instanceId, this.colour, this.score);
        return obj;
    }

    // Update box size.
    resize(x, y, w, h) {
        if (w < 0) {
            this.x = x + w;
            this.width = -w;
        } else {
            this.x = x;
            this.width = w;
        }

        if (h < 0) {
            this.y = y + h;
            this.height = -h;
        } else {
            this.y = y;
            this.height = h;
        }
    }

    // Draw the object onto a canvas (context). Highlight to provide visual indication of selected.
    draw(ctx, colourTable = null, highlight = false) {
        const lineWidth = highlight ? 3 : 1;

        const u = this.x * ctx.canvas.width;
        const v = this.y * ctx.canvas.height;
        const w = this.width * ctx.canvas.width;
        const h = this.height * ctx.canvas.height;

        var colour = "#00ff00";
        if ((this.colour != null) && (this.colour != "")) {
            colour = this.colour;
        } else if (this.labelId in colourTable) {
            colour = colourTable[this.labelId];
        }

        ctx.lineWidth = lineWidth + 2; ctx.strokeStyle = "#000000";
        ctx.strokeRect(u, v, w, h);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = colour;
        ctx.strokeRect(u, v, w, h);

        const handle = 8;
        if ((w > handle) && (h > handle)) {
            ctx.beginPath();
            ctx.moveTo(u, v + handle); ctx.lineTo(u, v); ctx.lineTo(u + handle, v);
            ctx.moveTo(u, v + h - handle); ctx.lineTo(u, v + h); ctx.lineTo(u + handle, v + h);
            ctx.moveTo(u + w, v + handle); ctx.lineTo(u + w, v); ctx.lineTo(u + w - handle, v);
            ctx.moveTo(u + w, v + h - handle); ctx.lineTo(u + w, v + h); ctx.lineTo(u + w - handle, v + h);
            ctx.lineWidth = lineWidth + 4; ctx.strokeStyle = "#000000";
            ctx.stroke();
            ctx.lineWidth = lineWidth + 2; ctx.strokeStyle = colour;
            ctx.stroke();
        }
    }

    // Check if mouse is positioned near boundary of the box at the given image scale.
    nearBoundary(u, v, sx, sy) {
        if (((Math.abs(u - sx * this.x) <= PROXIMITY) || (Math.abs(u - sx * (this.x + this.width)) <= PROXIMITY)) &&
            (v - sy * this.y + PROXIMITY >= 0) && (sy * (this.y + this.height) - v + PROXIMITY >= 0))
            return true;

        if (((Math.abs(v - sy * this.y) <= PROXIMITY) || (Math.abs(v - sy * (this.y + this.height)) <= PROXIMITY)) &&
            (u - sx * this.x + PROXIMITY >= 0) && (sx * (this.x + this.width) - u + PROXIMITY >= 0))
            return true;

        return false;
    }

    // Check if mouse is positioned near an anchor point, i.e., box corner, at the given image scale.
    nearAnchor(u, v, sx, sy) {
        if (((Math.abs(u - sx * this.x) <= PROXIMITY) || (Math.abs(u - sx * (this.x + this.width)) <= PROXIMITY)) &&
            ((Math.abs(v - sy * this.y) <= PROXIMITY) || (Math.abs(v - sy * (this.y + this.height)) <= PROXIMITY)))
            return true;

        return false;
    }

    // Return the opposite anchor (in pixels) to the nearest anchor point (or null if no anchor point is near).
    oppositeAnchor(u, v, sx, sy) {
        if ((Math.abs(u - sx * this.x) <= PROXIMITY) && (Math.abs(v - sy * this.y) <= PROXIMITY)) {
            return {u: sx * (this.x + this.width), v: sy * (this.y + this.height)};
        }
        if ((Math.abs(u - sx * this.x) <= PROXIMITY) && (Math.abs(v - sy * (this.y + this.height)) <= PROXIMITY)) {
            return {u: sx * (this.x + this.width), v: sy * this.y};
        }
        if ((Math.abs(u - sx * (this.x + this.width)) <= PROXIMITY) && (Math.abs(v - sy * this.y) <= PROXIMITY)) {
            return {u: sx * this.x, v: sy * (this.y + this.height)};
        }
        if ((Math.abs(u - sx * (this.x + this.width)) <= PROXIMITY) && (Math.abs(v - sy * (this.y + this.height)) <= PROXIMITY)) {
            return {u: sx * this.x, v: sy * this.y};
        }

        return null;
    }
}

/* Video Objects -------------------------------------------------------------*/

class VidSegment {
    constructor(start, end, actionId=null, description="") {
        this.start = start;
        this.end = end;
        this.actionId = actionId;
        this.description = description;
    }
}

/* Label Configuration -------------------------------------------------------*/

class LabelConfig {
    constructor() {
        this.actionLabels = {
            '<none>':   "#00ff00",
            walk:       "#ff0000",
            run:        "#ffff00",
            swim:       "#0000ff",
            fly:        "#00ffff"
        };

        this.objectLabels = {
            '<none>':   "#00ff00",
            person:     "#ff0000",
            car:        "#0000ff",
            bicycle:    "#ff00ff"
        };
    }

    load(filename) {
        // TODO: placeholder
    }

    save(filename) {
        // TODO: placeholder
    }

    // Convert actionLabels or objectLabels to a string. Parameter 'dict' should be one of
    // this.actionLabels or this.objectLabels.
    toString(dict) {
        var str = "";
        for (var k in dict) {
            str += String(k) + ": " + dict[k] + "\n";
        }
        return str;
    }

    // Creates a dictionary from a string of the form "<id>: <colour>\n ..."
    fromString(str) {
        var dict = {};
        var lines = str.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var pair = lines[i].split(":");
            if (pair.length != 2) continue;
            dict[pair[0].trim()] = pair[1].trim();
        }

        return dict;
    }
}

/* Annotation Container ------------------------------------------------------*/

/*
** Holds all annotations for a given video. And provides utility functions.
*/

class AnnotationContainer {
    constructor(numFrames = 0) {
        this.lblConfig = new LabelConfig();     // label configuration

        this.keyframes = [];        // array of keyframe timestamps (in seconds)
        this.objectList = [[]];     // array of array of objects

        if (numFrames > 0) {
            this.objectList.length = numFrames;
            for (var i = 0; i < this.objectList.length; i++) {
                this.objectList[i] = [];
            }
        }
    }

    load(filename) {
        // TODO: placeholder
    }

    save(filename) {
        // TODO: different format and include timestamps
        var a = document.createElement("a");
        var file = new Blob([JSON.stringify(this)], {type: "text/plain"});
        a.href = URL.createObjectURL(file);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    // Copy annotations from source frame to target frame.
    copy(srcIndex, tgtIndex, overwrite) {
        if (srcIndex == tgtIndex)
            return false;

        if (overwrite) {
            this.objectList[tgtIndex] = [];
        }

        for (var i = 0; i < this.objectList[srcIndex].length; i++) {
            this.objectList[tgtIndex].push(this.objectList[srcIndex][i].clone());
        }

        return true;
    }

    // Draw frame-based annotations onto the given context.
    draw(ctx, frameIndex, activeObject = null) {

        // draw bounding box objects
        for (var i = 0; i < this.objectList[frameIndex].length; i++) {
            this.objectList[frameIndex][i].draw(ctx, this.lblConfig.objectLabels, this.objectList[frameIndex][i] == activeObject);
        }
    }

    // Swap two objects (can be used to reorder objects in the same frame).
    swapObjects(frmIndexA, objIndexA, frmIndexB, objIndexB) {
        if ((objIndexA < 0) || (objIndexA >= this.objectList[frmIndexA].length) ||
            (objIndexB < 0) || (objIndexB >= this.objectList[frmIndexB].length))
            return false;

        var obj = this.objectList[frmIndexA][objIndexA];
        this.objectList[frmIndexA][objIndexA] = this.objectList[frmIndexB][objIndexB];
        this.objectList[frmIndexB][objIndexB] = obj;

        return true;
    }
}