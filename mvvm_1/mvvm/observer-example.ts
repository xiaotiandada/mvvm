interface dataInterface {
    input: string
}

let observerInput = document.querySelector('#observerInput')
let observerText: any = document.querySelector('#observerText')

let data: dataInterface = {
    input: ''
}
let dataInput: string = ''

Object.defineProperty(data, 'input', {
    get() {
        return dataInput
    },
    set(val) {
        console.log('我发现你在改变了...', val)
        dataInput = val
        observerText.innerText = val
    }
})

observerInput?.addEventListener('change', (e: any) => {
    console.log('e', e.target.value)
    data.input = e.target.value
}, false)