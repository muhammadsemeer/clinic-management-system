var eye = document.querySelector(".input-section .icon");

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

var username = document.querySelector("input[name=username]");
var usernameFormat = null;
username.addEventListener("keyup", () => {
  username.value = username.value.toLowerCase();
  var format = new RegExp(/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
  // var fillSpace =
  if (format.test(username.value)) {
    usernameFormat = false;
  } else {
    usernameFormat = true;
  }
  if (/\s/.test(username.value)) {
    username.value = username.value.replace(" ", "_");
  }
});

const validate = (event) => {
  if ((usernameFormat && (male.checked = true)) || (female.checked = true)) {
    return true;
  } else {
    return false;
  }
};
