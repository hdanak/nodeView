/*
 * nodeView.js
 *
 * Copyright 2012, Hike Danakian
 * Licensed under the LGPL v.3
 *
 */

NodeView = {}

with(NodeView) {
  NodeView.Point = MOP.Class({
    constructor: function(x, y)
    {
      Point.prototype.move.call(this, x, y)
    },
    move: function(x, y) {
      mixin(this, {x: x, y: y})
    }
  })
  NodeView.Rect = MOP.Class(Point, {
    constructor: function(x, y, w, h)
    {
      Point.call(this, x, y)
      this.resize(w, h)
    },
    resize: function(w, h)
    {
      mixin(this, {w: w, h: h})
    },
    coldet: function(x, y)
    {
      return (this.x + this.w >= x && this.x <= x
           && this.y + this.h >= y && this.y <= y)
    },
  })
  NodeView.Circle = MOP.Class(Point, {
    constructor: function(x, y, r)
    {
      Point.call(this, x, y)
      this.tolerance = 0
      this.resize(r)
    },
    resize: function(r)
    {
      this.r = r
    },
    coldet: function(x, y)
    {
      var r_squared = Math.pow(this.r + this.tolerance, 2)
      return Math.pow(x - this.x, 2) <= r_squared
          && Math.pow(y - this.y, 2) <= r_squared
    },
  })
  NodeView.Edge = MOP.Class({
    constructor: function(start, end, reverse)
    {
      mixin(this, { start: reverse ? end : start
                  , end:   reverse ? start : end })
    },
    draw: function() {
      if (!this.start || !this.end)
        return

      var s = this.start
        , e = this.end
        , dist = { x: Math.abs(e.x - s.x)
                 , y: Math.abs(e.y - s.y) }
        , ctx = this.start.scene.context
        , backwards = (s.type == (s.x < e.x ? 'i' : 'o'))

      ctx.save()

      if (!backwards && s.x > e.x) {
        var tmp = s
        s = e
        e = tmp
      }

      ctx.moveTo(s.x, s.y)

      if (backwards) {
        var dir = (e.y > s.y ? 1 : -1)
        ctx.bezierCurveTo(s.x, s.y + dist.x/3 * dir,
                          e.x, e.y - dist.y/3 * dir,
                          e.x, e.y)
      } else {
        ctx.bezierCurveTo(s.x + dist.x/3, s.y,
                          e.x - dist.x/3, e.y,
                          e.x, e.y)
      }
      ctx.stroke()
      ctx.restore()
    },
  })
  NodeView.Pin = MOP.Class(Circle, {
    constructor: function(node, type) {
      Circle.call(this, node.x, node.y, 3)

      mixin(this,
      { type: type
      , node: node
      , port: type == 'i' ? node.inputs : node.outputs
      , edges: []
      , _bubble: false
      , tolerance: 3
      })
    },
    get scene() { return this.node.scene },
    get bubble() { return this._bubble },
    set bubble(state) {
      var old = this._bubble
      this._bubble = state
      if (old != state)
        this.scene.draw()
    },
    get number() {
      return this.port.indexOf(this) + 1
    },
    connect: function(target, edge) {
      edge = edge || new Edge(target, this, this.type != 'i')
      this.edges.push(edge)
      this.scene.addEdge(edge)
    },
    disconnect: function() {
      this.edges.map(function(edge) { this.scene.removeEdge(edge) }.bind(this))
      this.edges = []
    },
    draw: function() {
      var ctx = this.scene.context
        , arc_start = Math.PI/2 * (this.type == 'i' ? 1 : -1)

      ctx.beginPath()
      ctx.arc(this.x + (this.type == 'i' ? -1 : 1) * this.bubble, this.y,
              this.r - 0.75 * this.bubble, arc_start, -arc_start, false)
      ctx.closePath()

      ctx.save()
      if (this.bubble) {
        ctx.lineWidth = 3
      } else {
        ctx.lineWidth = 1
        ctx.fillStyle = "#eee"
        ctx.fill()
      }
      ctx.stroke()
      ctx.restore()
    },
    get x() { return this.node.x + (this.type == 'i' ? 0 : this.node.w) },
    get y() { return this.node.y + this.node.corner_radius
                      + (this.node.h - this.node.corner_radius * 2)
                          * this.number/(this.port.length + 1) }
  })
  NodeView.InputPin = MOP.Class(Pin, {
    constructor: function(node)
    {
      Pin.call(this, node, 'i')
    }
  })
  NodeView.OutputPin = MOP.Class(Pin, {
    constructor: function(node)
    {
      Pin.call(this, node, 'o')
    }
  })
  NodeView.FixedTray = MOP.Class({
    constructor: function(node, type)
    {
      this.pins = []
      this.node = node
      this.type = type
    }
  })
  NodeView.FlexTray = MOP.Class(FixedTray, {
    constructor: function(node)
    {
      Port.call(this, node)
    },
    findZone: function(x, y) {
      var h = node.coldet(x + 2, y) - node.coldet(x - 2, y)
        , v = node.coldet(x, y + 2) - node.coldet(x, y - 2)

      return !!(h || v)
    },
  })
  NodeView.Node = MOP.Class(Rect, {
    constructor: function(x, y, w, h)
    {
      Rect.call(this, x, y, w, h)
      mixin(this,
      { corner_radius: 5
      , inputs: [], outputs: []
      , scene: null
      })
    },
    addInput: chain(function() {
      this.inputs.push(new InputPin(this))
    }),
    addOutput: chain(function() {
      this.outputs.push(new OutputPin(this))
    }),
    findZone: function(x, y) {
      var res = null
      this.inputs.concat(this.outputs).some(function(elem) {
        if (elem.coldet(x, y)) {
          res = elem
          return true
        }
      })
      res = res || this.coldet(x, y) && this
      return res
    },
    draw: function() {
      var ctx = this.scene.context
        , x = this.x, y = this.y
        , w = this.w, h = this.h
        , r = this.corner_radius

      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
      ctx.stroke()

      this.inputs.map(function(x){x.draw()})
      this.outputs.map(function(x){x.draw()})
    },
  })
  NodeView.Modal = MOP.Class({
    constructor: function(eventSrc, eventCallback)
    {
      this._mode = "NORMAL"

      var eventTypes = {}
      Object.keys(this.modes).map(function(m) {
        if (this.modes[m].events)
          Object.keys(this.modes[m].events).map(function(t) { eventTypes[t] = true })
      }, this)

      eventSrc.on(Object.keys(eventTypes).join(' '), function(ev) {
        var handler = this.modes[this._mode].events[ev.type]
        if (handler) {
          handler.call(this, eventCallback.call(this, ev))
        }
        return false
      }.bind(this))
    },
    modes: {
      NORMAL: {}
    },
    mode: function(m) {
      if (arguments.length == 0)
        return this._mode

      var modes = this.modes
        , args  = Array.prototype.slice.call(arguments, 1)
      if (!(m in modes))
        throw('Invalid mode: ' + m)

      modes[this._mode].exit && modes[this._mode].exit.call(this)
      this._mode = m
      modes[this._mode].enter && modes[this._mode].enter.apply(this, args)
    },
  })
  NodeView.Cursor = MOP.Class(Point, {
    constructor: function() {
      Point.call(this, 0, 0)
    },
    updateFromEvent: chain(function(ev) {
      if (ev.layerX || ev.layerX == 0) { // Firefox
        this.move(ev.layerX, ev.layerY)
      } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        this.move(ev.offsetX, ev.offsetY)
      }
    }),
  })
  NodeView.Scene = MOP.Class(Modal, {
    constructor: function(canvas)
    {
      mixin(this,
      { nodes: []
      , edges: []

      , cursor: new Cursor()
      , canvas: canvas
      , context: canvas.getContext("2d")
      })
      this.context.translate(0.5, 0.5)

      Modal.call(this, $(canvas), function(ev) {
        this.cursor.updateFromEvent(ev)
        return this.findZone(this.cursor.x, this.cursor.y)
      }.bind(this))
    },
    modes: {
      NORMAL: {
        enter: function() {
          this.draw()
        },
        events: {
          mousemove: function(elem) {
            if (elem instanceof Pin)
              this.mode('BUBBLE', elem)
          },
          mousedown: function(elem) {
            if (elem instanceof Node)
              this.mode('DRAG', elem)
          },
        }
      },
      DRAG: {
        enter: function(elem, offset) {
          this._dragging = elem
          this._offset = offset || new Point(this.cursor.x - elem.x, this.cursor.y - elem.y)
        },
        exit: function(elem, offset) {
          this._dragging = this._offset = null
        },
        events: {
          mouseup: function() {
            this.mode('NORMAL')
          },
          mousemove: function() {
            this._dragging.move(this.cursor.x - this._offset.x,
                                this.cursor.y - this._offset.y)
            this.draw()
          },
        }
      },
      BUBBLE: {
        enter: function(elem) {
          this._bubbled = elem
          this._bubbled.bubble = true
        },
        exit: function(elem) {
          this._bubbled.bubble = false
          this._bubbled = null
        },
        events: {
          mousemove: function(elem) {
            if (this._bubbled != elem)
              this.mode('NORMAL')
          },
          mousedown: function(elem) {
            this.mode('CONNECT', this._bubbled)
            if (elem instanceof Pin && elem.edges.length > 0) {
              this._startPin.disconnect()
            }
          },
        }
      },
      CONNECT: {
        enter: function(start) {
          this._startPin = start
          this._endPin = null
          this._connector = new Edge(this._startPin, this.cursor)
          this.addEdge(this._connector)
        },
        exit: function() {
          this.removeEdge(this._connector)
          if (this._startPin)
            this._startPin.bubble = false
          if (this._endPin)
            this._endPin.bubble = false
          this._connector = this._startPin = this._endPin = null
        },
        events: {
          mouseup: function() {
            if (this._endPin != null) {
              this._connector.end = this._endPin
              this._startPin.connect(this._endPin, this._connector)
            } else {
              this.removeEdge(this._connector)
            }
            this.mode('NORMAL')
          },
          mousemove: function(elem) {
            if (elem instanceof Pin && elem.type != this._startPin.type) {
              if (this._endPin && this._endPin != elem) {
                this._endPin.bubble = false
              }
              this._endPin = elem
              this._endPin.bubble = true
            } else if (this._endPin) {
              this._endPin.bubble = false
              this._endPin = null
            }

            this.draw()
          },
        }
      },
      DELETE: {
        enter: function() {
          $(this.canvas).addClass('delete-mode')
        },
        exit: function() {
          $(this.canvas).removeClass('delete-mode')
        },
        events: {
          mousedown: function(elem) {
            if (elem instanceof Node) {
              this.removeNode(elem)
            }
            this.mode('NORMAL')
          },
        }
      },
    },
    addEdge: chain(function(edge) {
      this.edges.push(edge)
    }),
    removeEdge: chain(function(edge) {
      var pos = this.edges.indexOf(edge)
      if (pos >= 0)
        this.edges.splice(pos, 1)
    }),
    addNode: chain(function(node, interactive) {
      this.nodes.push(node)
      node.scene = this

      if (interactive) {
        this.mode('DRAG', node, new Point(0, 0))
      } else {
        node.draw()
      }
    }),
    removeNode: chain(function(node, interactive) {
      var pos = this.nodes.indexOf(node)
      if (pos >= 0) {
        node.inputs.concat(node.outputs).forEach(function(elem) {
          if (elem.edges.length > 0)
            elem.disconnect()
        })
        this.nodes.splice(pos, 1)
      }

      if (interactive) {
        this.mode('DELETE')
      } else {
        this.draw()
      }
    }),
    draw: function() {
      this.context.clearRect(0,0, this.canvas.width, this.canvas.height)
      this.nodes.concat(this.edges).forEach(function(elem) {elem.draw()})
    },
    findZone: function(x, y) {
      var res = null
      this.nodes.some(function(elem) {
        return res = elem.findZone(x, y)
      })
      return res
    },
  })
}

// Utility functions

function mixin(a, b) {
  Object.keys(b).forEach(function(k) {
    Object.defineProperty(a, k, Object.getOwnPropertyDescriptor(b, k))
  })
}
function chain(fx) {
  return function() {
    fx.apply(this, arguments)
    return this
  }
}

// vim: ts=2 sw=2 et sts=0
