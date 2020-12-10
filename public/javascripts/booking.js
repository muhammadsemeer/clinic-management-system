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
          <input type="radio" name="date" id="${index}" value="${element}" />
          <label for="${index}" onclick="getTimeSlots('${element}')" style="width: 200px">
          <span>${element}</span>
          </label>
          </div>
        `;
      });
      document.querySelector(".radio-section").classList.toggle("active");
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
  if (dateInput !== null) {
    var date = dateInput.value;
    var timeslot = document.getElementById("timeslot").value;
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
          alert("Sucess");
        } else {
          alert(res.error);
        }
      });
  } else {
    modalup("error-modal");
  }
};

function getTimeSlots(date) {
  var doctorid = document.querySelector("#id").value;
  date = new Date(date);
  fetch(`/get-timeslot/${doctorid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date,
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      console.log(res);
    });
}
