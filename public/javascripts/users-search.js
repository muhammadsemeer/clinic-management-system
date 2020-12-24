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
    fetch(`/search/users?q=${event.target.value}`, {
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
            "<td></td><td></td><td></td><td><h1>No Results Found</h1></td>";
          container2.innerHTML =
            "<td></td><td></td><td></td><td><h1>No Results Found</h1></td>";
          return;
        }
        if (result1.length === 0) {
          container1.innerHTML =
            "<td></td><td></td><td></td><td><h1>No Results Found</h1></td>";
        } else {
          result1.forEach((element) => {
            section1 += `
            <tr id="${element.item._id}">
              <td>
                <div>
                  <img src="/images/doctor/${element.item._id}.jpg" alt="" />
                  <div id="${element.item._id}msg" class="img-hover" onclick="window.location = '/image-upload/${element.item._id}'">
                    Edit
                  </div>
                </div>
              </td>
              <td>
                <a href="/stats/${element.item._id}">
                  ${element.item.name}
                </a>
              </td>
              <td>
                <a href="/stats/${element.item._id}">
                  ${element.item.username}
                </a>
              </td>
              <td>
                ${element.item.email}
              </td>
              <td>
                ${element.item.specialised}
              </td>
              <td>
                ${element.item.field}
              </td>
              <td>
                <a class="edit tooltip" href="/doctors/${element.item.username}">
                  <i class="fas fa-user-edit"></i>
                  <span class="tooltip-text">
                    Edit
                  </span>
                </a>
                <span class="delete tooltip" onclick="modalup('doctor-block-modal','${element.item._id}')">
                  <i class="fas fa-user-slash"></i>
                  <span class="tooltip-text">
                    Block
                  </span>
                </span>
                <span class="delete tooltip" onclick="modalup('doctor-modal','${element.item._id}}')">
                  <i class="fas fa-user-times"></i>
                  <span class="tooltip-text">
                    Delete
                  </span>
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
            if (element.item.age === undefined) {
              element.item.age = "";
            }
            if (element.item.gender === undefined) {
              element.item.gender = "";
            }
            section2 += `
            <tr id="${element.item._id}">
            <td>
              <div>
                ${element.item.name}
              </div>
            </td>
            <td>
              ${element.item.age}
            </td>
            <td>
              ${element.item.gender}
            </td>
            <td>
              ${element.item.contactno}
            </td>
            <td>
              ${element.item.email}
            </td>
            <td>
              <a class="edit tooltip" href="/patients/${element.item._id}">
                <i class="fas fa-user-edit"></i>
                <span class="tooltip-text">
                  Edit
                </span>
              </a>
              <span class="delete tooltip" onclick="modalup('pateint-block-modal','${element.item._id}')">
                <i class="fas fa-user-slash"></i>
                <span class="tooltip-text">
                  Block
                </span>
              </span>
              <span class="delete tooltip" onclick="modalup('pateint-modal','${element.item._id}')">
                <i class="fas fa-user-times"></i>
                <span class="tooltip-text">
                  Delete
                </span>
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
    fetch(`/search/users?q=${event.target.value}`, {
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
            "<td></td><td></td><td></td><td><h1>No Results Found</h1></td>";
          container2.innerHTML =
            "<td></td><td></td><td></td><td><h1>No Results Found</h1></td>";
          return;
        }
        if (result1.length === 0) {
          container1.innerHTML =
            "<td></td><td></td><td></td><td><h1>No Results Found</h1></td>";
        } else {
          result1.forEach((element) => {
            section1 += `
            <tr id="${element.item._id}">
              <td>
                <div>
                  <img src="/images/doctor/${element.item._id}.jpg" alt="" />
                  <div id="${element.item._id}msg" class="img-hover" onclick="window.location = '/image-upload/${element.item._id}'">
                    Edit
                  </div>
                </div>
              </td>
              <td>
                <a href="/stats/${element.item._id}">
                  ${element.item.name}
                </a>
              </td>
              <td>
                <a href="/stats/${element.item._id}">
                  ${element.item.username}
                </a>
              </td>
              <td>
                ${element.item.email}
              </td>
              <td>
                ${element.item.specialised}
              </td>
              <td>
                ${element.item.field}
              </td>
              <td>
                <a class="edit tooltip" href="/doctors/${element.item.username}">
                  <i class="fas fa-user-edit"></i>
                  <span class="tooltip-text">
                    Edit
                  </span>
                </a>
                <span class="delete tooltip" onclick="modalup('doctor-block-modal','${element.item._id}')">
                  <i class="fas fa-user-slash"></i>
                  <span class="tooltip-text">
                    Block
                  </span>
                </span>
                <span class="delete tooltip" onclick="modalup('doctor-modal','${element.item._id}}')">
                  <i class="fas fa-user-times"></i>
                  <span class="tooltip-text">
                    Delete
                  </span>
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
            if (element.item.age === undefined) {
              element.item.age = "";
            }
            if (element.item.gender === undefined) {
              element.item.gender = "";
            }
            section2 += `
            <tr id="${element.item._id}">
            <td>
              <div>
                ${element.item.name}
              </div>
            </td>
            <td>
              ${element.item.age}
            </td>
            <td>
              ${element.item.gender}
            </td>
            <td>
              ${element.item.contactno}
            </td>
            <td>
              ${element.item.email}
            </td>
            <td>
              <a class="edit tooltip" href="/patients/${element.item._id}">
                <i class="fas fa-user-edit"></i>
                <span class="tooltip-text">
                  Edit
                </span>
              </a>
              <span class="delete tooltip" onclick="modalup('pateint-block-modal','${element.item._id}')">
                <i class="fas fa-user-slash"></i>
                <span class="tooltip-text">
                  Block
                </span>
              </span>
              <span class="delete tooltip" onclick="modalup('pateint-modal','${element.item._id}')">
                <i class="fas fa-user-times"></i>
                <span class="tooltip-text">
                  Delete
                </span>
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
