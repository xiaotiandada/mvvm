function Observer(data: any) {
  // @ts-ignore
  this.data = data
  // @ts-ignore
  this.walk(data)
}

Observer.prototype = {
  walk: function(data: any) {
    Object.keys(data).forEach(key => {
      this.convert(key, data[key])
    })
  },
  convert: function(key: any, val: any) {
    this.defineReactive(this.data, key, val)
  },
  defineReactive: function(data: any, key: any, val: any) {
    // @ts-ignore
    let dep = new Dep()

    let childObj = observe(val) // 监听子属性

    Object.defineProperty(data, key, {
      enumerable: true, // 可枚举
      configurable: false,// 不能再define
      get: function() {
        if (Dep.target) {
          dep.depend()
        }
        return val
      },
      set: function(newVal: any) {
        if (newVal === val) return
        console.log(val, ' -----> ', newVal)
        val = newVal
        // 新的值是object的话，进行监听
        childObj = observe(newVal)
         // 通知所有订阅者
        dep.notify()
      }
    })
  }
}

function observe(value: any) {
  if (!value || typeof value !== 'object') {
    return
  }

  // @ts-ignore
  return new Observer(value)
}

let uid = 0

function Dep() {
  // @ts-ignore
  this.subs = []
  // @ts-ignore
  this.id = uid++
}

Dep.prototype = {
  addSub: function(sub: any) {
    this.subs.push(sub)
  },
  depend: function() {
    Dep.target.addDep(this)
  },
  removeSub: function(sub: any) {
    let index = this.subs.indexOf(sub)
    if (index != -1) {
      this.subs.splice(index, 1)
    }
  },
  notify: function() {
    this.subs.forEach((sub: any) => {
      sub.update()
    });
  }
}

// @ts-ignore
Dep.target = null;
