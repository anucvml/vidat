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
    draw(ctx, highlight = false) {
        const lineWidth = highlight ? 3 : 1;

        const u = this.x * ctx.canvas.width;
        const v = this.y * ctx.canvas.height;
        const w = this.width * ctx.canvas.width;
        const h = this.height * ctx.canvas.height;

        ctx.lineWidth = lineWidth + 2; ctx.strokeStyle = "#000000";
        ctx.strokeRect(u, v, w, h);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = (this.colour != null) ? this.colour : "#00ff00";
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
            ctx.lineWidth = lineWidth + 2; ctx.strokeStyle = (this.colour != null) ? this.colour : "#00ff00";
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
    constructor(start, end, description) {
        this.start = start;
        this.end = end;
        this.description = description;
    }
}