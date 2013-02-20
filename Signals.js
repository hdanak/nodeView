
var Signals = Class({
    constructor: function ()
    {
        var self = this;
        this.signal = {
            slots:  {},
            fire:   function (type)
            {
                ifndef(this.slots[type], [this.default]).map(
                       function (fx) { fx() }, self);
            },
            slot:   function (type)
            {
                return function () { self.signal.fire(type) }
            },
            connect: function (type, fx)
            {
                this.slots[type] = ifndef(this.slots[type], []);
                this.slots[type].push(fx);
            },
        };
        this.signal.default = function () {};
    },
});
