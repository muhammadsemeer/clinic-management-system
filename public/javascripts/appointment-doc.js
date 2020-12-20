function cancelBooking() {
  fetch(`/bookings/cancel/${doctorid}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((status) => {
      if (status) {
        document.getElementById(doctorid).remove();
        document.querySelector(".delete-modal").classList.toggle("active");
        modalup("delete-sucess-modal");
      } else {
        modalup("delete-fail-modal");
      }
    });
}

var id = "today";

function tabview(event) {
  id = event.target.dataset.id;
  var tb = document.querySelectorAll(".tb");
  var cardSec = document.querySelectorAll(".card-sec");
  for (let i = 0; i < tb.length; i++) {
    tb[i].classList.remove("active");
  }
  for (let i = 0; i < cardSec.length; i++) {
    cardSec[i].classList.remove("active");
  }
  document.getElementById(id).classList.add("active");
  event.target.classList.add("active");
}