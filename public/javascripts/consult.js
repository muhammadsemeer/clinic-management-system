let medicines = [];
let disp = document.querySelector(".disp-sec ul");
let input = document.getElementById("medicines");
let notes = document.querySelector("textarea[name=notes]");
const addItem = () => {
  display(input.value);
  input.value = "";
};
function display(value) {
  let elem;
  medicines = [...medicines, value];
  medicines.forEach((data, index) => {
    elem = `
  <li id="${index}">${data}
  <i onclick="deleteElem('${index}')" class="fas fa-trash"></i>
  </li>`;
  });
  disp.insertAdjacentHTML("beforeend", elem);
}

const deleteElem = (index) => {
  var item = document.getElementById(index);
  medicines.splice(index, 1);
  item.remove();
};

const submitForm = (id, event) => {
  event.preventDefault();
  const formData = new FormData();
  formData.append("medicines", medicines);
  formData.append("notes", notes.value);
  fetch(`/consult/${id}`, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((res) => {
      if (res) {
        modalup("sucess-modal");
      } else {
        window.location = "/login";
      }
    });
};
