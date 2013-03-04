/* nodeView::src/Signals.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

var Signals = Class({
    init: function ()
    {
        this.signals = { slots: {}, masked: {} };
        this.signals.self = this;
    },
    methods: {
        signals: {
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
            mask:      function (name, fx)
            {
                this.masked[name] = fx;
            },
            unmask:    function (name)
            {
                this.masked[name] = undefined;
            }
        }
    }
});
