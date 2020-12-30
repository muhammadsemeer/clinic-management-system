/* ************** Chart Js *************************** */
var ctx = document.getElementById("chart");
var myChart = new Chart(ctx, {
  type: "pie",
  data: {
    labels: ["Total", "Apporoved", "Pending", "Consulted", "Cancelled"],
    datasets: [
      {
        label: "Appointments",
        data: [total, approved, pending, consulted, deleted],
        backgroundColor: [
          "rgba(255, 99, 132)",
          "rgba(54, 162, 235)",
          "rgba(255, 206, 86)",
          "rgba(75, 192, 192)",
          "rgba(153, 102, 255)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
      },
    ],
  },
  options: {
    cutoutPercentage: 60,
    defaultFontFamily: "Poppins",
    title: {
      display: true,
      text: "Appointments",
      fontSize: 30,
      fontFamily: "Poppins",
      fontColor: "#19b9ec",
    },
  },
});

/* 
************************* D3JS Chart *********************************
*/ 
var date = document.getElementById("date");
date.value = new Date(Date.now()).toISOString().slice(0, 10);

date.addEventListener("change", (event) => {
  fecthData(event.target.value);
});

var id = location.pathname.split("/")[2];
function fecthData(date) {
  var reqDate = new Date(date).toDateString();
  fetch(`/stats-report/${id}?date=${reqDate}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.length == 0) {
        return (document.querySelector(".d3-chart").innerHTML =
          "<h1>No Datas Found</h1>");
      } else {
        return plotChart(data);
      }
    });
}

fecthData(date.value);

function plotChart(data) {
  document.querySelector(
    ".d3-chart"
  ).innerHTML = `<svg width="700" height="400"></svg>`;
  var svg = d3.select("svg"),
    width = svg.attr("width"),
    height = svg.attr("height");

  const radius = Math.min(width, height) / 2;

  var g = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2} )`);

  var color = d3.scaleOrdinal(["rgba(255, 99, 132)", "rgba(54, 162, 235)"]);

  var pie = d3.pie().value((data) => data.value);

  var arc = d3.arc().outerRadius(radius).innerRadius(125);

  var label = d3
    .arc()
    .outerRadius(radius)
    .innerRadius(radius - 50);

  var arcs = g
    .selectAll(".arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc");

  arcs
    .append("path")
    .attr("d", arc)
    .attr("fill", (d,i) => color(i));

  arcs
    .append("text")
    .attr("transform", (d) => `translate(${label.centroid(d)})`)
    .text((d) => `${ d.data.value}% ${ d.data.label}`);
}
