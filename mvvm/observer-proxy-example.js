// @ts-ignore
var observerInput = document.querySelector('#observerInput');
// @ts-ignore
var observerText = document.querySelector('#observerText');
// @ts-ignore
var dataProxy = {
    input: ''
};
// @ts-ignore
var data = new Proxy(dataProxy, {
    // @ts-ignore
    get: function (target, prop, receiver) {
        console.log('我发现你在获取...', target, prop, receiver);
        return target[prop];
    },
    // @ts-ignore
    set: function (target, prop, value) {
        console.log('我发现你在改变了...', target, prop, value);
        target[prop] = value;
        observerText.innerText = value;
    }
});
observerInput === null || observerInput === void 0 ? void 0 : observerInput.addEventListener('change', function (e) {
    console.log('e', e.target.value);
    data.input = e.target.value;
}, false);
