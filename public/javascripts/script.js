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
