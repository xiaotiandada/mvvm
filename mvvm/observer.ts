interface dataInterface {
  name: String,
  obj: {
    aaa: String,
    b?: Number
  }
}

let data: dataInterface = {
  name: 'hi',
  obj: {
    aaa: '1'
  }
}

observe(data)

data.name = 'hello world'
data.name = 'hello world1'
data.name = 'hello world2'
data.name = 'hello world3'


data.obj.aaa = 'aaa111'
data.obj.aaa = 'aaa222'
data.obj.aaa = 'aaa333'
data.obj.aaa = 'aaa444'

data.obj = {
  aaa: '123123',
  b: 1,
}

function observe(data: any) {
  if (!data || typeof data !== 'object') {
    return
  }

  Object.keys(data).forEach(key => {
    defineReactive(data, key, data[key])
  })
}

function defineReactive<T extends object, K extends keyof T>(data: T, key: K, val: unknown) {
  observe(val) // 监听子属性

  Object.defineProperty(data, key, {
    enumerable: true, // 可枚举
    configurable: false,// 不能再define
    get: () => {
      return val
    },
    set: newVal => {
      console.log(val, ' -----> ', newVal)
      val = newVal
    }
  })
}
