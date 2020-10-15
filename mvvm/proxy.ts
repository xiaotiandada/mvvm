{
    let target: any = {
        message1: 'hello',
        message2: 'everyone',
    }

    const handlers = {
        // @ts-ignore
        set (obj, prop, value) {
            console.log('obj, prop, value', obj, prop, value)
            obj[prop] = value
        },
        get (target: any, prop: any, receiver: any) {
            console.log('target, prop, receiver', target, prop, receiver)
            return target[prop]
        }
    }
    // @ts-ignore
    const proxy1 = new Proxy(target, handlers)

    console.log(proxy1.message1); // hello
    console.log(proxy1.message2); // everyone

    proxy1.message1 = 1

    console.log(proxy1.message1); // hello
    console.log(proxy1.message2); // everyone

    console.log('proxy1 and target', proxy1, target); // hello


}

console.log('-------')

{
    let target = { age: 18, name: 'Niko Bellic' }
    let handlers = {
    // @ts-ignore
    get (target, property) {
        return `${property}: ${target[property]}`
    },
    // @ts-ignore
    set (target, property, value) {
        target[property] = value
        console.log(111)
    }
    }
    // @ts-ignore
    let proxy = new Proxy(target, handlers)

    proxy.age = 19
    console.log(target.age, proxy.age)   // 19,          age : 19
    console.log(target.name, proxy.name) // Niko Bellic, name: Niko Bellic

}