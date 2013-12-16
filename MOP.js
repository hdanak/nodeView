
MOP = {
  Class: function()
  {
    var c = { base: null, mixins: [], init: null, methods: {} }

    function mixin(a, b) {
      Object.keys(b).forEach(function(k) {
        Object.defineProperty(a, k, Object.getOwnPropertyDescriptor(b, k))
      })
    }

    Array.prototype.forEach.call(arguments, function(a) {
      if (a instanceof Function) {
        if (!c.base) {
          c.base = a
        } else {
          c.mixins.push(a)
        }
      } else {
        var cons = c.methods.constructor
        mixin(c.methods, a)
        if (cons)
          c.methods.constructor = cons
      }
    })

    var base    = c.base    || Object
      , mixins  = c.mixins  || []
      , init    = c.init    || function() { base.apply(this, arguments) }
      , methods = c.methods || {}

    init.prototype = Object.create(base.prototype)
    mixin(init.prototype, methods)
    mixins.map(function(m) { mixin(init.prototype, m.prototype) })
    init.prototype.constructor = init

    return init
  }
}
