/* nodeView::src/OOP.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

function Class (def)
{
    var cons = function () {
        // check 'required'
        cons._meta.mixins.map(function (fx) { fx.call(this) }, this);
        cons._meta.init.apply(this, arguments);
    };
    /*
     * TODO: Ensure that 'this' object is correctly blessed, to allow things
     * like MyClass.apply({ ... }, ... ). Or at least provide a 'bless'
     * function to easily add a prototype chain to an existing object.
     */
    if (def instanceof Function)
        def = { init: def };
    cons._meta = {
        init:       def.init || function () {};
        methods:    {},
        mixins:     [], requires:   [],
        after:      {}, before:     {}, around:     {},
    };

    // Mutator methods for setting properties after creation
    cons.methods  = chain(function ()
    {
        this._meta.methods.merge(arguments);
    });
    cons.mixins   = chain(function (list)
    {   
        this._meta.mixins.merge(arguments);
        var protos = this._meta.mixins.map(function (x) { return x.prototype })
                                      .reverse();
        var proto  = this.prototype;
        protos.forEach(function (mp) {
            proto.prototype = Object.create(mp);
            proto = proto.prototype;
        });
        //  TODO: resolve duplicate mixins from ancestors
    });
    cons.requires = chain(function ()
    {
        this._meta.required.merge(arguments);
    });
    cons.after    = chain(function (map)
    {
        this._meta.after.merge(map)
        for (var i in map) {
            var after = map[i];
            var method = this[i];
            this[i] = function () {
                var retval = method.apply(this, arguments);
                return ifndef(after.apply(this, [].concat(arguments, retval)),
                              retval);
            };
        }
    });
    cons.before   = chain(function (map)
    {
        this._meta.before.merge(map)
        for (var i in map) {
            var before = map[i];
            var method = this[i];
            this[i] = function () {
                before.call(this, arguments);
                return method.apply(this, arguments);
            };
        }
    });
    cons.around   = chain(function (map)
    {
        this._meta.around.merge(map)
        for (var i in map) {
            var around = map[i];
            var method = this[i];
            this[i] = function () {
                return around.apply(this, [].concat(method, arguments))
            };
        }
    });
    cons.prototype = Object.create(cons._meta.methods);
    cons.prototype.constructor = cons;
    cons.methods  ( def.methods  || {} ).mixins ( def.mixins || [] )
        .requires ( def.requires || [] ).after  ( def.after  || {} )
        .before   ( def.before   || {} ).around ( def.around || {} );
    return cons;
};
