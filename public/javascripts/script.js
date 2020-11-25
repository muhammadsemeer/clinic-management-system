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
  var format = new RegExp(/[@~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
  // var fillSpace =
  if (format.test(username.value)) {
    usernameFormat = false;
    document.querySelector(".error").style.display = "inline";
  } else {
    usernameFormat = true;
    document.querySelector(".error").style.display = "none";
  }
  if (/\s/.test(username.value)) {
    username.value = username.value.replace(" ", "_");
  }
});

const validate = (event) => {
  if (usernameFormat) {
    return true;
  } else {
    return false;
  }
};
