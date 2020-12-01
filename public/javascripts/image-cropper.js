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

const upload = () => {
  cropper.getCroppedCanvas().toBlob((blob) => {
    const formData = new FormData();

    formData.append("image", blob);

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
      });
  });
};
