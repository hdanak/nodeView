
MOP = {
  Class: function(c)
  {
    var base    = c.base    || Object
      , mixins  = c.mixins  || []
      , init    = c.init    || function() { base.apply(this, arguments) }
      , methods = c.methods || {}

    function mixin(a, b) {
      Object.keys(b).forEach(function(k) {
        Object.defineProperty(a, k, Object.getOwnPropertyDescriptor(b, k))
      })
    }

    init.prototype = Object.create(base.prototype)
    mixin(init.prototype, methods)
    mixins.map(function(m) { mixin(init.prototype, m.prototype) })
    init.prototype.constructor = init

    return init
  }
}
