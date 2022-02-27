/**
 * Library for annotations
 */

import deepClone from 'lodash.clonedeep'
import { useAnnotationStore } from '~/store/annotation.js'
import { useConfigurationStore } from '~/store/configuration.js'
import { usePreferenceStore } from '~/store/preference.js'

class Annotation {
  constructor (instance = null, score = null) {
    this.highlight = false
    this.instance = instance
    this.score = score
  }

  draw () {
    throw 'Not implemented!'
  }

  clone () {
    throw 'Not implemented!'
  }

  /**
   * Get proximity from Vuex
   * @returns {*}
   */
  getProximity () {
    return usePreferenceStore().sensitivity
  }
}

class ObjectAnnotation extends Annotation {
  /**
   * Constructor
   * @param x
   * @param y
   * @param width
   * @param height
   * @param labelId
   * @param color
   * @param instance
   * @param score
   */
  constructor (
    x, y, width, height, labelId = 0, color = null, instance, score) {
    super(instance, score)
    this.labelId = labelId
    if (!color) {
      this.color = useConfigurationStore().objectLabelData.find(label => label.id === this.labelId).color
    } else {
      this.color = color
    }
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  /**
   * Draw on canvas
   * @param ctx: canvas context
   */
  draw (ctx) {
    const widthFactor = ctx.canvas.width / useAnnotationStore().video.width
    const heightFactor = ctx.canvas.height / useAnnotationStore().video.height
    const u = this.x * widthFactor
    const v = this.y * heightFactor
    const w = this.width * widthFactor
    const h = this.height * heightFactor
    // draw the boundaries
    const unitLineWidth = ctx.canvas.width / 1000
    let lineWidth = this.highlight ? 4 * unitLineWidth : 2 * unitLineWidth
    ctx.lineWidth = lineWidth + 2 * unitLineWidth
    ctx.strokeStyle = '#000000'
    ctx.strokeRect(u, v, w, h)
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = this.color
    ctx.strokeRect(u, v, w, h)
    // draw the handles
    const pointList = [
      { // top left
        x: u,
        y: v
      },
      { // top
        x: u + w / 2,
        y: v
      },
      { // top right
        x: u + w,
        y: v
      },
      { // left
        x: u,
        y: v + h / 2
      },
      { // right
        x: u + w,
        y: v + h / 2
      },
      { // bottom left
        x: u,
        y: v + h
      },
      { // bottom
        x: u + w / 2,
        y: v + h
      },
      { // bottom right
        x: u + w,
        y: v + h
      }
    ]
    for (const point of pointList) {
      const x = point.x
      const y = point.y
      ctx.fillStyle = '#000000'
      const size = this.highlight ? 6 * unitLineWidth : 5 * unitLineWidth
      ctx.fillRect(x - size, y - size, size * 2, size * 2)
      ctx.fillStyle = this.color
      ctx.fillRect(x - size + unitLineWidth, y - size + unitLineWidth,
        size * 2 - 2 * unitLineWidth,
        size * 2 - 2 * unitLineWidth)
    }
  }

  /**
   * Self-clone
   * @returns {ObjectAnnotation}
   */
  clone () {
    return new ObjectAnnotation(
      this.x,
      this.y,
      this.width,
      this.height,
      this.labelId,
      this.color,
      this.instance,
      this.score
    )
  }

  /**
   * Resize object
   * @param x
   * @param y
   * @param width
   * @param height
   */
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

  /**
   * Whether mouse is close to left boundary
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearLeftBoundary (mouseX, mouseY) {
    return Math.abs(mouseX - this.x) <= this.getProximity() &&
      mouseY < this.y + this.height - this.getProximity() &&
      mouseY > this.y + this.getProximity()
  }

  /**
   * Whether mouse is close to right boundary
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearRightBoundary (mouseX, mouseY) {
    return Math.abs(mouseX - this.x - this.width) <= this.getProximity() &&
      mouseY < this.y + this.height - this.getProximity() &&
      mouseY > this.y + this.getProximity()
  }

  /**
   * Whether mouse is close to top boundary
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearTopBoundary (mouseX, mouseY) {
    return Math.abs(mouseY - this.y) <= this.getProximity() &&
      mouseX > this.x + this.getProximity() &&
      mouseX < this.x + this.width - this.getProximity()
  }

  /**
   * Whether mouse is close to bottom boundary
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearBottomBoundary (mouseX, mouseY) {
    return Math.abs(mouseY - this.y - this.height) <= this.getProximity() &&
      mouseX > this.x + this.getProximity() &&
      mouseX < this.x + this.width - this.getProximity()
  }

  /**
   * Whether mouse is close to any boundary out of four
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearBoundary (mouseX, mouseY) {
    return this.nearLeftBoundary(mouseX, mouseY) ||
      this.nearRightBoundary(mouseX, mouseY) ||
      this.nearTopBoundary(mouseX, mouseY) ||
      this.nearBottomBoundary(mouseX, mouseY)
  }

  /**
   * Whether mouse is close to top left anchor
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearTopLeftAnchor (mouseX, mouseY) {
    return Math.abs(mouseX - this.x) <= this.getProximity() &&
      Math.abs(mouseY - this.y) <= this.getProximity()
  }

  /**
   * Whether mouse is close to top anchor
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearTopAnchor (mouseX, mouseY) {
    return Math.abs(mouseX - this.x - this.width / 2) <= this.getProximity() &&
      Math.abs(mouseY - this.y) <=
      this.getProximity()
  }

  /**
   * Whether mouse is close to top right anchor
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearTopRightAnchor (mouseX, mouseY) {
    return Math.abs(mouseX - this.x - this.width) <= this.getProximity() &&
      Math.abs(mouseY - this.y) <=
      this.getProximity()
  }

  /**
   * Whether mouse is close to left anchor
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearLeftAnchor (mouseX, mouseY) {
    return Math.abs(mouseX - this.x) <= this.getProximity() &&
      Math.abs(mouseY - this.y - this.height / 2) <=
      this.getProximity()
  }

  /**
   * Whether mouse is close to right anchor
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearRightAnchor (mouseX, mouseY) {
    return Math.abs(mouseX - this.x - this.width) <= this.getProximity() &&
      Math.abs(mouseY - this.y - this.height / 2) <=
      this.getProximity()
  }

  /**
   * Whether mouse is close to bottom left anchor
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearBottomLeftAnchor (mouseX, mouseY) {
    return Math.abs(mouseX - this.x) <= this.getProximity() &&
      Math.abs(mouseY - this.y - this.height) <=
      this.getProximity()
  }

  /**
   * Whether mouse is close to bottom anchor
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearBottomAnchor (mouseX, mouseY) {
    return Math.abs(mouseX - this.x - this.width / 2) <= this.getProximity() &&
      Math.abs(mouseY - this.y - this.height) <=
      this.getProximity()
  }

  /**
   * Whether mouse is close to bottom right anchor
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearBottomRightAnchor (mouseX, mouseY) {
    return Math.abs(mouseX - this.x - this.width) <= this.getProximity() &&
      Math.abs(mouseY - this.y - this.height) <=
      this.getProximity()
  }

  /**
   * Whether mouse is close to any anchor out of eight
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearAnchor (mouseX, mouseY) {
    return this.nearTopLeftAnchor(mouseX, mouseY) ||
      this.nearTopAnchor(mouseX, mouseY) ||
      this.nearTopRightAnchor(mouseX, mouseY) ||
      this.nearLeftAnchor(mouseX, mouseY) ||
      this.nearRightAnchor(mouseX, mouseY) ||
      this.nearBottomLeftAnchor(mouseX, mouseY) ||
      this.nearBottomAnchor(mouseX, mouseY) ||
      this.nearBottomRightAnchor(mouseX, mouseY)
  }

  /**
   * Get the anchor in the opposite position
   * @param mouseX
   * @param mouseY
   * @returns {null|{x: *, y: *}}
   */
  oppositeAnchor (mouseX, mouseY) {
    // top left anchor => bottom right anchor
    if (this.nearTopLeftAnchor(mouseX, mouseY)) {
      return {
        x: this.x + this.width,
        y: this.y + this.height
      }
    }
    // top right anchor => bottom left anchor
    if (this.nearTopRightAnchor(mouseX, mouseY)) {
      return {
        x: this.x,
        y: this.y + this.height
      }
    }
    // bottom left anchor => top right anchor
    if (this.nearBottomLeftAnchor(mouseX, mouseY)) {
      return {
        x: this.x + this.width,
        y: this.y
      }
    }
    // bottom right anchor => top left anchor
    if (this.nearBottomRightAnchor(mouseX, mouseY)) {
      return {
        x: this.x,
        y: this.y
      }
    }
    return null
  }

}

class RegionAnnotation extends Annotation {
  /**
   * Constructor
   * @param pointList
   * @param labelId
   * @param color
   * @param instance
   * @param score
   */
  constructor (pointList = [], labelId = 0, color = null, instance, score) {
    super(instance, score)
    this.labelId = labelId
    if (!color) {
      this.color = useConfigurationStore().objectLabelData.find(label => label.id === labelId).color
    } else {
      this.color = color
    }
    this.pointList = pointList
  }

  /**
   * Draw on canvas
   * @param ctx: canvas context
   */
  draw (ctx) {
    if (this.pointList && this.pointList.length) {
      const widthFactor = ctx.canvas.width / useAnnotationStore().video.width
      const heightFactor = ctx.canvas.height / useAnnotationStore().video.height
      // draw the boundaries
      const unitLineWidth = ctx.canvas.width / 1000
      let lineWidth = this.highlight ? 4 * unitLineWidth : 2 * unitLineWidth
      ctx.lineWidth = lineWidth + 2 * unitLineWidth
      ctx.strokeStyle = '#000000'
      ctx.beginPath()
      const firstPoint = this.pointList[0]
      ctx.moveTo(firstPoint.x * widthFactor, firstPoint.y * heightFactor)
      for (let i = 1; i < this.pointList.length; i++) {
        const point = this.pointList[i]
        ctx.lineTo(point.x * widthFactor, point.y * heightFactor)
      }
      ctx.lineTo(firstPoint.x * widthFactor, firstPoint.y * heightFactor)
      ctx.fillStyle = this.color + '40'
      ctx.fill()
      ctx.stroke()
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = this.color
      ctx.stroke()
      // draw the handles
      for (const point of this.pointList) {
        const x = point.x * widthFactor
        const y = point.y * heightFactor
        ctx.fillStyle = '#000000'
        const size = this.highlight ? 6 * unitLineWidth : 5 * unitLineWidth
        ctx.fillRect(x - size, y - size, size * 2, size * 2)
        ctx.fillStyle = this.color
        ctx.fillRect(x - size + unitLineWidth, y - size + unitLineWidth,
          size * 2 - 2 * unitLineWidth,
          size * 2 - 2 * unitLineWidth)
      }
    }
  }

  /**
   * Self-clone
   * @returns {RegionAnnotation}
   */
  clone () {
    return new RegionAnnotation(
      deepClone(this.pointList),
      this.labelId,
      this.color,
      this.instance,
      this.score
    )
  }

  /**
   * Whether mouse is close to a point
   * @param mouseX
   * @param mouseY
   * @param point
   * @returns {boolean}
   */
  nearPoint (mouseX, mouseY, point) {
    return Math.abs(mouseX - point.x) <= this.getProximity() * 3 &&
      Math.abs(mouseY - point.y) <= this.getProximity() *
      3
  }

  /**
   *  Whether mouse is close to any point
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearPoints (mouseX, mouseY) {
    let ret = false
    for (const point of this.pointList) {
      ret = ret || this.nearPoint(mouseX, mouseY, point)
    }
    return ret
  }

  /**
   * Get a list of indexes of points that are the two end points of the boundary closed to mouse, if no boundary is found, return empty list
   * @param mouseX
   * @param mouseY
   * @returns {[]}
   */
  getPointIndexListOfBoundary (mouseX, mouseY) {
    const indexList = []
    for (let i = 0; i < this.pointList.length; i++) {
      indexList.push(i)
    }
    indexList.push(0)
    for (let i = 0; i < indexList.length - 1; i++) {
      const p1 = this.pointList[indexList[i]]
      const p2 = this.pointList[indexList[i + 1]]
      // ax + by + c = 0
      let distance
      if (Math.abs(p2.x - p1.x) <= 1) { // vertical
        distance = Math.abs(mouseX - (p1.x + p2.x) / 2)
      } else if (Math.abs(p2.y - p1.y) <= 1) { // horizontal
        distance = Math.abs(mouseY - (p1.y + p2.y) / 2)
      } else { // others
        const a = 1 / (p2.x - p1.x)
        const b = 1 / (p1.y - p2.y)
        const c = -p1.y * b - p1.x * a
        distance = Math.abs(
          (a * mouseX + b * mouseY + c) / Math.sqrt(a * a + b * b))
      }
      // approximate estimation
      if (distance < this.getProximity() &&
        mouseX > Math.min(p1.x, p2.x) - this.getProximity() &&
        mouseX < Math.max(p1.x, p2.x) + this.getProximity() &&
        mouseY > Math.min(p1.y, p2.y) - this.getProximity() &&
        mouseY < Math.max(p1.y, p2.y) + this.getProximity()
      ) {
        return [indexList[i], indexList[i + 1]]
      }
    }
    return []
  }

  /**
   * Whether mouse is close to any boundary
   * @param mouseX
   * @param mouseY
   * @returns {boolean}
   */
  nearBoundary (mouseX, mouseY) {
    return this.getPointIndexListOfBoundary(mouseX, mouseY).length !== 0
  }

  /**
   * Move the region
   * @param deltaX
   * @param deltaY
   */
  move (deltaX, deltaY) {
    for (const point of this.pointList) {
      point.x += deltaX
      point.y += deltaY
    }
  }
}

class SkeletonAnnotation extends Annotation {
  /**
   * Constructor
   * @param mouseX
   * @param mouseY
   * @param typeId
   * @param color
   * @param instance
   * @param score
   */
  constructor (mouseX, mouseY, typeId, color = null, instance, score) {
    super(instance, score)
    this.centerX = mouseX
    this.centerY = mouseY
    this.typeId = typeId
    this.type = useConfigurationStore().skeletonTypeData.find(type => type.id === typeId)
    if (!color) {
      this.color = this.type.color
    } else {
      this.color = color
    }
    this._ratio = 1
    this.pointList = this.getPointList()
  }

  /**
   * ratio getter
   * @returns {number}
   */
  get ratio () {
    return this._ratio
  }

  /**
   * ratio setter
   * @param ratio
   */
  set ratio (ratio) {
    this._ratio = ratio
    // refresh point list
    this.pointList = this.getPointList()
  }

  /**
   * Set related parameters and return point list
   * @returns {[{name: string, x: *, y: *, id: number}]}
   */
  getPointList () {
    const x = this.centerX
    const y = this.centerY
    const ratio = this._ratio
    let ret = [
      {
        id: -1,
        name: 'center',
        x: x,
        y: y
      }]
    for (const point of this.type.pointList) {
      ret.push({
        id: point.id,
        name: point.name,
        x: x + point.x * ratio,
        y: y + point.y * ratio
      })
    }
    return ret
  }

  /**
   * Draw on canvas
   * @param ctx: canvas context
   * @param preview: for preview mode only, ignore video width/height ratio
   */
  draw (ctx, preview = false) {
    // draw the line
    const widthFactor = preview ? 1 : ctx.canvas.width / useAnnotationStore().video.width
    const heightFactor = preview ? 1 : ctx.canvas.height / useAnnotationStore().video.height
    const unitLineWidth = preview ? 1 : ctx.canvas.width / 1000
    let lineWidth = this.highlight ? 4 * unitLineWidth : 2 * unitLineWidth
    ctx.lineWidth = lineWidth + 2 * unitLineWidth
    ctx.strokeStyle = '#000000'
    ctx.beginPath()
    for (const edge of this.type.edgeList) {
      const fromPoint = this.pointList.find(point => point.id === edge.from)
      const toPoint = this.pointList.find(point => point.id === edge.to)
      ctx.moveTo(fromPoint.x * widthFactor, fromPoint.y * heightFactor)
      ctx.lineTo(toPoint.x * widthFactor, toPoint.y * heightFactor)
    }
    ctx.stroke()
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = this.color
    ctx.stroke()
    // draw the handles
    for (const point of this.pointList) {
      const x = point.x * widthFactor
      const y = point.y * heightFactor
      ctx.fillStyle = '#000000'
      const size = this.highlight ? 6 * unitLineWidth : 5 * unitLineWidth
      if (point.name === 'center') {
        ctx.fillRect(x - size, y - size, size * 2, size * 2)
        ctx.fillStyle = this.color
        ctx.fillRect(x - size + unitLineWidth, y - size + unitLineWidth,
          size * 2 - 2 * unitLineWidth,
          size * 2 - 2 * unitLineWidth)
      } else {
        ctx.beginPath()
        ctx.arc(x, y, size + unitLineWidth, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2, false)
        ctx.fill()
      }
    }
  }

  /**
   * Self-clone
   * @returns {SkeletonAnnotation}
   */
  clone () {
    const skeletonAnnotation = new SkeletonAnnotation(
      this.centerX,
      this.centerY,
      this.typeId,
      this.color,
      this.instance,
      this.score
    )
    skeletonAnnotation._ratio = this._ratio
    skeletonAnnotation.pointList = deepClone(this.pointList)
    return skeletonAnnotation
  }

  /**
   * Whether mouse is close to a point
   * @param mouseX
   * @param mouseY
   * @param point
   * @returns {boolean}
   */
  nearPoint (mouseX, mouseY, point) {
    return Math.abs(mouseX - point.x) <= this.getProximity() * 3 &&
      Math.abs(mouseY - point.y) <= this.getProximity() *
      3
  }

  /**
   * Move skeleton
   * @param deltaX
   * @param deltaY
   */
  move (deltaX, deltaY) {
    this.centerX += deltaX
    this.centerY += deltaY
    for (const point of this.pointList) {
      point.x += deltaX
      point.y += deltaY
    }
  }
}

class ActionAnnotation {
  /**
   * Constructor
   * @param start
   * @param end
   * @param action
   * @param object
   * @param color
   * @param description
   */
  constructor (
    start, end = null, action = null, object = null, color = null, description = null) {
    this.start = start
    this.end = end
    this.action = action
    this.object = object
    this.color = color
    this.description = description
  }
}

export {
  Annotation,
  ObjectAnnotation,
  RegionAnnotation,
  SkeletonAnnotation,
  ActionAnnotation
}
