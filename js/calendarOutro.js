document.addEventListener('DOMContentLoaded', function () {
  function getDayOfWeek(date) {
    const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return daysOfWeek[date.getDay()];
  }

  function changeBtn(clickedButton, allButtons, dayElement) {
    allButtons.forEach(function (button) {
      const iconElement = button.querySelector('i');
      if (button === clickedButton) {
        iconElement.classList.add('fa-circle-dot');
        iconElement.classList.remove('fa-circle');
        dayElement.classList.add('day-selected');
      } else {
        iconElement.classList.remove('fa-circle-dot');
        iconElement.classList.add('fa-circle');
        const dayClosest = button.closest('.day');
        dayClosest.classList.remove('day-selected');
      }
    });
  }

  const today = new Date();
  const calendarElement = document.getElementById('accordionExample');
  const allButtons = [];

  for (let i = 0; i < 10; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);

    const dayElement = document.createElement('div');
    dayElement.classList.add('day');
    dayElement.innerHTML = `
      <button class="btn btn-link btn-days" type="button" data-toggle="collapse" data-target="#collapse${i + 1}" aria-expanded="false" aria-controls="collapse${i + 1}">
        <i class="fa-regular fa-circle"></i> &nbsp; ${getDayOfWeek(currentDate)} - ${currentDate.toLocaleDateString()}
      </button>
      <div id="collapse${i + 1}" class="collapse" data-parent="#accordionExample">
        <ul class="options">
          ${generateOptions(currentDate)}
        </ul>
      </div>
    `;

    const buttonElement = dayElement.querySelector('.btn-days');
    buttonElement.addEventListener('click', function () {
      changeBtn(buttonElement, allButtons, dayElement);
    });

    allButtons.push(buttonElement);

    // Adiciona um evento de clique para cada opção de hora
    const options = dayElement.querySelectorAll('.option-text');
    options.forEach(function (option) {
      option.addEventListener('click', function () {
        const dateFull = currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
        const dateToday = getDayOfWeek(currentDate);
        const textDateFull = dateFull + ` (${dateToday})`;
        const hours = option.textContent;

        $("#modal_overlay_reserva").removeClass('hidden');
        $("#confirmar_reserva").removeClass('hidden');
        $("#reserva_date").text(textDateFull);
        $("#reserva_hour").text(hours);

        callSchedule(hours, textDateFull);
      });
    });

    calendarElement.append(dayElement);
  }

  function generateOptions(currentDate) {
    const options = [];
    const currentTime = new Date();

    const availableTimes = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '19:00', '20:00', '20:30', '21:00', '21:30', '22:00'];

    for (let j = 0; j < availableTimes.length; j++) {
      const optionTime = new Date(currentDate);
      const [hours, minutes] = availableTimes[j].split(':');
      optionTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

      const optionElement = document.createElement('li');
      optionElement.classList.add('option');
      const optionTextElement = document.createElement('span');
      optionTextElement.classList.add('option-text');

      if (optionTime > currentTime) {
        optionTextElement.textContent = availableTimes[j];
      } else {
        optionTextElement.textContent = `${availableTimes[j]}`;
        optionTextElement.style.pointerEvents = 'none';
        optionTextElement.style.backgroundColor = '#90908e';
        optionTextElement.style.border = '1px solid #90908e';
      }

      optionElement.appendChild(optionTextElement);
      options.push(optionElement);
    }

    return options.map(option => option.outerHTML).join('');
  }
  const callSchedule = (hours, date) => {
    const btnAgendarReserva = document.getElementById("agendar_reserva");

    btnAgendarReserva.addEventListener("click", function () {
      setTimeout(() => {
        var texto = `Olá! Eu gostaria de fazer uma reserva para o dia ${date} ás ${hours} horas.`;

        var encode = encodeURI(texto);
        let URL = `https://wa.me/${CELULAR_EMPRESA}?text=${encode}`;

        window.open(URL, '_blank');
      }, 500);
    });
  }
});