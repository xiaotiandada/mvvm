console.log('compile');
// 一些默认的数据
// @ts-ignore
var data = {
    helloWrold: 'hello world in data',
    input: "i'm input data..."
};
// 写死的事件方法
function test() {
    console.log(11);
}
function Compile(el, vm) {
    this.$vm = vm;
    // 获取 el
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    if (this.$el) {
        // 创建 fragment
        this.$fragment = this.node2Fragment(this.$el);
        // 初始化渲染
        this.init();
        // 添加到 el
        this.$el.appendChild(this.$fragment);
    }
}
Compile.prototype = {
    constructor: Compile,
    node2Fragment: function (el) {
        var fragmennt = document.createDocumentFragment();
        var child = null;
        // 如果使用appendChid方法将原dom树中的节点添加到DocumentFragment中时，会删除原来的节点。
        // https://blog.csdn.net/cc18868876837/article/details/87348816
        // 个节点不可能同时出现在文档的不同位置。所以，如果某个节点已经拥有父节点，在被传递给此方法后，它首先会被移除，再被插入到新的位置
        // https://blog.csdn.net/xzxlemontea/article/details/108766626
        while (child = el.firstChild) {
            fragmennt.appendChild(child);
        }
        return fragmennt;
    },
    init: function () {
        this.compileElement(this.$fragment);
    },
    compileElement: function (el) {
        var _this = this;
        var childNodes = el.childNodes;
        [].slice.call(childNodes).forEach(function (node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/;
            // 找到 element nnode
            if (_this.isElementNode(node)) {
                _this.compile(node);
            }
            else if (_this.isTextNode(node) && reg.test(text)) {
                // 找到 text node
                // RegExp.$1 解析出 {{ val }} val的内容，然后根据 key，从 data 里面获取
                // this.compileText(node, RegExp.$1.trim())
                // @ts-ignore
                _this.compileText(node, data[RegExp.$1.trim()]);
            }
            // 如果 node 有子节点，递归
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
                console.log('attrName', exp, dir);
                // 如果是事件指令
                // v-on:click="xxxxx"
                if (_this.isEventDirective(dir)) {
                    console.log('attrName dir', exp, dir);
                    compileUtil.eventHander(node, _this.$vm, exp, dir);
                    node.removeAttribute(attrName);
                }
                else {
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
    isElementNode: function (node) {
        return node.nodeType == 1;
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
    "class": function (node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },
    model: function (node, vm, exp) {
        this.bind(node, vm, exp, 'model');
        var val = exp;
        node.addEventListener('input', function (e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            val = newValue;
            console.log('newValue', newValue);
            console.log('val', val);
        });
    },
    // bind 去执行 updater
    bind: function (node, vm, exp, dir) {
        console.log('bind', node, vm, exp, dir);
        var updaterFn = updater[dir + 'Updater'];
        updaterFn && updaterFn(node, exp);
    },
    // 事件处理
    eventHander: function (node, vm, exp, dir) {
        // on:click => click
        var eventType = dir.split(':')[1];
        if (eventType) {
            // 暂时写死
            node.addEventListener(eventType, test, false);
        }
    }
};
var updater = {
    textUpdater: function (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    htmlUpdater: function (node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    classUpdater: function (node, value) {
        var className = node.className;
        className = className.replace(/\s$/, '');
        var space = className && String(value) ? ' ' : '';
        node.className = className + space + value;
    },
    modelUpdater: function (node, value) {
        // node.value = typeof value == 'undefined' ? '' : value
        // 从 data 里面获取数据
        // @ts-ignore
        var val = data[value];
        node.value = typeof val == 'undefined' ? '' : val;
    }
};
// @ts-ignore
var compile = new Compile(document.querySelector('#app'), this);
console.log(compile);
