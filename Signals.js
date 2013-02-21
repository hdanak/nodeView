
var Signals = Class({
    init: function ()
    {
        this.signal = { slots: {}, blocked: {} };
        this.signal.default = function () {};
        this.signal._ = this;
    },
    methods: {
        signal: {
            fire:       function (type, data, self)
            {
                if (!this.blocked[type])
                    ifndef(this.slots[type], [this.default]).map(
                           function (fx) { fx.call(self, this, data) }, this._);
            },
            slot:       function (type, data, self)
            {
                var signal = this;
                return function () { signal.fire(type, data, self) }
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
