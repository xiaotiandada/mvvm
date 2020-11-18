console.log('mvvm');
function MVVM(options) {
    var _this = this;
    this.$options = options || {};
    var data = this._data = this.$options.data;
    Object.keys(data).forEach(function (key) {
        _this._proxyData(key);
    });
    this._initComputed();
    observe(data);
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
// observe
function Observer(data) {
    this.data = data;
    this.walk(data);
}
Observer.prototype = {
    constructor: Observer,
    walk: function (data) {
        var _this = this;
        Object.keys(data).forEach(function (key) {
            _this.convert(key, data[key]);
        });
    },
    convert: function (key, val) {
        this.defineReactive(this.data, key, val);
    },
    defineReactive: function (data, key, val) {
        console.log('defineReactive', data, key, val);
        var dep = new Dep();
        var childObj = observe(val);
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function () {
                console.log('observer get', val);
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            set: function (newVal) {
                console.log('observer set', newVal);
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 如果新值是object 进行监听
                childObj = observe(newVal);
                dep.notify();
            }
        });
    }
};
function observe(value) {
    console.log('observe', value);
    if (!value || typeof value !== 'object') {
        return;
    }
    return new Observer(value);
}
var uid = 0;
function Dep() {
    this.id = uid++;
    this.subs = [];
}
Dep.prototype = {
    constructor: Dep,
    addSub: function (sub) {
        console.log('addSub', sub);
        this.subs.push(sub);
    },
    depend: function () {
        console.log('depend', this);
        // 调用别处的func
        Dep.target.addDep(this);
    },
    removeSub: function (sub) {
        console.log('removeSub', sub);
        var index = this.subs.indexOf(sub);
        if (index !== -1) {
            this.subs.splice(index, 1);
        }
    },
    notify: function () {
        console.log('notify', this);
        this.subs.forEach(function (sub) {
            sub.update();
        });
    }
};
Dep.target = null;
