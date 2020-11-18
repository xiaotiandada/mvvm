// @ts-ignore
function Watcher(vm, expOrFn, cb) {
    this.cb = cb;
    this.vm = vm;
    this.expOrFn = expOrFn;
    this.depIds = {};
    this.value = this.get();
}
Watcher.prototype = {
    constructor: Watcher,
    update: function () {
        this.run();
    },
    run: function () {
        console.log('执行 run...');
    },
    addDep: function (dep) {
        console.log('add dep', dep);
    },
    get: function () {
        console.log('get');
        return 'get';
    }
};
// @ts-ignore
var watcher = new Watcher('', '', '');
// addDep
watcher.addDep('x');
// 通知变化...
watcher.update();
