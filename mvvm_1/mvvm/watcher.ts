function Watcher() {

}

Watcher.prototype = {
  get: function(key: any){
    Dep.target = this
    // @ts-ignore
    this.value = data[key] // 这里会触发属性的 getter，从而添加订阅者
    Dep.target = null
  }
}