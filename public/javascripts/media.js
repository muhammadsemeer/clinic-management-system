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

function toogleTab(activeTab, inactiveTab, showContent, hideContent) {
  document.querySelector(activeTab).classList.add("active");
  document.querySelector(showContent).classList.add("active");
  document.querySelector(inactiveTab).classList.remove("active");
  document.querySelector(hideContent).classList.remove("active");
}
