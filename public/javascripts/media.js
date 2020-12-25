const menu = document.querySelector(".menu");

if (menu) {
  menu.addEventListener("click", () => {
    const sidebar = document.querySelector(".sidebar");
    const adminDash = document.querySelector(".ml-250");
    menu.classList.toggle("active");
    sidebar.classList.toggle("active");
    adminDash.classList.toggle("active");
  });
}
var doctorid;
var reomve;
function modalup(modal, id, remove) {
  doctorid = id;
  document.querySelector("." + modal).classList.toggle("active");
}

const doctorDelete = document.querySelector("#doctor-delete");
const pateintDelete = document.querySelector("#patient-delete");
if (doctorDelete) {
  doctorDelete.addEventListener("click", deleteDoctor);
}
if (pateintDelete) {
  pateintDelete.addEventListener("click", deletePateint);
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

function toogleTab(activeTab, inactiveTab, showContent, hideContent) {
  document.querySelector(activeTab).classList.add("active");
  document.querySelector(showContent).classList.add("active");
  document.querySelector(inactiveTab).classList.remove("active");
  document.querySelector(hideContent).classList.remove("active");
}
function toogleTab3(
  activeTab,
  inactiveTab1,
  inactiveTab2,
  inactiveTab3,
  showContent,
  hideContent1,
  hideContent2,
  hideContent3,
  inactiveTab4,
  hideContent4
) {
  document.querySelector(activeTab).classList.add("active");
  document.querySelector(showContent).classList.add("active");
  document.querySelector(inactiveTab1).classList.remove("active");
  document.querySelector(inactiveTab2).classList.remove("active");
  document.querySelector(inactiveTab3).classList.remove("active");
  document.querySelector(hideContent1).classList.remove("active");
  document.querySelector(hideContent2).classList.remove("active");
  document.querySelector(hideContent3).classList.remove("active");
  if (inactiveTab4 && hideContent4) {
    document.querySelector(inactiveTab4).classList.remove("active");
    document.querySelector(hideContent4).classList.remove("active");
  }
}

function deletePateint() {
  fetch(`/pateints/${doctorid}`, {
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
        document.querySelector(".pateint-modal").classList.toggle("active");
      } else {
        alert("Something Went Wrong. Try Again Later");
        location.reload();
      }
    });
}

var notfication = document.createElement("div");
notfication.classList.add("notfication-container");

document.body.appendChild(notfication);
