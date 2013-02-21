
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
Array.prototype.treemap = function (callback, thisArg) {
    return this.map(function (elem) {
        return (elem instanceof Array) ? elem.treemap(callback, thisArg)
                                       : callback.call(thisArg, elem);
    });
}
Array.prototype.merge   = function () {
    Array.prototype.treemap.call(arguments, function (item) {
        this.push(item)
    }, this);
    return this.length;
};
Array.prototype.extend  = function () {
    Array.prototype.map.call(arguments, function (item) {
        this.push(item)
    }, this);
    return this.length;
};
Object.prototype.merge  = function () {
    Array.prototype.treemap.call(arguments, function (map) {
        for (var i in map) this[i] = map[i];
    }, this);
};
Object.prototype.extend = function () {
    Array.prototype.map.call(arguments, function (map) {
        for (var i in map) this[i] = map[i];
    }, this);
};
