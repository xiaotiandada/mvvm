interface dataInterface {
    input: string
}

// @ts-ignore
let observerInput = document.querySelector('#observerInput')
// @ts-ignore
let observerText: any = document.querySelector('#observerText')
// @ts-ignore
let dataProxy: dataInterface = {
    input: ''
}

// @ts-ignore
let data = new Proxy(dataProxy, {
    // @ts-ignore
    get(target, prop, receiver) {
        console.log('我发现你在获取...', target, prop, receiver)
        return target[prop]
    },
    // @ts-ignore
    set(target, prop, value) {
        console.log('我发现你在改变了...', target, prop, value)
        target[prop] = value
        observerText.innerText = value
    }
})

observerInput?.addEventListener('change', (e: any) => {
    console.log('e', e.target.value)
    data.input = e.target.value
}, false)