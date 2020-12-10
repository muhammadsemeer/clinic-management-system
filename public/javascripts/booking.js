function getDates(start) {
  var div = "";
  var dates = document.querySelector("#date");
  fetch(`/date?start=${start}&limit=3`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      res.forEach((element, index) => {
        dates.innerHTML = "";
        div += `
          <div>
          <input type="radio" name="date" data-start="0" id="d${index}" value="${element}" />
          <label for="d${index}" onclick="getTimeSlots('${element}',0)" style="width: 200px">
          <span>${element}</span>
          </label>
          </div>
        `;
      });
      document.getElementById("date").classList.toggle("active");
      return dates.insertAdjacentHTML("beforeend", div);
    });
}
var start = 0;
const changeStart = (value) => {
  if (value === 1) {
    start++;
    getDates(start);
  } else if (value !== 1 && start === 0) {
    return;
  } else {
    start--;
    getDates(start);
  }
};
getDates(start);

const book = (doctorid, userid) => {
  let dateInput = document.querySelector('input[name="date"]:checked');
  let timeInput = document.querySelector('input[name="timeslot"]:checked');
  if (dateInput !== null || timeInput !== null) {
    var date = dateInput.value;
    var timeslot = timeInput.value;
    fetch(`/book-appoinment/${doctorid}/${userid}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date,
        timeslot,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status) {
          modalup("success-modal");
        } else {
          document.querySelector(".error").innerHTML = res.error;
          setTimeout(() => {
            document.querySelector(".error").innerHTML = "";
          },5000)
        }
      });
  } else {
    modalup("error-modal");
  }
};

function changeTime(change) {
  let dateInput = document.querySelector('input[name="date"]:checked');
  let start = parseInt(dateInput.getAttribute("data-start"));
  if (change === 1) {
    start++;
    getTimeSlots(dateInput.value, start);
    dateInput.setAttribute("data-start", 1);
  } else if (change !== 1 && start === 0) {
    return;
  } else {
    start--;
    getTimeSlots(dateInput.value, start);
  }
}

function getTimeSlots(date, start) {
  var arrow = document.querySelectorAll(".time .arrow");
  arrow[0].style.display = "flex";
  arrow[1].style.display = "flex";
  var div = "";
  var dates = document.querySelector("#time");
  var doctorid = document.querySelector("#id").value;
  date = new Date(date);
  fetch(`/get-timeslot/${doctorid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date,
      start,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      res.forEach((element, index) => {
        dates.innerHTML = "";
        div += `
        <div>
        <input type="radio" name="timeslot"
          id="t${index}"
          value=" ${element.timeSlotStart}-${element.timeSlotEnd}"
        />
        <label
          for="t${index}"
          style="width: 200px;"
        >
          <span>
            ${element.timeSlotStart}
            -
            ${element.timeSlotEnd}
          </span>
        </label>
      </div>
        `;
      });
      document.getElementById("time").classList.toggle("active");
      return dates.insertAdjacentHTML("beforeend", div);
    });
}
