var image = document.querySelector("#input-image");
var cropper;
const change = (event) => {
  var files = event.target.files;
  image.src = URL.createObjectURL(files[0]);
};
image.addEventListener("load", () => {
  document.querySelector("#crop-btn").style.display = "flex";
  cropper = new Cropper(image, {
    aspectRatio: 1 / 1,
    viewMode: 2,
    zoomOnWheel: false,
  });
});

const crop = () => {
  modalup("crop-modal");
  var croppped = cropper.getCroppedCanvas({ height: 300 });
  var current = document.querySelector("canvas");
  if (current) {
    current.remove();
  }
  document.querySelector("#croped-image").appendChild(croppped);
};

var i = 0;
function move(time) {
  if (i == 0) {
    i = 1;
    var elem = document.getElementById("myBar");
    var width = 1;
    var id = setInterval(frame, time);
    function frame() {
      if (width >= 100) {
        if (time === 10) {
          clearInterval(id);
          i = 0;
          document.querySelector("#myBar").innerHTML = "Uploaded Sucessfully";
          setTimeout(() => {
            window.location = "/users";
          }, 500);
        }
      } else {
        width++;
        elem.style.width = width + "%";
      }
    }
  }
}

const upload = (id) => {
  document.querySelector("#up-btn").style.display = "none";
  document.querySelector("#myProgress").style.display = "block";
  move(1000);
  cropper.getCroppedCanvas().toBlob((blob) => {
    const formData = new FormData();

    formData.append("image", blob);

    fetch("/doctor/upload/" + id, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status) {
          i = 0;
          move(10);
          return;
        } else {
          modalup("error-modal");
        }
      });
  });
};
