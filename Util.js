
// Utility functions
function defined (q)
{
    return q != undefined
}
function ifndef (q, t, f)
{
    return !defined(q) ? t : defined(f) ? f : q;
}
function chain (fx, self)
{
    self = ifndef(self, this);
    return function () {
        fx.apply(self, arguments);
        return self;
    };
}
function Class (def)
{
    var cons = def.constructor || function () {};
// TODO: deduplicate mixins from ancestors
    if (def.mixins) {
        var cons_orig = cons;
        cons = function () {
            def.mixins.map(function (fx) { fx.call(this) }, this);
            cons_orig.apply(this, arguments);
        };
    }
    var protos = [].concat(
        def.mixins ? def.mixins.map(function (x) { return x.prototype }) : [],
        def.proto || []
    ).reverse();
    var proto = cons;
    protos.forEach(function (elem) {
        proto.prototype = Object.create(elem);
        proto = proto.prototype;
    });
    cons.prototype.constructor = cons;
    if (def.post_proto) {
        def.post_proto.call(cons.prototype);
    }
    return cons;
};
