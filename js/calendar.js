const daysTag = document.querySelector(".days"),
currentDate = document.querySelector(".current-date"),
prevNextIcon = document.querySelectorAll(".icons span");
const text = document.querySelector(".text-info");
const scheduleContainer = document.querySelector(".schedule-container");
const calendar = document.querySelector(".wrapper");
const optionMenu = document.querySelector(".select-menu");
const btnBack = document.getElementById("btnVoltarReserva");
const btnTransparent = document.getElementById("btnTransparent");
selectBtn = optionMenu.querySelector(".select-btn");
options = optionMenu.querySelectorAll(".option");
sBtnText = optionMenu.querySelector(".sBtn-text");
let textDateSelected = '';

let date = new Date(),
    currYear = date.getFullYear(),
    currMonth = date.getMonth();

const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho",
    "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const renderCalendar = () => {
    let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(),
    lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(),
    lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay(),
    lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate();
    let liTag = "";

    for (let i = firstDayofMonth; i > 0; i--) {
        liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
    }

    for (let i = 1; i <= lastDateofMonth; i++) {
        let isToday = i === date.getDate() && currMonth === new Date().getMonth()
            && currYear === new Date().getFullYear() ? "active" : "";

        if (i < date.getDate() && currMonth === new Date().getMonth()
            && currYear === new Date().getFullYear()) {
            isToday = "inactive"
        }
        if (currMonth < new Date().getMonth() && currYear === new Date().getFullYear()) {
            isToday = "inactive"
        }
        if (currYear < new Date().getFullYear()) {
            isToday = "inactive"
        }
        liTag += `<li id="${i}" class="${isToday}">${i}</li>`;
    }

    for (let i = lastDayofMonth; i < 6; i++) {
        liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`
    }
    currentDate.innerText = `${months[currMonth]} ${currYear}`;
    daysTag.innerHTML = liTag;


    daysTag.querySelectorAll("li").forEach((liElement, index) => {
        const id = liElement.id;
        liElement.addEventListener("click", () => {

            if (liElement.classList.contains("inactive") || index % 7 == 0) {
                return;
            }

            if (liElement.classList.contains("selected")) {
                liElement.classList.remove("selected");
            } else {
                liElement.classList.add("selected");
                textDateSelected = `${id} de ${months[currMonth]} de ${currYear}`;
                scheduleContainer.classList.remove("none");
                calendar.classList.add("none");
                btnBack.classList.remove("none");
                btnTransparent.classList.add("none");
            }
        });
    });
}
renderCalendar();

prevNextIcon.forEach(icon => {
    icon.addEventListener("click", () => {
        currMonth = icon.id === "prev" ? currMonth - 1 : currMonth + 1;

        if (currMonth < 0 || currMonth > 11) {
            date = new Date(currYear, currMonth, new Date().getDate());
            currYear = date.getFullYear();
            currMonth = date.getMonth();
        } else {
            date = new Date();
        }
        renderCalendar();
    });
});

const callSchedule = (hours) => {
    const scheduleButton = document.getElementById("schedule-button");
    const scheduleResult = document.getElementById("schedule-result");

    scheduleButton.addEventListener("click", function () {
    const selectedHour = hours;

    if (selectedHour) {
        scheduleResult.textContent = `Você agendou o dia ${textDateSelected} as ${selectedHour} horas.`;
        setTimeout(() => {
            var texto = `Olá! Eu gostaria de fazer uma reserva para o dia ${textDateSelected} as ${selectedHour} horas.`;

            var encode = encodeURI(texto);
            let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;

            window.open(URL, '_blank');
        }, 3000);
    } else {
        scheduleResult.textContent = "Por favor, selecione um horário válido.";
    }
});
}



selectBtn.addEventListener("click", () => optionMenu.classList.toggle("active"));

options.forEach(option => {
    option.addEventListener("click", () => {
        let selectdOption = option.querySelector(".option-text").innerHTML;
        sBtnText.innerHTML = selectdOption;

        callSchedule(selectdOption);

        optionMenu.classList.remove("active");
    })
})

