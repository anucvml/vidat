import store from '../store/store.js'
import utils from './utils.js'

const PROXIMITY = 5 // proximity in pixels for active object / key point

class Annotation {
  constructor (labelId = 0, color = null, instance = null, score = null) {
    this.highlight = false
    this.instance = instance
    this.score = score
    this.labelId = labelId
    if (!color) {
      this.color = store.state.settings.objectLabelData[this.labelId].color
    } else {
      this.color = color
    }
  }

  draw () {
    throw 'Not implemented!'
  }

  clone () {
    throw 'Not implemented!'
  }
}

class ObjectAnnotation extends Annotation {
  constructor (x, y, width, height, labelId, color, instance, score) {
    super(labelId, color, instance, score)
    this.x = x
    this.y = y
    this.width = width
    this.height = height
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
  constructor (pointList = [], labelId, color, instance, score) {
    super(labelId, color, instance, score)
    this.pointList = pointList
  }

  draw (ctx) {
    if (this.pointList && this.pointList.length) {
      // draw the border
      let lineWidth = this.highlight ? 4 : 2
      ctx.lineWidth = lineWidth + 2
      ctx.strokeStyle = '#000000'
      ctx.beginPath()
      const firstPoint = this.pointList[0]
      ctx.moveTo(firstPoint.x, firstPoint.y)
      for (let i = 1; i < this.pointList.length; i++) {
        const point = this.pointList[i]
        ctx.lineTo(point.x, point.y)
      }
      ctx.lineTo(firstPoint.x, firstPoint.y)
      ctx.stroke()
      ctx.lineWidth = lineWidth
      ctx.strokeStyle = this.color
      ctx.stroke()
      // draw the handles
      for (const point of this.pointList) {
        const x = point.x
        const y = point.y
        ctx.fillStyle = '#000000'
        const size = this.highlight ? 6 : 5
        ctx.fillRect(x - size, y - size, size * 2, size * 2)
        ctx.fillStyle = this.color
        ctx.fillRect(x - size + 1, y - size + 1, size * 2 - 2, size * 2 - 2)
      }
    }
  }

  clone () {
    return new RegionAnnotation(
      utils.deepClone(this.pointList),
      this.labelId,
      this.color,
      this.instance,
      this.score,
    )
  }

  static nearPoint (x, y, point) {
    return Math.abs(x - point.x) <= PROXIMITY * 3 && Math.abs(y - point.y) <= PROXIMITY * 3
  }

  nearPoints (mouseX, mouseY) {
    let ret = false
    for (const point of this.pointList) {
      ret = ret || RegionAnnotation.nearPoint(mouseX, mouseY, point)
    }
    return ret
  }

  nearBoundary (mouseX, mouseY) {
    const indexList = []
    for (let i = 0; i < this.pointList.length; i++) {
      indexList.push(i)
    }
    indexList.push(0)
    for (let i = 0; i < indexList.length - 1; i++) {
      const p1 = this.pointList[indexList[i]]
      const p2 = this.pointList[indexList[i + 1]]
      // ax + by + c = 0
      const a = 1 / (p2.x - p1.x)
      const b = 1 / (p1.y - p2.y)
      const c = -p1.y * b - p1.x * a
      const distance = Math.abs((a * mouseX + b * mouseY + c) / Math.sqrt(a * a + b * b))
      // approximate estimation
      if (distance < PROXIMITY &&
        mouseX > Math.min(p1.x, p2.x) &&
        mouseX < Math.max(p1.x, p2.x) &&
        mouseY > Math.min(p1.y, p2.y) &&
        mouseY < Math.max(p1.y, p2.y)
      )
        return true
    }
    return false
  }

  move (deltaX, deltaY) {
    this.centerX += deltaX
    this.centerY += deltaY
    for (const point of this.pointList) {
      point.x += deltaX
      point.y += deltaY
    }
  }
}

class SkeletonAnnotation extends Annotation {
  constructor (mouseX, mouseY, labelId, color, instance, score) {
    super(labelId, color, instance, score)
    this.centerX = mouseX
    this.centerY = mouseY
    this._ratio = 1
    this.pointList = this.getPointList()
  }

  get ratio () {
    return this._ratio
  }

  set ratio (ratio) {
    this._ratio = ratio
    this.pointList = this.getPointList()
  }

  getPointList () {
    const x = this.centerX
    const y = this.centerY
    const ratio = this._ratio
    return [
      {
        name: 'center',
        x: x,
        y: y,
      },
      {
        name: 'nose',
        x: x,
        y: y - 30 * ratio,
      },
      {
        name: 'left eye',
        x: x - 3 * ratio,
        y: y - 35 * ratio,
      },
      {
        name: 'right eye',
        x: x + 3 * ratio,
        y: y - 35 * ratio,
      },
      {
        name: 'left ear',
        x: x - 7 * ratio,
        y: y - 32 * ratio,
      },
      {
        name: 'right ear',
        x: x + 7 * ratio,
        y: y - 32 * ratio,
      },
      {
        name: 'left shoulder',
        x: x - 13 * ratio,
        y: y - 20 * ratio,
      },
      {
        name: 'right shoulder',
        x: x + 13 * ratio,
        y: y - 20 * ratio,
      },
      {
        name: 'left wrist',
        x: x - 15 * ratio,
        y: y + 10 * ratio,
      },
      {
        name: 'right wrist',
        x: x + 15 * ratio,
        y: y + 10 * ratio,
      },
      {
        name: 'left hip',
        x: x - 8 * ratio,
        y: y + 10 * ratio,
      },
      {
        name: 'right hip',
        x: x + 8 * ratio,
        y: y + 10 * ratio,
      },
      {
        name: 'left knee',
        x: x - 9 * ratio,
        y: y + 30 * ratio,
      },
      {
        name: 'right knee',
        x: x + 9 * ratio,
        y: y + 30 * ratio,
      },
      {
        name: 'left ankle',
        x: x - 10 * ratio,
        y: y + 45 * ratio,
      },
      {
        name: 'right ankle',
        x: x + 10 * ratio,
        y: y + 45 * ratio,
      },
    ]
  }

  draw (ctx) {
    // draw the line
    let lineWidth = this.highlight ? 4 : 2
    ctx.lineWidth = lineWidth + 2
    ctx.strokeStyle = '#000000'
    ctx.beginPath()
    // head
    ctx.moveTo(this.pointList[1].x, this.pointList[1].y)
    ctx.lineTo(this.pointList[2].x, this.pointList[2].y)
    ctx.moveTo(this.pointList[1].x, this.pointList[1].y)
    ctx.lineTo(this.pointList[3].x, this.pointList[3].y)
    ctx.moveTo(this.pointList[1].x, this.pointList[1].y)
    ctx.lineTo(this.pointList[4].x, this.pointList[4].y)
    ctx.moveTo(this.pointList[1].x, this.pointList[1].y)
    ctx.lineTo(this.pointList[5].x, this.pointList[5].y)
    // body
    const shouldCenter = {
      x: (this.pointList[6].x + this.pointList[7].x) / 2,
      y: (this.pointList[6].y + this.pointList[7].y) / 2,
    }
    ctx.moveTo(this.pointList[1].x, this.pointList[1].y)
    ctx.lineTo(shouldCenter.x, shouldCenter.y)
    ctx.lineTo(this.pointList[6].x, this.pointList[6].y)
    ctx.lineTo(this.pointList[8].x, this.pointList[8].y)
    ctx.moveTo(shouldCenter.x, shouldCenter.y)
    ctx.lineTo(this.pointList[7].x, this.pointList[7].y)
    ctx.lineTo(this.pointList[9].x, this.pointList[9].y)
    ctx.moveTo(shouldCenter.x, shouldCenter.y)
    ctx.lineTo(this.pointList[0].x, this.pointList[0].y)
    // leg
    const hipCenter = {
      x: (this.pointList[10].x + this.pointList[11].x) / 2,
      y: (this.pointList[11].y + this.pointList[11].y) / 2,
    }
    ctx.lineTo(hipCenter.x, hipCenter.y)
    ctx.lineTo(this.pointList[10].x, this.pointList[10].y)
    ctx.lineTo(this.pointList[12].x, this.pointList[12].y)
    ctx.lineTo(this.pointList[14].x, this.pointList[14].y)
    ctx.moveTo(hipCenter.x, hipCenter.y)
    ctx.lineTo(this.pointList[11].x, this.pointList[11].y)
    ctx.lineTo(this.pointList[13].x, this.pointList[13].y)
    ctx.lineTo(this.pointList[15].x, this.pointList[15].y)

    ctx.stroke()
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = this.color
    ctx.stroke()
    // draw the handles
    for (const point of this.pointList) {
      const x = point.x
      const y = point.y
      ctx.fillStyle = '#000000'
      const size = this.highlight ? 6 : 5
      if (point.name === 'center') {
        ctx.fillRect(x - size, y - size, size * 2, size * 2)
        ctx.fillStyle = this.color
        ctx.fillRect(x - size + 1, y - size + 1, size * 2 - 2, size * 2 - 2)
      } else {
        ctx.beginPath()
        ctx.arc(x, y, size + 1, 0, Math.PI * 2, false)
        ctx.fill()
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2, false)
        ctx.fill()
      }
    }
  }

  clone () {
    const skeletonAnnotation = new SkeletonAnnotation(
      this.centerX,
      this.centerY,
      this.labelId,
      this.color,
      this.instance,
      this.score,
    )
    skeletonAnnotation.ratio = this._ratio
    skeletonAnnotation.pointList = utils.deepClone(this.pointList)
    return skeletonAnnotation
  }

  static nearPoint (x, y, point) {
    return Math.abs(x - point.x) <= PROXIMITY * 3 && Math.abs(y - point.y) <= PROXIMITY * 3
  }

  nearPoints (mouseX, mouseY) {
    let ret = false
    for (const point of this.pointList) {
      ret = ret || SkeletonAnnotation.nearPoint(mouseX, mouseY, point)
    }
    return ret
  }

  move (deltaX, deltaY) {
    for (const point of this.pointList) {
      point.x += deltaX
      point.y += deltaY
    }
  }
}

class ActionAnnotation {
  constructor (start, end = null, action = null, object = null, color = null, description = null) {
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
  ActionAnnotation,
}
