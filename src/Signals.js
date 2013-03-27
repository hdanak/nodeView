/* nodeView::src/Signals.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

NodeView.Signals = NodeView.Class({
    init: function ()
    {
        this.signals = {
            slots: {},
            self: this,
            fire:       function (name)
            {
                var args = Array.prototype.slice.call(arguments, 1);
                if (this.masked[name])
                    this.masked[name].apply(this.self, args);
                else if (this.slots[name])
                    this.slots[name].map(function (fx) {
                        fx.apply(this, args)
                    }, this.self);
            },
            slot:       function (name)
            {
                var args    = arguments,
                    signals = this;
                return function () { signals.fire.apply(signals, args) }
            },
            connect:    function (name, fx)
            {
                this.slots[name] = ifndef(this.slots[name], []);
                this.slots[name].push(fx);
            },
            delegate: function () {
                this.children.filter(function (x) { x.coldet(cursor) })
                             .map(function (x) { x.fire(type, cursor) });
            },
            masked: {},
            mask:      function (name, fx)
            {
                this.masked[name] = fx;
            },
            unmask:    function (name)
            {
                this.masked[name] = undefined;
            },
        };
    },
    methods: {
    }
});
