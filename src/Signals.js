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
        this.signals = { slots: {}, blocked: {} };
        this.signals.default = function () {};
        this.signals.self = this;
    },
    methods: {
        signals: {
            fire:       function (type, data, self)
            {
                if (!this.blocked[type])
                    ifndef(this.slots[type], [this.default]).map(
                           function (fx) { fx.call(self, this, data) }, this.self);
            },
            slot:       function (type, data, self)
            {
                var signals = this;
                return function () { signals.fire(type, data, self) }
            },
            connect:    function (type, fx)
            {
                this.slots[type] = ifndef(this.slots[type], []);
                this.slots[type].push(fx);
            },
            block:      function (type)
            {
                this.blocked[type] = true;
            },
            unblock:    function (type)
            {
                this.blocked[type] = false;
            }
        }
    }
});
