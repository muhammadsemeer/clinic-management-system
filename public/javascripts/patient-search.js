function blockUser() {
  fetch(`/block-user/${doctorid}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res === true) {
        document.querySelector(".delete-modal").classList.remove("active");
        document.getElementById(doctorid).remove();
        modalup("delete-sucess-modal");
      } else if (res === "login") {
        window.location = "/login";
      } else {
        modalup("delete-fail-modal");
      }
    });
}
function unblock() {
  fetch(`/block-user/${doctorid}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res === true) {
        document.querySelector(".unblock-modal").classList.remove("active");
        document.getElementById(doctorid).remove();
        modalup("unblock-sucess-modal");
      } else if (res === "login") {
        window.location = "/login";
      } else {
        modalup("delete-fail-modal");
      }
    });
}
var search = document.getElementById("search");
var searchbtn = document.getElementById("search-btn");
var container1 = document.querySelector("#doctor-conatiner tbody");
var container2 = document.querySelector("#patient-conatiner tbody");
var initial1 = container1.innerHTML;
var initial2 = container2.innerHTML;
search.addEventListener("keyup", (event) => {
  container1.innerHTML = "";
  container2.innerHTML = "";
  var section1 = "";
  var section2 = "";
  if (event.target.value === "") {
    container1.innerHTML = initial1;
    container2.innerHTML = initial2;
  } else {
    fetch(`/search/patient?q=${event.target.value}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        const { result1, result2 } = res;
        if (result1.length === 0 && result2.length === 0) {
          container1.innerHTML =
            "<td></td><td></td><td><h1>No Results Found</h1></td>";
          container2.innerHTML =
            "<td></td><td></td><td><h1>No Results Found</h1></td>";
          return;
        }
        if (result1.length === 0) {
          container1.innerHTML =
            "<td></td><td></td><td><h1>No Results Found</h1></td>";
        } else {
          result1.forEach((element) => {
            if (element.item.contactno === undefined) {
              element.item.contactno = "";
            }
            if (element.item.email === undefined) {
              element.item.email = "";
            }
            section1 += `
            <tr id="${element.item._id}">
              <td>${element.item.name}</td>
              <td>${element.item.email}</td>
              <td>${element.item.contactno}</td>
              <td>
                <a class="edit tooltip" href="/history/${element.item._id}">
                  <i class="fas fa-calendar"></i>
                  <span class="tooltip-text">History</span>
                </a>
                <span
                  class="delete tooltip"
                  onclick="modalup('delete-modal','${element.item._id}')"
                >
                  <i class="fas fa-user-slash"></i>
                  <span class="tooltip-text">Block</span>
                  </span>
                  </td>
                  </tr>
                  `;
          });
          container1.innerHTML = section1;
        }
        if (result2.length === 0) {
          container2.innerHTML =
            "<td></td><td></td><td><h1>No Results Found</h1></td>";
        } else {
          result2.forEach((element) => {
            if (element.item.contactno === undefined) {
              element.item.contactno = "";
            }
            if (element.item.email === undefined) {
              element.item.email = "";
            }
            section2 += `
            <tr id="${element.item._id}">
              <td>${element.item.name}</td>
              <td>${element.item.email}</td>
              <td>${element.item.contactno}</td>
              <td>
              <a class="edit tooltip" href="/history/${element.item._id}">
              <i class="fas fa-calendar"></i>
              <span class="tooltip-text">History</span>
              </a>
              <span class="yes tooltip" onclick="modalup('unblock-modal','${element.item._id}')">
              <i class="fas fa-user-check"></i>
              <span class="tooltip-text">Unblock</span>
              </span>
              </td>
            </tr>
            `;
          });
          container2.innerHTML = section2;
        }
      });
  }
});

searchbtn.addEventListener("click", (event) => {
  container1.innerHTML = "";
  container2.innerHTML = "";
  var section1 = "";
  var section2 = "";
  if (search.value === "") {
    container1.innerHTML = initial1;
    container2.innerHTML = initial2;
  } else {
    fetch(`/search/patient?q=${event.target.value}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        const { result1, result2 } = res;
        if (result1.length === 0 && result2.length === 0) {
          container1.innerHTML =
            "<td></td><td></td><td><h1>No Results Found</h1></td>";
          container2.innerHTML =
            "<td></td><td></td><td><h1>No Results Found</h1></td>";
          return;
        }
        if (result1.length === 0) {
          container1.innerHTML =
            "<td></td><td></td><td><h1>No Results Found</h1></td>";
        } else {
          result1.forEach((element) => {
            if (element.item.contactno === undefined) {
              element.item.contactno = "";
            }
            if (element.item.email === undefined) {
              element.item.email = "";
            }
            section1 += `
            <tr id="${element.item._id}">
              <td>${element.item.name}</td>
              <td>${element.item.email}</td>
              <td>${element.item.contactno}</td>
              <td>
                <a class="edit tooltip" href="/history/${element.item._id}">
                  <i class="fas fa-calendar"></i>
                  <span class="tooltip-text">History</span>
                </a>
                <span
                  class="delete tooltip"
                  onclick="modalup('delete-modal','${element.item._id}')"
                >
                  <i class="fas fa-user-slash"></i>
                  <span class="tooltip-text">Block</span>
                  </span>
                  </td>
                  </tr>
                  `;
          });
          container1.innerHTML = section1;
        }
        if (result2.length === 0) {
          container2.innerHTML =
            "<td></td><td></td><td><h1>No Results Found</h1></td>";
        } else {
          result2.forEach((element) => {
            if (element.item.contactno === undefined) {
              element.item.contactno = "";
            }
            if (element.item.email === undefined) {
              element.item.email = "";
            }
            section2 += `
            <tr id="${element.item._id}">
              <td>${element.item.name}</td>
              <td>${element.item.email}</td>
              <td>${element.item.contactno}</td>
              <td>
              <a class="edit tooltip" href="/history/${element.item._id}">
              <i class="fas fa-calendar"></i>
              <span class="tooltip-text">History</span>
              </a>
              <span class="yes tooltip" onclick="modalup('unblock-modal','${element.item._id}')">
              <i class="fas fa-user-check"></i>
              <span class="tooltip-text">Unblock</span>
              </span>
              </td>
            </tr>
            `;
          });
          container2.innerHTML = section2;
        }
      });
  }
});
