/*
 * nodeView.js
 *
 * Copyright 2012, Hike Danakian
 * Licensed under the LGPL v.3
 *
 */

NodeView = (function()
{
  var Point = MOP.Class({
    constructor: function(o)
    {
      o = defaults(o, { x:0, y:0 })
      Point.prototype.move.call(this, o.x, o.y)
    },
    move: function(x, y)
    {
      this.x = x
      this.y = y
    },
    export: function()
    {
      return {x: this.x, y: this.y}
    },
  })

  var Rect = MOP.Class(Point, {
    constructor: function(o)
    {
      o = defaults(o, { w:0, h:0 })
      Rect.super.call(this, o)
      this.resize(o.w, o.h)
    },
    resize: function(w, h)
    {
      this.w = w
      this.h = h
    },
    coldet: function(x, y)
    {
      return (this.x + this.w >= x && this.x <= x
           && this.y + this.h >= y && this.y <= y)
    },
    export: function()
    {
      return extend(Rect.super.prototype.export.call(this), { w: this.w, h: this.h })
    },
  })

  var Circle = MOP.Class(Point, {
    constructor: function(o)
    {
      o = defaults(o, { tolerance:0 })
      Circle.super.call(this, o)
      this.tolerance = o.tolerance
      this.resize(o.r)
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
    export: function()
    {
      return extend(Circle.super.prototype.export.call(this), { r: this.r })
    },
  })

  var Edge = MOP.Class({
    constructor: function(start, end)
    {
      var reverse = start.type == 'i' || end.type == 'o'
      mixin(this, { start: reverse ? end : start
                  , end: reverse ? start : end })
    },
    draw: function()
    {
      if (!this.start || !this.end)
        return

      var s = this.start
        , e = this.end
        , dist = { x: Math.abs(e.x - s.x)
                 , y: Math.abs(e.y - s.y) }
        , ctx = this.scene.context
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
    export: function()
    {
      var nodes = this.scene.nodes
      return {
        start: [nodes.indexOf(this.start.node), this.start.number - 1].join('.'),
        end: [nodes.indexOf(this.end.node), this.end.number - 1].join('.')
      }
    },
  })

  var Pin = MOP.Class(Circle, {
    constructor: function(node, type)
    {
      Circle.call(this, { r:3 })

      mixin(this,
      { type: type
      , node: node
      , port: type == 'i' ? node.inputs : node.outputs
      , _bubble: false
      , tolerance: 3
      })
    },
    get scene() { return this.node.scene },
    get bubble() { return this._bubble },
    set bubble(state)
    {
      var old = this._bubble
      this._bubble = state
      if (old != state)
        this.scene.draw()
    },
    get number()
    {
      return this.port.indexOf(this) + 1
    },
    disconnect: function()
    {
      this.scene.edges.filter(function(e) { return e.start == this || e.end == this }, this)
                      .forEach(function(e) { this.scene.removeEdge(e) }, this)
    },
    draw: function()
    {
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

  var InputPin = MOP.Class(Pin, {
    constructor: function(node)
    {
      InputPin.super.call(this, node, 'i')
    }
  })

  var OutputPin = MOP.Class(Pin, {
    constructor: function(node)
    {
      OutputPin.super.call(this, node, 'o')
    }
  })

  var Node = MOP.Class(Rect, {
    constructor: function(o)
    {
      o = defaults(o, { inputs:0, outputs:0, corner_radius:5 })
      Node.super.call(this, o)

      mixin(this,
      { corner_radius: o.corner_radius
      , inputs: [], outputs: []
      , scene: o.scene || null
      })

      var c
      for (c = 0; c < o.inputs; ++c)
        this.addInput()
      for (c = 0; c < o.outputs; ++c)
        this.addOutput()
    },
    addInput: chain(function()
    {
      this.inputs.push(InputPin.new(this))
    }),
    addOutput: chain(function()
    {
      this.outputs.push(OutputPin.new(this))
    }),
    findZone: function(x, y)
    {
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
    draw: function()
    {
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

      this.inputs.concat(this.outputs).forEach(method('draw'))
    },
    export: function()
    {
      return extend(Node.super.prototype.export.call(this), {
        inputs: this.inputs.length,
        outputs: this.outputs.length
      })
    },
  })

  var LabelNode = MOP.Class(Node, {
    constructor: function(o)
    {
      o = defaults(o, { label:"", font_size:12 })
      o.h = Math.max(o.h, o.font_size + 4)
      LabelNode.super.call(this, o)

      this.label = o.label
      this.font_size = o.font_size
    },
    draw: function()
    {
      var ctx = this.scene.context
        , x = this.x, y = this.y
        , w = this.w, h = this.h

      ctx.font = this.font_size + "px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(this.label, x + w/2, y + this.font_size/4 + h/2)

      var tw = ctx.measureText(this.label).width
      this.resize(Math.max(tw + 20, this.w), this.h)

      LabelNode.super.prototype.draw.call(this)
    },
    export: function()
    {
      return extend(LabelNode.super.prototype.export.call(this), { label: this.label })
    },
  })

  var Modal = MOP.Class({
    constructor: function(evtSrc, evtCb)
    {
      this._mode = "NORMAL"

      var eventTypes = {}
      Object.keys(this.modes).forEach(function(m) {
        if (this.modes[m].events)
          Object.keys(this.modes[m].events).forEach(function(t) {
            eventTypes[t] = true
          })
      }, this)

      evtSrc.on(Object.keys(eventTypes).join(' '), function(ev) {
        var handler = this.modes[this._mode].events[ev.type]
        if (handler) {
          handler.call(this, evtCb.call(this, ev))
        }
        return false
      }.bind(this))
    },
    modes: {
      NORMAL: {}
    },
    mode: function(m)
    {
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

  var Cursor = MOP.Class(Point, {
    constructor: function()
    {
      Cursor.super.call(this)
    },
    updateFromEvent: chain(function(ev)
    {
      if (ev.layerX || ev.layerX == 0) { // Firefox
        this.move(ev.layerX, ev.layerY)
      } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        this.move(ev.offsetX, ev.offsetY)
      }
    }),
  })

  var Scene = MOP.Class(Modal, {
    constructor: function(canvas, title)
    {
      mixin(this,
      { nodes: []
      , edges: []
      , title: title

      , cursor: Cursor.new()
      , canvas: canvas
      , context: canvas.getContext("2d")
      })
      this.context.translate(0.5, 0.5)

      Scene.super.call(this, $(canvas), function(ev) {
        this.cursor.updateFromEvent(ev)
        return this.findZone(this.cursor.x, this.cursor.y)
      }.bind(this))
    },
    modes: {
      NORMAL: {
        enter: function()
        {
          this.draw()
        },
        events: {
          mousemove: function(elem)
          {
            if (elem instanceof Pin)
              this.mode('BUBBLE', elem)
          },
          mousedown: function(elem)
          {
            if (elem instanceof Node)
              this.mode('DRAG', elem)
          },
        }
      },
      DRAG: {
        enter: function(elem, offset)
        {
          this._dragging = elem
          this._offset = offset || Point.new({ x:(this.cursor.x - elem.x),
                                               y:(this.cursor.y - elem.y) })
        },
        exit: function(elem, offset)
        {
          this._dragging = this._offset = null
        },
        events: {
          mouseup: function()
          {
            this.mode('NORMAL')
          },
          mousemove: function()
          {
            this._dragging.move(this.cursor.x - this._offset.x,
                                this.cursor.y - this._offset.y)
            this.draw()
          },
        }
      },
      BUBBLE: {
        enter: function(elem)
        {
          this._bubbled = elem
          this._bubbled.bubble = true
        },
        exit: function(elem)
        {
          this._bubbled.bubble = false
          this._bubbled = null
        },
        events: {
          mousemove: function(elem)
          {
            if (this._bubbled != elem)
              this.mode('NORMAL')
          },
          mousedown: function(elem)
          {
            if (this._bubbled instanceof Pin && this._bubbled.type == 'i')
              this._bubbled.disconnect()
            this.mode('CONNECT', this._bubbled)
          },
        }
      },
      CONNECT: {
        enter: function(pin)
        {
          this._startPin = pin
          this._endPin = null
          this._connector = Edge.new(pin, this.cursor)
          this.addEdge(this._connector)
        },
        exit: function()
        {
          this.removeEdge(this._connector)
          delete this._connector
          delete this._startPin
          if (this._endPin && this._endPin.bubble)
            this._endPin.bubble = false
          delete this._endPin
        },
        events: {
          mouseup: function(elem)
          {
            if (this._endPin != null && this._endPin == elem) {
              this.addEdge(Edge.new(this._startPin, this._endPin))
            }
            this.mode('NORMAL')
          },
          mousemove: function(elem)
          {
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
        enter: function()
        {
          $(this.canvas).addClass('delete-mode')
        },
        exit: function()
        {
          $(this.canvas).removeClass('delete-mode')
        },
        events: {
          mousedown: function(elem)
          {
            if (elem instanceof Node) {
              this.removeNode(elem)
            }
            this.mode('NORMAL')
          },
        }
      },
    },
    addEdge: chain(function(edge)
    {
      if (this.edges.some(function(e) { return e.start == edge.start && e.end == edge.end }))
        return

      this.edges.push(edge)
      edge.scene = this

      this.draw()
    }),
    removeEdge: chain(function(edge)
    {
      var pos = this.edges.indexOf(edge)
      if (pos > -1)
        this.edges.splice(pos, 1)
    }),
    addNode: chain(function(node, interactive)
    {
      if (this.nodes.indexOf(node) < 0)
        this.nodes.push(node)
      node.scene = this

      if (interactive) {
        this.mode('DRAG', node, Point.new())
      } else {
        this.draw()
      }
    }),
    removeNode: chain(function(node, interactive)
    {
      var pos = this.nodes.indexOf(node)
      if (pos > -1) {
        node.inputs.concat(node.outputs).forEach(method('disconnect'))
        this.nodes.splice(pos, 1)
      }

      if (interactive) {
        this.mode('DELETE')
      } else {
        this.draw()
      }
    }),
    draw: function()
    {
      this.context.clearRect(0,0, this.canvas.width, this.canvas.height)
      this.nodes.concat(this.edges).forEach(method('draw'))
    },
    findZone: function(x, y)
    {
      var res = null
      this.nodes.some(function(elem) {
        return res = elem.findZone(x, y)
      })
      return res
    },
    import: chain(function(o)
    {
      this.title = o.title || this.title

      this.nodes.concat([]).forEach(function(n) { this.removeNode(n) }, this)
      this.edges.concat([]).forEach(function(e) { this.removeEdge(e) }, this)

      o.nodes.forEach(function(n) { this.addNode(LabelNode.new(n)) }, this)
      o.edges.forEach(function(e) {
        var m_s = e.start.match(/(\d+)\.(\d+)/)
          , m_e = e.end.match(/(\d+)\.(\d+)/)
        this.addEdge(Edge.new(this.nodes[m_s[1]].outputs[m_s[2]],
                              this.nodes[m_e[1]].inputs[m_e[2]]))
      }, this)

      this.draw()
    }),
    export: function()
    {
      return {
        title: this.title,
        nodes: this.nodes.map(function(n) { return n.export() }),
        edges: this.edges.map(function(e) { return e.export() }),
      }
    }
  })

  // Utility functions

  function mixin(a, b)
  {
    Object.keys(b).forEach(function(k) {
      Object.defineProperty(a, k, Object.getOwnPropertyDescriptor(b, k))
    })
    return a
  }
  function extend(a, b)
  {
    return mixin(clone(a), b)
  }
  function clone(o)
  {
    return mixin({}, o)
  }
  function defaults(o, d)
  {
    var out = clone(o || {})
    Object.keys(d).forEach(function(k) {
      if (out[k] === undefined)
        Object.defineProperty(out, k, Object.getOwnPropertyDescriptor(d, k))
    })
    return out
  }
  function method(name)
  {
    return function(obj) { obj[name].call(obj) }
  }
  function chain(fx)
  {
    return function() {
      fx.apply(this, arguments)
      return this
    }
  }

  return { Scene: Scene, Node: LabelNode }
})()

// vim: ts=2 sw=2 et sts=0
