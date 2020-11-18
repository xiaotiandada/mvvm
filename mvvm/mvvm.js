console.log('mvvm');
function MVVM(options) {
    var _this = this;
    this.$options = options || {};
    var data = this._data = this.$options.data;
    Object.keys(data).forEach(function (key) {
        _this._proxyData(key);
    });
    this._initComputed();
}
MVVM.prototype = {
    constructor: MVVM,
    // 添加一个属性代理的方法 使访问vm的属性代理为访问vm._data的属性
    _proxyData: function (key, setter, getter) {
        console.log('_proxyData', key, setter, getter);
        setter = setter ||
            Object.defineProperty(this, key, {
                configurable: false,
                enumerable: true,
                get: function () {
                    return this._data[key];
                },
                set: function (newVal) {
                    console.log('newVal', newVal);
                    this._data[key] = newVal;
                }
            });
        console.log('me', this);
    },
    // 添加 computed
    _initComputed: function () {
        var _this = this;
        var computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function (key) {
                console.log('computed key', key);
                Object.defineProperty(_this, key, {
                    get: function () {
                        return typeof computed[key] === 'function' ?
                            computed[key] :
                            computed[key].get;
                    },
                    set: function () { }
                });
            });
        }
        console.log('me', this);
    }
};
