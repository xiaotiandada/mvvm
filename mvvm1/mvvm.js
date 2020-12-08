// ================== Observer ==================
// 劫持监听所有属性
// @ts-ignore
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
    /**
     * 定义
     * @param data data 数据
     * @param key data 的 key
     * @param val data key 的 val
     */
    defineReactive: function (data, key, val) {
        var dep = new Dep();
        // 监听子对象
        var childObj = observe(val);
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: false,
            get: function () {
                // 由于需要在闭包内添加watcher，所以通过Dep定义一个全局target属性，暂存watcher, 添加完移除
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            set: function (newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 如果新值是object 进行监听
                childObj = observe(newVal);
                // 去通知
                dep.notify();
            }
        });
    }
};
// @ts-ignore
function observe(value) {
    // console.log('observe', value)
    if (!value || typeof value !== 'object') {
        return;
    }
    return new Observer(value);
}
var uid = 0;
// 消息订阅器 维护一个数组 用来收集订阅者 数据变化触动 notify 再调用订阅者的update方法
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
            sub.update(); // 调用订阅者的update方法，通知变化
        });
    }
};
Dep.target = null;
// ================== Watcher ==================
function Watcher(vm, expOrFn, cb) {
    this.cb = cb;
    this.vm = vm;
    this.expOrFn = expOrFn;
    this.depIds = {};
    if (typeof expOrFn === 'function') {
        this.getter = expOrFn;
    }
    else {
        this.getter = this.parseGetter(expOrFn.trim());
    }
    // 此处为了触发属性的getter，从而在dep添加自己
    this.value = this.get();
}
Watcher.prototype = {
    constructor: Watcher,
    update: function () {
        this.run(); // 属性值变化收到通知
    },
    run: function () {
        console.log('Watcher run');
        var value = this.get(); // 取到最新值
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            // 执行Compile中绑定的回调，更新视图
            this.cb.call(this.vm, value, oldVal);
        }
    },
    addDep: function (dep) {
        // 1. 每次调用run()的时候会触发相应属性的getter
        // getter里面会触发dep.depend()，继而触发这里的addDep
        // 2. 假如相应属性的dep.id已经在当前watcher的depIds里，说明不是一个新的属性，仅仅是改变了其值而已
        // 则不需要将当前watcher添加到该属性的dep里
        // 3. 假如相应属性是新的属性，则将当前watcher添加到新属性的dep里
        // 如通过 vm.child = {name: 'a'} 改变了 child.name 的值，child.name 就是个新属性
        // 则需要将当前watcher(child.name)加入到新的 child.name 的dep里
        // 因为此时 child.name 是个新值，之前的 setter、dep 都已经失效，如果不把 watcher 加入到新的 child.name 的dep中
        // 通过 child.name = xxx 赋值的时候，对应的 watcher 就收不到通知，等于失效了
        // 4. 每个子属性的watcher在添加到子属性的dep的同时，也会添加到父属性的dep
        // 监听子属性的同时监听父属性的变更，这样，父属性改变时，子属性的watcher也能收到通知进行update
        // 这一步是在 this.get() --> this.getVMVal() 里面完成，forEach时会从父级开始取值，间接调用了它的getter
        // 触发了addDep(), 在整个forEach过程，当前wacher都会加入到每个父级过程属性的dep
        // 例如：当前watcher的是'child.child.name', 那么child, child.child, child.child.name这三个属性的dep都会加入当前watcher
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    },
    get: function () {
        console.log('Watcher get');
        // Dep.target 设置为 this
        Dep.target = this; // 将当前订阅者指向自己
        // 调用 getter
        var value = this.getter.call(this.vm, this.vm); // 触发getter，添加自己到属性订阅器中
        Dep.target = null; // 添加完毕，重置
        return value;
    },
    parseGetter: function (exp) {
        if (/[^\w.$]/.test(exp))
            return;
        var exps = exp.split('.');
        return function (obj) {
            for (var i = 0, len = exps.length; i < len; i++) {
                if (!obj)
                    return;
                obj = obj[exps[i]];
            }
            return obj;
        };
    }
};
// ================== Compile ==================
function Compile(el, vm) {
    this.$vm = vm;
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    if (this.$el) {
        this.$fragment = this.node2Fragment(this.$el);
        this.init();
        this.$el.appendChild(this.$fragment);
    }
}
Compile.prototype = {
    constructor: Compile,
    node2Fragment: function (el) {
        var fragment = document.createDocumentFragment();
        var child;
        // 将原生节点拷贝到fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    },
    init: function () {
        this.compileElement(this.$fragment);
    },
    compileElement: function (el) {
        var _this = this;
        var childNodes = el.childNodes;
        [].slice.call(childNodes).forEach(function (node) {
            var text = node.textContent || '';
            var reg = /\{\{(.*)\}\}/;
            // 按元素节点方式编译
            if (_this.isElementNode(node)) {
                _this.compile(node);
            }
            else if (_this.isTextNode(node) && reg.test(text)) {
                // 如果是文字 compile text
                // 找到 text node
                // RegExp.$1 解析出 {{ val }} val的内容，然后根据 key，从 data 里面获取
                // this.compileText(node, RegExp.$1.trim())
                _this.compileText(node, RegExp.$1.trim());
            }
            // 遍历编译子节点
            if (node.childNodes && node.childNodes.length) {
                _this.compileElement(node);
            }
        });
    },
    compile: function (node) {
        var _this = this;
        var nodeAttrs = node.attributes;
        [].slice.call(nodeAttrs).forEach(function (attr) {
            var attrName = attr.name;
            // 如果有 v-x 指令
            // v-text="xxxx"
            if (_this.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2);
                // 事件指令
                // v-on:click="xxxxx"
                if (_this.isEventDirective(dir)) {
                    compileUtil.eventHander(node, _this.$vm, exp, dir);
                    node.removeAttribute(attrName);
                }
                else {
                    // 普通指令
                    compileUtil[dir] && compileUtil[dir](node, _this.$vm, exp);
                }
                // 解析过的才被移除
                if (compileUtil[dir]) {
                    node.removeAttribute(attrName);
                }
            }
        });
    },
    compileText: function (node, exp) {
        compileUtil.text(node, this.$vm, exp);
    },
    isDirective: function (attr) {
        return attr.indexOf('v-') == 0;
    },
    isEventDirective: function (dir) {
        return dir.indexOf('on') === 0;
    },
    // 判断是不是node
    isElementNode: function (node) {
        return node.nodeType === 1;
    },
    isTextNode: function (node) {
        return node.nodeType == 3;
    }
};
// 指令处理集合
var compileUtil = {
    text: function (node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },
    html: function (node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },
    model: function (node, vm, exp) {
        var _this = this;
        this.bind(node, vm, exp, 'model');
        var val = this._getVMVal(vm, exp);
        node.addEventListener('input', function (e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            _this._setVMVal(vm, exp, newValue);
            console.log('vm', vm);
            val = newValue;
        });
    },
    "class": function (node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },
    // bind 去执行 updater
    bind: function (node, vm, exp, dir) {
        // console.log('bind', exp, dir)
        var updaterFn = updater[dir + 'Updater'];
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));
        new Watcher(vm, exp, function (value, oldValue) {
            console.log('compile watcher');
            updaterFn && updaterFn(node, value, oldValue);
        });
    },
    // 事件处理
    eventHander: function (node, vm, exp, dir) {
        var eventType = dir.split(':')[1];
        var fn = vm.$options.methods && vm.$options.methods[exp];
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    // 获取value，exp可能是 xx.xx
    _getVMVal: function (vm, exp) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k) {
            val = val[k];
        });
        return val;
    },
    _setVMVal: function (vm, exp, value) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            }
            else {
                val[k] = value;
            }
        });
    }
};
var updater = {
    textUpdater: function (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    htmlUpdater: function (node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    classUpdater: function (node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');
        var space = className && String(value) ? ' ' : '';
        node.className = className + space + value;
    },
    modelUpdater: function (node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};
// ================== MVVM ==================
function MVVM(options) {
    var _this = this;
    this.$options = options || {};
    var data = this._data = this.$options.data;
    Object.keys(data).forEach(function (key) {
        _this._proxyData(key);
    });
    this._initComputed();
    observe(data);
    // @ts-ignore
    this.$compile = new Compile(options.el || document.body, this);
}
MVVM.prototype = {
    constructor: MVVM,
    $watch: function (key, cb, options) {
        new Watcher(this, key, cb);
    },
    // 添加一个属性代理的方法 使访问vm的属性代理为访问vm._data的属性
    _proxyData: function (key, setter, getter) {
        setter = setter ||
            Object.defineProperty(this, key, {
                configurable: false,
                enumerable: true,
                get: function () {
                    return this._data[key];
                },
                set: function (newVal) {
                    this._data[key] = newVal;
                }
            });
    },
    // 添加 computed
    _initComputed: function () {
        var _this = this;
        var computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function (key) {
                Object.defineProperty(_this, key, {
                    get: function () {
                        return typeof computed[key] === 'function'
                            ? computed[key]
                            : computed[key].get;
                    },
                    set: function () { }
                });
            });
        }
    }
};
