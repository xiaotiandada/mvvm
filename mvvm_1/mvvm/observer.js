function Observer(data) {
    // @ts-ignore
    this.data = data;
    // @ts-ignore
    this.walk(data);
}
Observer.prototype = {
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
        // @ts-ignore
        var dep = new Dep();
        var childObj = observe(val); // 监听子属性
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function () {
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            set: function (newVal) {
                if (newVal === val)
                    return;
                console.log(val, ' -----> ', newVal);
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通知所有订阅者
                dep.notify();
            }
        });
    }
};
function observe(value) {
    if (!value || typeof value !== 'object') {
        return;
    }
    // @ts-ignore
    return new Observer(value);
}
var uid = 0;
function Dep() {
    // @ts-ignore
    this.subs = [];
    // @ts-ignore
    this.id = uid++;
}
Dep.prototype = {
    addSub: function (sub) {
        this.subs.push(sub);
    },
    depend: function () {
        Dep.target.addDep(this);
    },
    removeSub: function (sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },
    notify: function () {
        this.subs.forEach(function (sub) {
            sub.update();
        });
    }
};
// @ts-ignore
Dep.target = null;
