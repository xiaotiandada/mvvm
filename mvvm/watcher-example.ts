// @ts-ignore
function Watcher(vm: any, expOrFn: Function | any, cb: Function | any) {
    this.cb = cb
    this.vm = vm
    this.expOrFn = expOrFn
    this.depIds = {}

    this.value = this.get()
}


Watcher.prototype = {
    constructor: Watcher,
    update() {
        this.run()
    },
    run() {
        console.log('执行 run...')
    },
    addDep(dep: any) {
        console.log('add dep', dep)
    },
    get() {
        console.log('get')
        return 'get'
    }
}

// @ts-ignore
let watcher = new Watcher('', '', '')

// addDep
watcher.addDep('x')

// 通知变化...
watcher.update()

