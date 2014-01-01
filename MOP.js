
MOP = {
  Class: function()
  {
    var mixins = [], methods = {}, base = null, init = null

    function mixin(a, b) {
      Object.keys(b).forEach(function(k) {
        Object.defineProperty(a, k, Object.getOwnPropertyDescriptor(b, k))
      })
    }

    Array.prototype.forEach.call(arguments, function(a) {
      if (a instanceof Function) {
        if (!base) {
          base = a
        } else {
          mixins.push(a)
        }
      } else {
        mixin(methods, a)
      }
    })

    base = base || Object
    if (methods.constructor == Object)
      methods.constructor = function() { base.apply(this, arguments) }
    init = methods.constructor

    init.prototype = Object.create(base.prototype)
    mixins.map(function(m) { mixin(init.prototype, m.prototype) })
    mixin(init.prototype, methods)

    init.new = function() {
      var o = Object.create(init.prototype)
      init.apply(o, arguments)
      return o
    }
    init.super = base

    return init
  }
}
