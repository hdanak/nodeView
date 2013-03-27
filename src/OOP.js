/* nodeView::src/OOP.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

NodeView.Class = function (def)
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
        init:       def.init || function () {},
        methods:    {},
        mixins:     [], requires:   [],
        after:      {}, before:     {}, around:     {},
    };

    // Mutator methods for setting properties after creation
    cons.methods  = chain(function ()
    {
        cons._meta.methods.merge(arguments);
    }, cons);
    cons.mixins   = chain(function (list)
    {   
        cons._meta.mixins.merge(arguments);
        console.log(cons._meta);
        var protos = cons._meta.mixins.map(function (x) { return x.prototype })
                                      .reverse();
        var proto  = cons.prototype;
        protos.forEach(function (mp) {
            proto.prototype = Object.create(mp);
            proto = proto.prototype;
        });
        //  TODO: resolve duplicate mixins from ancestors
    }, cons);
    cons.requires = chain(function ()
    {
        cons._meta.required.merge(arguments);
    }, cons);
    cons.after    = chain(function (map)
    {
        cons._meta.after.merge(map)
        for (var i in map) {
            var after = map[i];
            var method = cons[i];
            cons[i] = function () {
                var retval = method.apply(cons, arguments);
                return ifndef(after.apply(cons, [].concat(arguments, retval)),
                              retval);
            };
        }
    }, cons);
    cons.before   = chain(function (map)
    {
        cons._meta.before.merge(map)
        for (var i in map) {
            var before = map[i];
            var method = cons[i];
            cons[i] = function () {
                before.call(cons, arguments);
                return method.apply(cons, arguments);
            };
        }
    }, cons);
    cons.around   = chain(function (map)
    {
        cons._meta.around.merge(map)
        for (var i in map) {
            var around = map[i];
            var method = cons[i];
            cons[i] = function () {
                return around.apply(cons, [].concat(method, arguments))
            };
        }
    }, cons);
    cons.prototype = Object.create(cons._meta.methods);
    cons.prototype.constructor = cons;
    cons.methods  ( def.methods  || {} ).mixins ( def.mixins || [] )
        .requires ( def.requires || [] ).after  ( def.after  || {} )
        .before   ( def.before   || {} ).around ( def.around || {} );
    return cons;
};
