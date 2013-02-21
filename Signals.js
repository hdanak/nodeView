
var Signals = Class({
    init: function ()
    {
        this.signal = { slots: {}, blocked: {} };
        this.signal.default = function () {};
    },
    methods: {
        signal: {
            fire:       function (type)
            {
                if (!signal.blocked[type])
                    ifndef(signal.slots[type], [signal.default]).map(
                           function (fx) { fx() }, self);
            };
            slot:       function (type)
            {
                return function () { signal.fire(type) }
            };
            connect:    function (type, fx)
            {
                signal.slots[type] = ifndef(signal.slots[type], []);
                signal.slots[type].push(fx);
            };
            block:      function (type)
            {
                signal.blocked[type] = true;
            };
            unblock:    function (type)
            {
                signal.blocked[type] = false;
            };
        },
    },
});
