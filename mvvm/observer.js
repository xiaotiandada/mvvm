var data = {
    name: 'hi',
    obj: {
        aaa: '1'
    }
};
observe(data);
data.name = 'hello world';
data.name = 'hello world1';
data.name = 'hello world2';
data.name = 'hello world3';
data.obj.aaa = 'aaa111';
data.obj.aaa = 'aaa222';
data.obj.aaa = 'aaa333';
data.obj.aaa = 'aaa444';
data.obj = {
    aaa: '123123',
    b: 1
};
function observe(data) {
    if (!data || typeof data !== 'object') {
        return;
    }
    Object.keys(data).forEach(function (key) {
        defineReactive(data, key, data[key]);
    });
}
function defineReactive(data, key, val) {
    observe(val); // 监听子属性
    Object.defineProperty(data, key, {
        enumerable: true,
        configurable: false,
        get: function () {
            return val;
        },
        set: function (newVal) {
            console.log(val, ' -----> ', newVal);
            val = newVal;
        }
    });
}
