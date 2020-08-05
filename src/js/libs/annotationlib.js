import store from '../store/store.js'

const PROXIMITY = 5 // proximity in pixels for active object / key point

class Annotation {
  constructor () {}

  draw () {
    throw 'Not implemented!'
  }

  clone () {
    throw 'Not implemented!'
  }
}

class ObjectAnnotation extends Annotation {
  constructor (x, y, width, height, labelId = 0, color = '', instance = '', score = '') {
    super()
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.highlight = false
    this.labelId = labelId
    if (color === '') {
      this.color = store.state.settings.objectLabelData[this.labelId].color
    } else {
      this.color = color
    }
    this.instance = instance
    this.score = score
  }

  draw (ctx) {
    const u = this.x
    const v = this.y
    const w = this.width
    const h = this.height

    let lineWidth = this.highlight ? 4 : 2

    ctx.lineWidth = lineWidth + 2
    ctx.strokeStyle = '#000000'
    ctx.strokeRect(u, v, w, h)
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = this.color
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
      ctx.strokeStyle = this.color
      ctx.stroke()
    }
  }

  clone () {
    return new ObjectAnnotation(
      this.x,
      this.y,
      this.width,
      this.height,
      this.labelId,
      this.color,
      this.instance,
      this.score,
    )
  }

  resize (x = this.x, y = this.y, width = this.width, height = this.height) {
    if (width < 0) {
      this.x = x + width
      this.width = -width
    } else {
      this.x = x
      this.width = width
    }

    if (height < 0) {
      this.y = y + height
      this.height = -height
    } else {
      this.y = y
      this.height = height
    }
  }

  nearBoundary (mouseX, mouseY) {
    return (
      (
        // left boundary
        Math.abs(mouseX - this.x) <= PROXIMITY &&
        mouseY < this.y + this.height - PROXIMITY &&
        mouseY > this.y + PROXIMITY
      ) ||
      (
        // right boundary
        Math.abs(mouseX - this.x - this.width) <= PROXIMITY &&
        mouseY < this.y + this.height - PROXIMITY &&
        mouseY > this.y + PROXIMITY
      ) ||
      (
        // top boundary
        Math.abs(mouseY - this.y) <= PROXIMITY &&
        mouseX > this.x + PROXIMITY &&
        mouseX < this.x + this.width - PROXIMITY
      ) ||
      (
        // bottom boundary
        Math.abs(mouseY - this.y - this.height) <= PROXIMITY &&
        mouseX > this.x + PROXIMITY &&
        mouseX < this.x + this.width - PROXIMITY
      )
    )
  }

  nearAnchor (mouseX, mouseY) {
    return (
      // top left anchor
      (Math.abs(mouseX - this.x) <= PROXIMITY && Math.abs(mouseY - this.y) <= PROXIMITY) ||
      // top right anchor
      (Math.abs(mouseX - this.x - this.width) <= PROXIMITY && Math.abs(mouseY - this.y) <= PROXIMITY) ||
      // bottom left anchor
      (Math.abs(mouseX - this.x) <= PROXIMITY && Math.abs(mouseY - this.y - this.height) <= PROXIMITY) ||
      // bottom right anchor
      (Math.abs(mouseX - this.x - this.width) <= PROXIMITY && Math.abs(mouseY - this.y - this.height) <= PROXIMITY)
    )
  }

  oppositeAnchor (mouseX, mouseY) {
    // top left anchor => bottom right anchor
    if (Math.abs(mouseX - this.x) <= PROXIMITY && Math.abs(mouseY - this.y) <= PROXIMITY) {
      return { x: this.x + this.width, y: this.y + this.height }
    }
    // top right anchor => bottom left anchor
    if (Math.abs(mouseX - this.x - this.width) <= PROXIMITY && Math.abs(mouseY - this.y) <= PROXIMITY) {
      return { x: this.x, y: this.y + this.height }
    }
    // bottom left anchor => top right anchor
    if (Math.abs(mouseX - this.x) <= PROXIMITY && Math.abs(mouseY - this.y - this.height) <= PROXIMITY) {
      return { x: this.x + this.width, y: this.y }
    }
    // bottom right anchor => top left anchor
    if (Math.abs(mouseX - this.x - this.width) <= PROXIMITY && Math.abs(mouseY - this.y - this.height) <= PROXIMITY) {
      return { x: this.x, y: this.y }
    }
    return null
  }

}

class RegionAnnotation extends Annotation {

}

class SkeletonAnnotation extends Annotation {

}

export {
  Annotation,
  ObjectAnnotation,
  RegionAnnotation,
  SkeletonAnnotation,
}
