var socket = io();
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
  if (dateInput !== null && timeInput !== null) {
    var date = dateInput.value;
    var timeslot = timeInput.value;
    let obj = {
      doctor: doctorid,
      date,
      timeslot,
    };
    fetch(`/book-appoinment/${doctorid}`, {
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
        if (res.status === true) {
          socket.emit("request", res.response._id);
          modalup("success-modal");
        } else if (res.status === "No Auth") {
          saveBooking(obj);
          let date = new Date().setMinutes(10);
          document.cookie = `redirect=${location.pathname}; expires= ${date}; path=/`;
          window.location = `/login`;
        } else {
          document.querySelector(".error").innerHTML = res.error;
          modalup("error-modal");
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
      if (res.length === 0) {
        return (dates.innerHTML = `
        <label
          for=""
          style="width: 300px;"
        >
          <span>
           No Slots Available
          </span>
        </label>
        `);
      }
      res.forEach((element, index) => {
        dates.innerHTML = "";
        div += `
        <div>
        <input type="radio" name="timeslot"
          id="t${index}"
          value="${element.timeSlotStart}-${element.timeSlotEnd}"
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

function saveBooking(bookings) {
  localStorage.setItem("bookings", JSON.stringify(bookings));
}

function getAndBook() {
  if (localStorage.getItem("bookings") !== null) {
    let bookings = JSON.parse(localStorage.getItem("bookings"));
    fetch(`/book-appoinment/${bookings.doctor}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: bookings.date,
        timeslot: bookings.timeslot,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === true) {
          socket.emit("request", res.response._id);
          localStorage.removeItem("bookings");
          modalup("success-modal");
        } else if (res.status === "No Auth") {
          let date = new Date().setMinutes(10);
          document.cookie = `redirect=${location.pathname}; expires= ${date}; path=/`;
          window.location = `/login`;
        } else {
          localStorage.removeItem("bookings");
          document.querySelector(".error").innerHTML = res.error;
          modalup("error-modal");
        }
      });
  }
}

getAndBook();

var socket = io();
const cancelAppointment = () => {
  document.querySelector(".message-modal").classList.toggle("active");
  fetch(`/cancel-appointment/${doctorid}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.status) {
        document.getElementById(`${doctorid}`).remove();
        socket.emit("deleted", res.appId);
        modalup("success-modal");
      } else {
        modalup("error-modal");
      }
    });
};
