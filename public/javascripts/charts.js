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
      fontColor: "#19b9ec"
    },
  },
});
