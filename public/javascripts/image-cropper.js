var image = document.querySelector("#input-image");
var cropper;
const change = (event) => {
  var files = event.target.files;
  image.src = URL.createObjectURL(files[0]);
};
if (image) {
  image.addEventListener("load", () => {
    document.querySelector("#crop-btn").style.display = "flex";
    cropper = new Cropper(image, {
      aspectRatio: 1 / 1,
      viewMode: 2,
      zoomOnWheel: false,
    });
  });
}

const crop = () => {
  modalup("crop-modal");
  var croppped = cropper.getCroppedCanvas({ height: 300 });
  var current = document.querySelector("canvas");
  if (current) {
    current.remove();
  }
  document.querySelector("#croped-image").appendChild(croppped);
};

function move(time, func) {
  var elem = document.getElementById("myBar");
  if (func == 1) {
    var width = 1;
    var id = setInterval(frame, time);
    function frame() {
      if (width >= 100) {
        if (time === 10) {
          move(0, 0);
          document.querySelector("#myBar").innerHTML = "Uploaded Sucessfully";
          document.querySelector("#cls-btn").style.display = "block";
        }
      } else if (width === 80 && time === 120) {
        clearInterval(id);
      } else {
        width++;
        elem.style.width = width + "%";
      }
    }
  } else {
    elem.style.width = "100%";
  }
}

const upload = (id) => {
  document.querySelector("#up-btn").style.display = "none";
  document.querySelector("#myProgress").style.display = "block";
  move(120, 1);
  cropper.getCroppedCanvas().toBlob((blob) => {
    const formData = new FormData();

    formData.append("image", blob);

    fetch("/image/upload/" + id, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status) {
          move(10, 1);
          return;
        } else {
          modalup("error-modal");
          document.querySelector("#myProgress").style.display = "none";
        }
      });
  });
};
