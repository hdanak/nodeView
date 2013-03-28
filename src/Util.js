/* nodeView::src/Util.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

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
Arr_proto = Array.prototype;
Obj_proto = Object.prototype;
Arr_proto.treemap = function (callback, thisArg) {
    return this.map(function (elem) {
        return (elem instanceof Array) ? elem.treemap(callback, thisArg)
                                       : thisArg ? callback.call(thisArg, elem)
                                                 : callback(elem) });
};
Arr_proto.extend  = function () {
    Arr_proto.map.call(arguments, function (item) {this.push(item)}, this);
    return this.length;
};
Arr_proto.merge   = function () {
    Arr_proto.treemap.call(arguments, function (item) {this.push(item)}, this);
    return this.length;
};
Obj_proto.map    = function (callback, thisArg) {
    var output = [];
    for (var k in this)
        output.push(thisArg ? callback.call(thisArg, k, this[k])
                            : callback(k, this[k]))
    return output;
}
Obj_proto.extend = function () {
    Arr_proto.map.call(arguments, function (map) {
        for (var k in map) {
            var getter = map.__lookupGetter__(k),
                setter = map.__lookupSetter__(k);
            if (getter)
                this.__defineGetter__(k, getter);
            else if (setter)
                this.__defineSetter__(k, setter);
            else
                this[k] = map[k];
        }
    }, this);
};
Obj_proto.merge  = function () {
    Arr_proto.treemap.call(arguments, function (map) {this.extend(map)}, this);
};
