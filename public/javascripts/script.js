var eye = document.querySelector(".input-section .icon");
if (eye) {
  eye.addEventListener("click", () => {
    var inputFeild = document.querySelector("input[name=password]");
    var eyeSlash = document.querySelector(".fa-eye-slash");
    var eye = document.querySelector(".fa-eye");
    var status = inputFeild.getAttribute("type");
    if (status === "password") {
      inputFeild.setAttribute("type", "text");
      eye.style.display = "none";
      eyeSlash.style.display = "inline";
    } else {
      inputFeild.setAttribute("type", "password");
      eye.style.display = "inline";
      eyeSlash.style.display = "none";
    }
  });
}

var username = document.querySelector("input[name=username]");
var usernameFormat = null;
var error = document.querySelector(".user-error");
var format = new RegExp(/[@~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
if (username) {
  username.addEventListener("keyup", () => {
    username.value = username.value.toLowerCase();
    if (format.test(username.value)) {
      usernameFormat = false;
      error.style.display = "inline";
      error.innerHTML =
        "Username does not includes special characters like @~`!#$%^&*+=-[]\\',/{}|\\\":";
      username.style.borderColor = "#ec1919";
    } else {
      usernameFormat = true;
      error.style.display = "none";
      username.style.borderColor = "#19b9ec";
    }
    if (/\s/.test(username.value)) {
      username.value = username.value.replace(" ", "_");
    }
    checkUserName(username.value);
  });
} else {
  username = false;
}
var checkUser;
const validate = (event) => {
  const male = document.getElementById("male");
  const female = document.getElementById("female");
  console.log(male, female);
  if (male.checked || female.checked) {
    if (usernameFormat && checkUser) {
      return true;
    } else if (!username) {
      return true;
    } else {
      return false;
    }
  } else {
    modalup("gender-modal");
    return false;
  }
};

function checkUserName(name) {
  if (name.length <= 0 || format.test(name)) {
    return false;
  } else {
    fetch(`/username/${name}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        checkUser = res;
        if (!res) {
          error.innerHTML = "Username is already exists";
          error.style.display = "inline";
          username.style.borderColor = "#ec1919";
        }
      });
  }
}
