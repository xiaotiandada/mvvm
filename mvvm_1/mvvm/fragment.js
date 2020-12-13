const list = document.querySelector('#list');
const fruits = ['Apple', 'Orange', 'Banana', 'Melon'];

const fragment = document.createDocumentFragment();

fruits.forEach(fruit => {
    const li = document.createElement('li');
    li.innerHTML = fruit;
    fragment.appendChild(li);
});

list.appendChild(fragment);