{
    var target = {
        message1: 'hello',
        message2: 'everyone'
    };
    var handlers = {
        // @ts-ignore
        set: function (obj, prop, value) {
            console.log('obj, prop, value', obj, prop, value);
            obj[prop] = value;
        },
        get: function (target, prop, receiver) {
            console.log('target, prop, receiver', target, prop, receiver);
            return target[prop];
        }
    };
    // @ts-ignore
    var proxy1 = new Proxy(target, handlers);
    console.log(proxy1.message1); // hello
    console.log(proxy1.message2); // everyone
    proxy1.message1 = 1;
    console.log(proxy1.message1); // hello
    console.log(proxy1.message2); // everyone
    console.log('proxy1 and target', proxy1, target); // hello
}
console.log('-------');
{
    var target = { age: 18, name: 'Niko Bellic' };
    var handlers = {
        // @ts-ignore
        get: function (target, property) {
            return property + ": " + target[property];
        },
        // @ts-ignore
        set: function (target, property, value) {
            target[property] = value;
            console.log(111);
        }
    };
    // @ts-ignore
    var proxy = new Proxy(target, handlers);
    proxy.age = 19;
    console.log(target.age, proxy.age); // 19,          age : 19
    console.log(target.name, proxy.name); // Niko Bellic, name: Niko Bellic
}
