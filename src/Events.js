/* nodeView::src/Events.js
 *
 * Copyright 2013 Hike Danakian
 * Released under the GNU Lesser GPL v.3
 * See COPYING and COPYING.LESSER for license information.
 *
 */

var EventListener = Class({
    requires: ["children"],
    init: function () {
        this.event = {
            handlers: {},
            emit:   function (ev)
            {
                ifndef(this.event.handlers[ev.type], [this.event.default]).map(
                       function (fx) { fx.call(this, ev) }, this);
            },
            handle: function (type, fx)
            {
                this.event.handlers[type] = ifndef(this.event.handlers[type], []);
                this.event.handlers[type].push(fx);
            },
        };
        this.event.default = this.event.delegate = function (ev) {
            this.children.map(function (c) { c.handle(ev); }, this);
        };
    }
});
