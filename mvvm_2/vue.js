class Dep {
  constructor() {
    this.subs = []
  }
  // 添加
  addSub(watcher) {
    this.subs.push(watcher)
  }
  // 发布
  notify() {
    this.subs.forEach(w => w.update())
  }
}

class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm
    this.expr = expr
    this.cb = cb

    // old value
    this.oldValue = this.get()
  }
  get() {
    Dep.target = this
    let value = CompileUtil.getVal(this.vm, this.expr)
    Dep.target = null
    return value
  }
  update() {
    let newVal = CompileUtil.getVal(this.vm, this.expr)
    if (newVal !== this.oldValue) {
      this.cb(newVal)
    }
  }
}

// 数据劫持
class Observer {
  constructor(data) {
    this.observer(data)
  }
  observer(data) {
    if (data && typeof data === 'object') {
      for (const key in data) {
        this.defineReactive(data, key, data[key])
      }
    }
  }
  defineReactive(obj, key, value) {
    // 处理value是对象
    this.observer(value)

    let dep = new Dep()

    Object.defineProperty(obj, key, {
      get() {
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      set: (newVal) => {
        console.log('newVal', newVal)
        if (newVal !== value) {
          // 新value处理数据劫持
          this.observer(newVal)

          value = newVal

          dep.notify()
        }
      }
    })
  }
}

const CompileUtil = {
  // 根据 expr 获取数据
  getVal(vm, expr) {
    return expr.split('.').reduce((data, current) => {
      return data[current]
    }, vm.$data)
  },
  // 根据 expr 设置 value
  setVal(vm, expr, value) {
    expr.split('.').reduce((data, current, index, arr) => {
      if (index === arr.length - 1) {
        return data[current] = value
      }
      return data[current]
    }, vm.$data)
  },
  model(node, expr, vm) {
    this.bind(node, expr, vm, 'model')

    node.addEventListener('input', e => {
      let value = e.target.value
      this.setVal(vm, expr, value)
    })
  },
  text(node, expr, vm) {
    this.bind(node, expr, vm, 'text')
  },
  html(node, expr, vm) {
    this.bind(node, expr, vm, 'html')
  },
  class(node, expr, vm) {
    this.bind(node, expr, vm, 'class')
  },
  bind(node, expr, vm, dir) {
    let fn = this.updater[dir + 'Updater']
    let value = this.getVal(vm, expr)

    new Watcher(vm, expr, (newVal) => {
      console.log(`${dir} watcher`, newVal)
      fn(node, newVal)
    })

    fn(node, value)
  },
  // 事件处理
  eventHander(node, expr, vm, dir) {
    node.addEventListener(dir, e => {
      vm.$data[expr].call(vm, e)
    }, false)
  },
  updater: {
    modelUpdater(node, value) {
      node.value = value
    },
    textUpdater(node, value) {
      node.textContent = value
    },
    htmlUpdater(node, value) {
      node.innerHTML = value
    },
    classUpdater(node, value) {
      let className = node.className
      className = className.replace(/\s$/, '')
      const space = className && String(value) ? ' ' : ''
      node.className = className + space + value
    }
  }
}

class Compiler {
  constructor(el, vm) {
    this.$vm = vm
    this.$el = this.isElementNode(el) ? el : document.querySelector(el)

    if (this.$el) {
      // 处理节点到fragment里
      this.$fragment = this.node2fragment(this.$el)
      // console.log('fragment', this.$fragment)

      // 编译模版
      this.compile(this.$fragment)

      // 把内容添加到页面中
      this.$el.appendChild(this.$fragment)
    }
  }

  compile(node) {
    let childNodes = node.childNodes
    ;[...childNodes].forEach(child => {
      // 如果是元素节点
      if (this.isElementNode(child)) {
        this.compileElement(child)
      } else if (this.isTextNode(child)) {
        // 如果是文字
        this.compileText(child)
      }

      // 继续遍历子节点
      if (node.childNodes && node.childNodes.length) {
        this.compile(child)
      }
    });
  }

  // 编译元素
  compileElement(node) {
    let attributes = node.attributes
    ;[...attributes].forEach(attr => {
      let { name, value: expr } = attr
      // 指令
      if (this.isDirective(name)) {
        let [, directive] = name.split('-')

        // 事件指令
        if (this.isEventDirective(directive)) {
          let [, eventName] = directive.split(':')
          CompileUtil.eventHander(node, expr, this.$vm, eventName)
          node.removeAttribute(name)
        } else {
          // 普通
          CompileUtil[directive] && CompileUtil[directive](node, expr, this.$vm)
        }

        // 解析后删除属性
        if (CompileUtil[directive]) {
          node.removeAttribute(name)
        }
      }
    })
  }
  // 编译文本
  compileText(node) {
    let content = node.textContent
    let reg = /\{\{(.+?)\}\}/
    if (reg.test(content)) {
      // RegExp.$1.trim() === {{ a }} 的 a
      CompileUtil.text(node, RegExp.$1.trim(), this.$vm)
    }

    // content.replace(/\{\{(.+?)\}\}/g, (...args) => {
    //   console.log(111, args[1].trim())
    //   CompileUtil.text(node, args[1].trim(), this.$vm)
    // })
  }

  // 把所有 node 移动到 fragment 里面
  node2fragment(node) {
    // 创建 fragment
    let fragment = document.createDocumentFragment()
    let child

    // 拷贝
    while (child = node.firstChild) {
      fragment.appendChild(child)
    }

    return fragment
  }
  // 是否为指令
  isDirective(attrName) {
    return  attrName.startsWith('v-')
  }
  // 是否为事件
  isEventDirective(dir) {
    return  dir.startsWith('on')
  }
  // 判断是不是元素节点
  isElementNode(node) {
    return node.nodeType === 1
  }
  isTextNode(node) {
    return node.nodeType === 3
  }
}

class Vue {
  constructor(options) {
    this.$el = options.el
    this.$data = options.data
    this.$computed = options.computed
    this.$methods = options.methods

    new Observer(this.$data)

    // 先挂载到 $data 里面
    this.initComputed(this.$computed)
    this.initMethods(this.$methods)

    // 再挂载到 this 里面
    this.proxyVm(this.$data)

    // 编译模版
    new Compiler(this.$el || document.body, this)
  }

  // 代理 data 访问vm的属性代理访问vm._data的属性
  proxyVm(data) {
    for (const key in data) {
      Object.defineProperty(this, key, {
        configurable: false,
        enumerable: true,
        get() {
          return data[key]
        },
        set(newVal) {
          data[key] = newVal
        }
      })
    }
  }

  // 添加 computed
  initComputed(computed) {
    if (typeof computed === 'object') {
      for (const key in computed) {
        Object.defineProperty(this.$data, key, {
          get() {
            return computed[key].call(this)
          },
          set() {}
        })
      }
    }
  }

  // 添加 methods
  initMethods(methods) {
    if (typeof methods === 'object') {
      for (const key in methods) {
        Object.defineProperty(this.$data, key, {
          get() {
            return methods[key]
          },
          set() {}
        })
      }
    }
  }
}