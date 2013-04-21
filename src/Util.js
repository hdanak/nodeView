/* nodeView::src/Util.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

// Utility functions
function defined(q) { return q != undefined }
function ifndef(q, t, f) { return !defined(q) ? t : f }
Object.prototype.setdefault = function (x, d) {
    this[x] = ifndef(this[x], d);
    return this[x]
};
function callee() { return arguments.callee.caller }
function caller() { return callee().caller.caller }
function argv(a) {
    return Array.prototype.slice.call(a || caller().arguments)
}
function chain(fx, alt) {
    var have_alt = arguments.length > 1;
    return function () {
        var c = have_alt ? alt : this;
        fx.apply(c, arguments);
        return c;
    }
}
function super(x) {
    return x.__proto__.__proto__.constructor
}
function bless(o, C) {
    o.__proto__ = C.prototype;
    return o
}

Function.prototype.chain = function () { return chain(this) };
Function.prototype.void = function () { return chain(this, undefined) };
Object.prototype.do = function (f) { return f.apply(this, arguments) };
Object.prototype.bless = function (C) { return bless(this, C) };

Object.prototype.defaults = function (defs) {
    for (var k in defs)
        if (!(k in this))
            this[k] = defs[k];
}.chain();


Array.prototype.treemap = function (callback, thisArg) {
    return this.map(function (elem) {
        return (elem instanceof Array) ? elem.treemap(callback, thisArg)
            : thisArg ? callback.call(thisArg, elem) : callback(elem) });
};
Array.prototype.extend  = function () {
    Array.prototype.map.call(arguments, function (item) {this.push(item)}, this);
    return this.length;
};
Array.prototype.merge   = function () {
    Array.prototype.treemap.call(arguments, function (item) {this.push(item)}, this);
    return this.length;
};
Array.prototype.first  = function (callback, thisObject) {
    for (var i = 0; i < this.length; ++i) {
        if (callback.call(thisObject, this[i]))
            return this[i];
    }
}

Object.prototype.map    = function (callback, thisArg) {
    var output = [];
    for (var k in this)
        output.push(thisArg ? callback.call(thisArg, k, this[k])
                            : callback(k, this[k]))
    return output;
}
Object.prototype.extend = function () {
    Array.prototype.map.call(arguments, function (map) {
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
Object.prototype.merge  = function () {
    Array.prototype.treemap.call(arguments, function (map) {this.extend(map)}, this);
}.chain();

function Module ()
{ 
    var obj = Object.create(arguments.callee.prototype);
    Array.prototype.forEach.call(arguments,
        function (o) { if (o.name) obj[o.name] = o });
    return obj
};
