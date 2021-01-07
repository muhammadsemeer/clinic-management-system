var loader = document.querySelector(".loader");

document.onreadystatechange = () => {
  if (document.readyState === "complete") {
    loader.style.display = "none";
  } else {
    loader.style.display = "flex";
  }
};

var eye = document.querySelector(".input-section .icon");
if (eye) {
  eye.addEventListener("click", show);
}

function show() {
  var inputFeild = document.querySelector("input[name=password]");
  if (!inputFeild) {
    inputFeild = document.querySelector("input[name=code]");
  }
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
}

var username = document.querySelector("input[name=username]");
var usernameFormat = null;
var error = document.querySelector(".user-error");
var format = new RegExp(/[@~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/);
if (username) {
  username.addEventListener("keyup", () => {
    username.value = username.value.toLowerCase();
    if (/\s/.test(username.value)) {
      username.value = username.value.replace(" ", "_");
    }
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
    checkUserName(username.value);
  });
} else {
  username = false;
}
var checkUser;
const validate = (event) => {
  const male = document.getElementById("male");
  const female = document.getElementById("female");
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

// OAuth-google
function onSuccess(googleUser) {
  var id_token = googleUser.getAuthResponse().id_token;
  var auth2 = gapi.auth2.getAuthInstance();
  if (auth2.isSignedIn.get()) {
    var profile = auth2.currentUser.get().getBasicProfile();
    const formData = new FormData();
    formData.append("google_id", profile.getId());
    formData.append("name", profile.getName());
    formData.append("profileImage", profile.getImageUrl());
    formData.append("email", profile.getEmail());
    formData.append("authtoken", id_token);
    if (id_token) {
      fetch("/signup/oauth/google", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.status) {
            signOut();
            window.location = "/";
          } else {
            document.querySelector(".error").innerHTML = res.error.msg;
            signOut();
          }
        });
    }
  }
}
function onFailure(error) {
  document.querySelector(".error").innerHTML = error.error;
  modalup("error-modal");
}

function renderButton() {
  gapi.signin2.render("my-signin2", {
    scope: "profile email",
    width: 240,
    height: 50,
    longtitle: true,
    theme: "dark",
    onsuccess: onSuccess,
    onfailure: onFailure,
  });
}

function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log("User Logged out");
  });
}

// OAuth Facebook

function checkLoginState() {
  FB.getLoginStatus(function (response) {
    if (response.status === "connected") {
      FB.api(
        "/me",
        "GET",
        { fields: "id,name,email,picture" },
        function (response) {
          let obj = {
            id: response.id,
            name: response.name,
            email: response.email,
            profileImage: response.picture.data.url
          };
          fetch("/signup/oauth/facebook", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(obj),
          })
            .then((res) => res.json())
            .then((res) => {
              if (res.status) {
                window.location = "/";
              } else {
                document.querySelector(".error").innerHTML = res.error.msg;
              }
            });
        }
      );
    } else {
      modalup("error-modal");
    }
  });
}

const emailCheck = (event) => {
  var email = document.getElementById("email");
  var mailFormat = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})|(\+[1-9]{1}[0-9]{11})+$/;
  if (email.value == "") {
    alert("  Please enter your Email or Phone Number  ");
  } else if (!mailFormat.test(email.value)) {
    modalup("valdation-modal");
    return false;
  } else {
    return true;
  }
};

var name;
var usernameFormat;
var error = document.querySelector(".user-error");
function checkname(event) {
  var username = event.target;
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
  if (event.target.value !== "") {
    fetch(`/username/${username.value}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        name = res;
        if (!res) {
          error.innerHTML = "Username is already exists";
          error.style.display = "inline";
          username.style.borderColor = "#ec1919";
        }
      });
  }
}

function valid(event) {
  if (name === "true" && usernameFormat) {
    return true;
  } else {
    return false;
  }
}

const blockDoctor = () => {
  fetch(`/doctor/block/${doctorid}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res) {
        document.getElementById(`${doctorid}`).remove();
        document
          .querySelector(".doctor-block-modal")
          .classList.toggle("active");
        modalup("block-sucess-modal");
      }
    });
};
const blockPatient = () => {
  fetch(`/patient/block/${doctorid}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res) {
        document.getElementById(`${doctorid}`).remove();
        document
          .querySelector(".pateint-block-modal")
          .classList.toggle("active");
        modalup("block-sucess-modal");
      }
    });
};
const unblockDoctor = () => {
  fetch(`/doctor/unblock/${doctorid}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res) {
        document.getElementById(`${doctorid}`).remove();
        document
          .querySelector(".doctor-block-modal")
          .classList.toggle("active");
        modalup("block-sucess-modal");
      }
    });
};
const unblockPatient = () => {
  fetch(`/patient/unblock/${doctorid}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
      if (res) {
        document.getElementById(`${doctorid}`).remove();
        document
          .querySelector(".pateint-block-modal")
          .classList.toggle("active");
        modalup("block-sucess-modal");
      }
    });
};
