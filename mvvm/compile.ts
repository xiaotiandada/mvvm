console.log('compile');

// 一些默认的数据
// @ts-ignore
const data: any = {
    helloWrold: 'hello world in data',
    input: `i'm input data...`
}

// 写死的事件方法
function test() {
    console.log(11)
}

function Compile(el: any, vm: any) {
    this.$vm = vm
    // 获取 el
    this.$el = this.isElementNode(el) ? el : document.querySelector(el)

    if (this.$el) {
        // 创建 fragment
        this.$fragment = this.node2Fragment(this.$el)
        // 初始化渲染
        this.init()
        // 添加到 el
        this.$el.appendChild(this.$fragment)
    }
}

Compile.prototype = {
    constructor: Compile,
    node2Fragment(el: Element) {
        let fragmennt = document.createDocumentFragment()
        let child = null

        // 如果使用appendChid方法将原dom树中的节点添加到DocumentFragment中时，会删除原来的节点。
        // https://blog.csdn.net/cc18868876837/article/details/87348816

        // 个节点不可能同时出现在文档的不同位置。所以，如果某个节点已经拥有父节点，在被传递给此方法后，它首先会被移除，再被插入到新的位置
        // https://blog.csdn.net/xzxlemontea/article/details/108766626
        while (child = el.firstChild) {
            fragmennt.appendChild(child)
        }

        return fragmennt
    },
    init() {
        this.compileElement(this.$fragment)
    },
    compileElement(el: Element) {
        let childNodes = el.childNodes

        ;[].slice.call(childNodes).forEach((node: Element) => {
            let text: any = node.textContent
            let reg: RegExp = /\{\{(.*)\}\}/

            // 找到 element nnode
            if (this.isElementNode(node)) {
                this.compile(node)
            } else if (this.isTextNode(node) && reg.test(text)) {
                // 找到 text node
                // RegExp.$1 解析出 {{ val }} val的内容，然后根据 key，从 data 里面获取
                // this.compileText(node, RegExp.$1.trim())
                // @ts-ignore
                this.compileText(node, data[RegExp.$1.trim()])
            }

            // 如果 node 有子节点，递归
            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node)
            }
        })
    },
    compile(node: Element) {
        let nodeAttrs = node.attributes

        ;[].slice.call(nodeAttrs).forEach((attr: any) => {
            let attrName = attr.name
            // 如果有 v-x 指令
            // v-text="xxxx"
            if (this.isDirective(attrName)) {
                let exp = attr.value
                let dir = attrName.substring(2)
                console.log('attrName', exp, dir)
                // 如果是事件指令
                // v-on:click="xxxxx"
                if (this.isEventDirective(dir)) {
                    console.log('attrName dir', exp, dir)
                    compileUtil.eventHander(node, this.$vm, exp, dir)

                    node.removeAttribute(attrName)
                } else {
                    compileUtil[dir] && compileUtil[dir](node, this.$vm, exp)
                }

                // 解析过的才被移除
                if (compileUtil[dir]) {
                    node.removeAttribute(attrName)
                }
            }
        })
    },
    compileText(node: any, exp: any) {
        compileUtil.text(node, this.$vm, exp)
    },
    isDirective(attr: any) {
        return attr.indexOf('v-') == 0
    },
    isEventDirective(dir: any) {
        return dir.indexOf('on') === 0
    },
    isElementNode(node: Element) {
        return node.nodeType == 1
    },
    isTextNode(node: Element) {
        return node.nodeType == 3
    }
}

// 指令处理集合
let compileUtil: any = {
    text(node: any, vm: any, exp: any) {
        this.bind(node, vm, exp, 'text')
    },
    html(node: any, vm: any, exp: any) {
        this.bind(node, vm, exp, 'html')
    },
    class(node: any, vm: any, exp: any) {
        this.bind(node, vm, exp, 'class')
    },
    model(node: any, vm: any, exp: any) {
        this.bind(node, vm, exp, 'model')

        let val = exp
        node.addEventListener('input', (e: any) => {
            let newValue = e.target.value
            if (val === newValue) {
                return
            }

            val = newValue
            console.log('newValue', newValue)
            console.log('val', val)

        })
    },
    // bind 去执行 updater
    bind(node: any, vm: any, exp: any, dir: any) {
        console.log('bind', node, vm, exp, dir)
        let updaterFn = updater[dir + 'Updater']
        updaterFn && updaterFn(node, exp)
    },
    // 事件处理
    eventHander(node:any, vm: any, exp: any, dir: any) {
        // on:click => click
        let eventType = dir.split(':')[1]
        if (eventType) {
            // 暂时写死
            node.addEventListener(eventType, test, false)
        }
    }
}

let updater: any = {
    textUpdater(node: any, value: any) {
        node.textContent = typeof value == 'undefined' ? '' : value
    },
    htmlUpdater(node: any, value: any) {
        node.innerHTML = typeof value == 'undefined' ? '' : value
    },
    classUpdater(node: any, value: any) {
        let className = node.className
        className = className.replace(/\s$/, '')
        let space = className && String(value) ? ' ' : ''
        node.className = className + space + value
    },
    modelUpdater(node: any, value: any) {
        // node.value = typeof value == 'undefined' ? '' : value

        // 从 data 里面获取数据
        // @ts-ignore
        let val = data[value]
        node.value = typeof val == 'undefined' ? '' : val
    },
}

// @ts-ignore
let compile = new Compile(document.querySelector('#app'), this)


console.log(compile)