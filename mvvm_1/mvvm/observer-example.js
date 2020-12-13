var observerInput = document.querySelector('#observerInput');
var observerText = document.querySelector('#observerText');
var data = {
    input: ''
};
var dataInput = '';
Object.defineProperty(data, 'input', {
    get: function () {
        return dataInput;
    },
    set: function (val) {
        console.log('我发现你在改变了...', val);
        dataInput = val;
        observerText.innerText = val;
    }
});
observerInput === null || observerInput === void 0 ? void 0 : observerInput.addEventListener('change', function (e) {
    console.log('e', e.target.value);
    data.input = e.target.value;
}, false);
