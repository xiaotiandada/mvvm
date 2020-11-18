console.log('mvvm')

interface MvvmProps {
  options: {
    data: {},
    computed: {}
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
}


MVVM.prototype = {
  constructor: MVVM,
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
  walk(data) {
    Object.keys(data).forEach(key => {
      this.convert(key, data[key])
    })
  },
  convert(key, val) {
    this.defineReactive(this.data, key, val)
  },
  defineReactive(data: object, key: string, val: any) {
    console.log('defineReactive', data, key, val)
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
      sub.update()
    });
  }
}

Dep.target = null