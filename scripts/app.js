'use strict'

let habbits = [];
const HABBIT_KEY = 'HABBIT_KEY';
let globalActiveHabbitId;
/* page */
// этот обьект описывает структуру страницы чтобы было понятно куда мы обращаемся
const page = {
    menu: document.querySelector('.menu__list'),
    header: {
        h1: document.querySelector('.h1'), //здесьб мы будем обращаться к той части где н1
        progressPercent: document.querySelector('.progress__percent'), // это где процентик
        progressCoverBar: document.querySelector('.progress__cover-bar'), // а это то место где индикатор выполнения
    },
    content: {
        daysContainer: document.getElementById('days'),
        nextDay: document.querySelector('.habbit__day'),
    },
    popup: {
        index: document.getElementById('add-habbit_popup'),
        iconField: document.querySelector('.popup__form input[name="icon"]'),
    },

}


/* utils */

function loadData() {
    const habbitsString = localStorage.getItem(HABBIT_KEY);
    const habbitArray = JSON.parse(habbitsString);
    if (Array.isArray(habbitArray)) {
        habbits = habbitArray;
    }
}

function saveData() {
    localStorage.setItem(HABBIT_KEY, JSON.stringify(habbits));
}

function togglePopup() {
    if (page.popup.index.classList.contains('cover_hidden')) {
        page.popup.index.classList.remove('cover_hidden');
    } else {
        page.popup.index.classList.add('cover_hidden');
    }
}

function resetForm(form, fields) {
    for (const field of fields) {
        form[field].value = '';
    }
}


function validateAndGetFormData(form, fields) {  // здесь нет необязательных полей, поэтому передается массив полей, можно передать обьект где указано какое поле обязательно а какое нет
    const formData = new FormData(form);
    const res = {};
    for (const field of fields) {
        const fieldValue = formData.get(field);
        form[field].classList.remove('error');
        if (!fieldValue) {
            form[field].classList.add('error');
        }
        res[field] = fieldValue;
    }
    let isValid = true;
    for (const field of fields) {
        if (!res[field]) {
            isValid = false;
        }
    }
    if (!isValid) {
        return;
    }
    return res;
}


/* render */

// при нажатии меняется класс элемента на menu__item_active
function rerenderMenu(activeHabbit) {

    for (const habbit of habbits) {
        const existed = document.querySelector(`[menu-habbit-id="${habbit.id}"]`);
        if (!existed) {
            //создание этого элемента меню
            // то есть мы каждому элементу меню присваивем когда создаем его id из
            // базы , значит если меню с таким элементом нет то мы создаем его
            const element = document.createElement('button');
            element.setAttribute('menu-habbit-id', habbit.id);
            element.classList.add('menu__item');
            element.addEventListener('click', () => rerender(habbit.id)); // теперь при клике  вызовется функция рендеринга
            element.innerHTML = `<img src="./images/${habbit.icon}.svg" alt="${habbit.name}" />`
            if (activeHabbit.id === habbit.id) {
                element.classList.add('menu__item_active');
            }
            page.menu.appendChild(element); // это нам нужно чтобы чтобы указать куда пихнуть новый элемент 
            continue;

        }
        if (activeHabbit.id === habbit.id) {
            existed.classList.add('menu__item_active');
        } else {
            existed.classList.remove('menu__item_active');
        }

    }
}

function renderHead(activeHabbit) {

    page.header.h1.innerText = activeHabbit.name;
    const progress = activeHabbit.days.length / activeHabbit.target > 1
        ? 100
        : activeHabbit.days.length / activeHabbit.target * 100;
    page.header.progressPercent.innerText = progress.toFixed(0) + '%'; // toFixed(0) округление
    page.header.progressCoverBar.setAttribute('style', `width: ${progress}%`)
}

function rerenderContent(activeHabbit) {
    page.content.daysContainer.innerHTML = '';
    for (const index in activeHabbit.days) {
        const element = document.createElement('div');
        element.classList.add('habbit');
        element.innerHTML = `<div class="habbit__day">День ${Number(index) + 1}</div>
                        <div class="habbit__comment">${activeHabbit.days[index].comment}</div>
                        <button class="habbit__delet" onclick = "deleteDay(${index})">
                            <img src="./images/delete.svg" alt="удалить день  ${Number(index) + 1}">
                        </button>`
        page.content.daysContainer.appendChild(element);
    }
    page.content.nextDay.innerHTML = `День ${activeHabbit.days.length + 1}`;
}

function rerender(activeHabbitId) {
    globalActiveHabbitId = activeHabbitId;
    const activeHabbit = habbits.find(habbit => habbit.id === activeHabbitId);
    if (!activeHabbit) {
        return;
    }
    document.location.replace(document.location.pathname + '#' + activeHabbitId);
    rerenderMenu(activeHabbit);
    renderHead(activeHabbit);
    rerenderContent(activeHabbit)
}
/* work with days */
function addDays(event) {
    event.preventDefault();  // предотвращает дефолтное поведение нашего события
    const data = validateAndGetFormData(event.target, ['comment']);
    if (!data) {
        return;
    }
    habbits = habbits.map(habbit => {
        if (habbit.id === globalActiveHabbitId) {
            return {
                ...habbit,
                days: habbit.days.concat([{ comment: data.comment }])
            }
        }
        return habbit;
    });
    resetForm(event.target, ['comment'])
    rerender(globalActiveHabbitId);
    saveData();
}

function deleteDay(index) {
    habbits = habbits.map(habbit => {
        if (habbit.id === globalActiveHabbitId) {
            habbit.days.splice(index, 1);
            return {
                ...habbit,
                days: habbit.days
            };
        }
        return habbit;

    });
    rerender(globalActiveHabbitId);
    saveData();
}
/* working with habbits */
function setIcon(context, icon) { // получаем контекст той тконки на которую кликнули чтобы присвоить активный класс
    page.popup.iconField.value = icon; // здесь мы как раз передаем значение иконки которую выбрали для новой привычки
    const activeIcon = document.querySelector('.icon.icon_active');
    activeIcon.classList.remove('icon_active');
    context.classList.add('icon_active');

}

function addHabbit(event) {
    event.preventDefault();
    const data = validateAndGetFormData(event.target, ['name', 'icon', 'target']);
    if (!data) {
        return;
    }
    const maxId = habbits.reduce((acc, habbit) => acc > habbit.id ? acc : habbit.id, 0);
    habbits.push({
        id: maxId + 1,
        name: data.name,
        target: data.target,
        icon: data.icon,
        days: [],
    });
    resetForm(event.target, ['name', 'target']);
    togglePopup();
    saveData();
    rerender(maxId + 1);
}

/* init */
(() => {
    loadData();
    const hashId = Number(document.location.hash.replace('#', '')); // из хэша загружаем идентифиатор привычки последней 
    const urlHabbit = habbits.find(habbit => habbit.id == hashId); // ищем привычку с этим id 
    if (urlHabbit) {
        rerender(urlHabbit.id);
    } else {
        rerender(habbits[0].id);
    }

})()


