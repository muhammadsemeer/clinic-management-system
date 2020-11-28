const menu = document.querySelector(".menu");

menu.addEventListener("click", () => {
  const sidebar = document.querySelector(".sidebar");
  const adminDash = document.querySelector(".ml-250");
  menu.classList.toggle("active");
  sidebar.classList.toggle("active");
  adminDash.classList.toggle("active");
});
var doctorid;
function modalup(modal, id) {
  doctorid = id;
  document.querySelector("." + modal).classList.toggle("active");
}
const yes = document.querySelector(".yes");
if (yes) {
  yes.addEventListener("click", deleteDoctor);
}

function deleteDoctor() {
  fetch(`/doctors/${doctorid}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.status) {
        document.getElementById(`${doctorid}`).remove();
        modalup("delete-sucess-modal");
        document.querySelector(".doctor-modal").classList.toggle("active");
      } else {
        alert("Something Went Wrong. Try Again Later");
        location.reload();
      }
    });
}

const tooglePatient = () => {
  document.querySelector(".tab").classList.add("active");
  document.querySelector("[class^='admin'] ").classList.add("active");
};

var tabLink = document.querySelector("#tab-link");

tabLink.addEventListener("click", tooglePatient);

if (location.href.includes("#patients")) {
  tooglePatient();
}
