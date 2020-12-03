console.log('mvvm')

interface MvvmProps {
  options: {
    data: {},
    computed: {},
    el: HTMLElement
  }
}

function MVVM(options: MvvmProps) {
  this.$options = options || {}
  let data = this._data = this.$options.data

  Object.keys(data).forEach(key => {
    this._proxyData(key)
  })

  this._initComputed()

  observe(data)

  // @ts-ignore
  this.$compile = new Compile(options.el || document.body, this)
}


MVVM.prototype = {
  constructor: MVVM,
  $watch(key: string, cb: any, options: any) {
    // @ts-ignore
    new Watcher(this, key, cb)
  },
  // 添加一个属性代理的方法 使访问vm的属性代理为访问vm._data的属性
  _proxyData(key: string, setter: unknown, getter: unknown) {
    console.log('_proxyData', key, setter, getter)

    setter = setter ||
    Object.defineProperty(this, key, {
      configurable: false,
      enumerable: true,
      get() {
        return this._data[key]
      },
      set(newVal){
        console.log('newVal', newVal)
        this._data[key] = newVal
      }
    })

    console.log('me', this)
  },

  // 添加 computed
  _initComputed() {
    let computed = this.$options.computed
    if (typeof computed === 'object') {
      Object.keys(computed).forEach(key => {
        console.log('computed key', key)
        Object.defineProperty(this, key, {
          get() {
            return typeof computed[key] === 'function' ?
              computed[key] :
              computed[key].get
          },
          set() {}
        })
      })
    }

    console.log('me', this)
  }
}

// observe
function Observer(data: object) {
  this.data = data
  this.walk(data)
}


Observer.prototype = {
  constructor: Observer,
  walk(data: { [key: string]: any }) {
    Object.keys(data).forEach(key => {
      this.convert(key, data[key])
    })
  },
  convert(key: string, val: any) {
    this.defineReactive(this.data, key, val)
  },
  defineReactive(data: object, key: string, val: any) {
    console.log('defineReactive', data, key, val)
    // @ts-ignore
    let dep = new Dep()
    let childObj = observe(val)

    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: false,
      get() {
        console.log('observer get', val)
        if (Dep.target) {
          dep.depend()
        }
        return val
      },
      set(newVal) {
        console.log('observer set', newVal)
        if (newVal === val) {
          return
        }

        val = newVal
        // 如果新值是object 进行监听
        childObj = observe(newVal)

        dep.notify()
      }
    })
  }
}

function observe(value: object): any {
  console.log('observe', value)
  if (!value || typeof value !== 'object') {
    return
  }
  // @ts-ignore
  return new Observer(value)
}

let uid: number = 0

function Dep() {
  this.id = uid++
  this.subs = []
}

Dep.prototype = {
  constructor: Dep,
  addSub(sub: unknown) {
    console.log('addSub', sub)
    this.subs.push(sub)
  },
  depend() {
    console.log('depend', this)
    // 调用别处的func
    Dep.target.addDep(this)
  },
  removeSub(sub: unknown) {
    console.log('removeSub', sub)
    let index = this.subs.indexOf(sub)
    if (index !== -1) {
      this.subs.splice(index, 1)
    }
  },
  notify() {
    console.log('notify', this)

    this.subs.forEach((sub: { update: Function }) => {
      sub.update() // 调用订阅者的update方法，通知变化
    });
  }
}
// @ts-ignore
Dep.target = null



// compile

function Compile(el:any, vm: Window) {
  this.$vm = vm
  this.$el = this.isElementNode(el) ? el : document.querySelector(el)

  if (this.$el) {
    this.$fragment = this.node2Fragment(this.$el)
    this.init()
    this.$el.appendChild(this.$fragment)
  }

}

Compile.prototype = {
  constructor: Compile,

  node2Fragment(el: HTMLElement) {
    let fragment = document.createDocumentFragment()
    let child

    // 将原生节点拷贝到fragment
    while (child = el.firstChild) {
      fragment.appendChild(child)
    }

    return fragment
  },
  init() {
    this.compileElement(this.$fragment);
  },
  compileElement(el: HTMLElement) {
    let childNodes = el.childNodes

    ;[].slice.call(childNodes).forEach((node: HTMLElement) => {
      let text: string = node.textContent || '';
      let reg = /\{\{(.*)\}\}/;

      // 按元素节点方式编译
      if (this.isElementNode(node)) {
        this.compile(node);
      } else if (this.isTextNode(node) && reg.test(text)) {
        // 如果是文字 compile text
        // 找到 text node
        // RegExp.$1 解析出 {{ val }} val的内容，然后根据 key，从 data 里面获取
        // this.compileText(node, RegExp.$1.trim())
        this.compileText(node, RegExp.$1.trim());
      }
      // 遍历编译子节点
      if (node.childNodes && node.childNodes.length) {
        this.compileElement(node);
      }
    });
  },
  compile(node: HTMLElement) {
    let nodeAttrs = node.attributes

    ;[].slice.call(nodeAttrs).forEach((attr: any) => {
      let attrName = attr.name

      // 如果有 v-x 指令
      // v-text="xxxx"
      if (this.isDirective(attrName)) {
        let exp = attr.value
        let dir = attrName.substring(2)

        // 事件指令
        // v-on:click="xxxxx"
        if (this.isEventDirective(dir)) {
          compileUtil.eventHander(node, this.$vm, exp, dir)

          node.removeAttribute(attrName)
        } else {
          // 普通指令
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
    // console.log('compileText node', node)
    // console.log('compileText exp', exp)
    compileUtil.text(node, this.$vm, exp)
  },
  isDirective: function(attr: string) {
      return attr.indexOf('v-') == 0;
  },
  isEventDirective: function(dir: string) {
      return dir.indexOf('on') === 0;
  },
  // 判断是不是node
  isElementNode(node: Node) {
    return node.nodeType === 1
  },
  isTextNode: function(node: Node) {
      return node.nodeType == 3;
  }
}

// 指令处理集合
const compileUtil: any = {
  text(node: HTMLElement, vm: Window, exp: any) {
      this.bind(node, vm, exp, 'text')
  },
  html(node: any, vm: any, exp: any) {
    this.bind(node, vm, exp, 'html')
  },
  model(node: any, vm: any, exp: any) {
    this.bind(node, vm, exp, 'model')

    let val = this._getVMVal(vm, exp)
    node.addEventListener('input', (e: any) => {
      let newValue = e.target.value
      if (val === newValue) {
        return
      }

      this._setVMVal(this, exp, newValue)
      val = newValue
    })
  },
  class(node: any, vm: any, exp: any) {
    this.bind(node, vm, exp, 'class')
  },
  // bind 去执行 updater
  bind(node: any, vm: any, exp: any, dir: any) {
      // console.log('bind', exp, dir)
      let updaterFn = updater[dir + 'Updater']
      updaterFn && updaterFn(node, this._getVMVal(vm, exp))

      // @ts-ignore
      new Watcher(vm, exp, function(value: any, oldValue: any) {
        console.log('compile watcher')
        updaterFn && updaterFn(node, value, oldValue)
      })
  },
  // 事件处理
  eventHander(node:any, vm: any, exp: any, dir: any) {
      let eventType = dir.split(':')[1]
      let fn = vm.$options.methods && vm.$options.methods[exp]

      if (eventType && fn) {
          node.addEventListener(eventType, fn.bind(vm), false)
      }
  },
  // 获取value，exp可能是 xx.xx
  _getVMVal(vm: any, exp: any) {
    let val = vm
    exp = exp.split('.')
    exp.forEach((k: string) => {
      val = val[k]
    })
    return val
  },
  _setVMVal(vm: any, exp: any, value: string) {
    console.log('vmvvvv', exp, value)
    let val = vm
    exp = exp.split('.')
    exp.forEach((k: string, i: number) => {
      // 非最后一个key，更新val的值
      if (i < exp.length - 1) {
        val = val[k]
      } else {
        val[k] = value
      }
    });
  }
}

let updater: any = {
  textUpdater(node: any, value: any) {
      node.textContent = typeof value == 'undefined' ? '' : value
  },
  htmlUpdater(node: any, value: any) {
    // console.log('html', node, value)
    node.innerHTML = typeof value == 'undefined' ? '' : value
  },
  classUpdater(node: any, value: any) {
      let className = node.className
      className = className.replace(/\s$/, '')

      let space = className && String(value) ? ' ' : ''

      node.className = className + space + value
  },
  modelUpdater(node: any, value: any) {
      node.value = typeof value == 'undefined' ? '' : value
  },
}

// watcher
function Watcher(vm: any, expOrFn: string, cb: Function) {
  this.cb = cb
  this.vm = vm
  this.expOrFn = expOrFn
  this.depIds = {}

  if (typeof expOrFn === 'function') {
    this.getter = expOrFn
  } else {
    this.getter = this.parseGetter(expOrFn.trim())
  }

  // 此处为了触发属性的getter，从而在dep添加自己，结合Observer更易理解
  this.value = this.get()

}

Watcher.prototype = {
  constructor: Watcher,
  update() {
    console.log('Watcher update')

    this.run() // 属性值变化收到通知
  },
  run() {
    console.log('Watcher run')

    let value = this.get() // 取到最新值
    let oldVal = this.value
    if (value !== oldVal) {
      this.value = value
      this.cb.call(this.vm, value, oldVal) // 执行Compile中绑定的回调，更新视图
    }
  },
  addDep(dep: { id: number, addSub: Function }) {
    console.log('Watcher addDep')

    if (!this.depIds.hasOwnProperty(dep.id)) {
      dep.addSub(this)
      this.depIds[dep.id] = dep
    }
  },
  get() {
    console.log('Watcher get')

    Dep.target = this // 将当前订阅者指向自己
    let value = this.getter.call(this.vm, this.vm) // 触发getter，添加自己到属性订阅器中
    Dep.target = null // 添加完毕，重置
    return value
  },

  parseGetter(exp: string) {
    if (/[^\w.$]/.test(exp)) return;

    let exps: string[] = exp.split('.')

    return function(obj: any) {
      for (let i = 0, len = exps.length; i < len; i++) {
        if (!obj) return
        obj = obj[exps[i]]
      }
      return
    }
  }
}