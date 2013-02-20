
var EventListener = Class({
    constructor: function ()
    {
        this.children = ifndef(this.children, [])
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
    },
});
