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