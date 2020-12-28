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
const data = [
  {
    label: "Appointment",
    value: 7,
  },
  {
    label: "Pateints",
    value: 10,
  },
  {
    label: "Total",
    value: 11,
  },
];

var svg = d3.select("svg"),
  width = svg.attr("width"),
  height = svg.attr("height");

const radius = Math.min(width, height) / 2;

var g = svg
  .append("g")
  .attr("transform", `translate(${width / 2}, ${height / 2} )`);

var color = d3.scaleOrdinal([
  "rgba(255, 99, 132)",
  "rgba(54, 162, 235)",
  "rgba(255, 206, 86)",
]);

var pie = d3.pie().value((data) => data.value);

var arc = d3.arc().outerRadius(radius).innerRadius(125);

var label = d3
  .arc()
  .outerRadius(radius)
  .innerRadius(radius - 90);

var arcs = g
  .selectAll(".arc")
  .data(pie(data))
  .enter()
  .append("g")
  .attr("class", "arc");

arcs
  .append("path")
  .attr("d", arc)
  .attr("fill", (d) => color(d.data.value));

arcs
  .append("text")
  .attr("transform", (d) => `translate(${label.centroid(d)})`)
  .text((d) => d.data.label);
