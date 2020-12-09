function getDates(start) {
  var div = "";
  var dates = document.querySelector(".radio-section");
  dates.innerHTML = "";
  fetch(`/date?start=${start}&limit=3`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => {
        console.log(res);
      res.forEach((element, index) => {
        div += `
          <div>
            <input type="radio" name="date" id="${index}" />
            <label for="${index}" style="width: 200px">
              <span>${element}</span>
            </label>
          </div>
        `;
      });
      return dates.insertAdjacentHTML("beforeend", div);
    });
}
var start = 0;
const changeStart = (value) => {
  if (value === 1) {
    start++;
    console.log(start);
    getDates(start);
  } else if (value !== 1 && start === 0) {
    return;
  } else {
    start-- ;
    console.log(start);
    getDates(start);
  }
};
getDates(start);
