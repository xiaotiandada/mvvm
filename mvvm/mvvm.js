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
    // @ts-ignore
    this.$compile = new Compile(options.el || document.body, this);
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
// compile
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
        // console.log('compileText node', node)
        // console.log('compileText exp', exp)
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
            _this._setVMVal(_this, exp, newValue);
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
        // TODO
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
        console.log('vmvvvv', exp, value);
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
        // console.log('html', node, value)
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    classUpdater: function (node, value) {
        var className = node.className;
        className = className.replace(/\s$/, '');
        var space = className && String(value) ? ' ' : '';
        node.className = className + space + value;
    },
    modelUpdater: function (node, value) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};
