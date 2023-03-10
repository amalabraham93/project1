// const { Chart } = require("chart.js");

// // public/js/sales.js
// const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// const salesChart = {
//   labels: revenueByDayOfWeek.map(data => daysOfWeek[data.dayOfWeek - 1]),
//   datasets: [{
//     label: 'Revenue by Day of Week',
//     data:[] ,
//     backgroundColor: 'rgba(54, 162, 235, 0.2)',
//     borderColor: 'rgba(54, 162, 235, 1)',
//     borderWidth: 1
//   }]
// };

// const options = {
//   scales: {
//     yAxes: [{
//       ticks: {
//         beginAtZero: true
//       }
//     }]
//   }
// };

// const chart = new Chart(ctx, {
//   type: 'bar',
//   data: data,
//   options: options
// });







// fetch('/admin/sales')
//   .then(response => response.json())
//   .then(data => {
//     salesChart.data.datasets[0].data = data.map(data => data.totalRevenue);
//     salesChart.update();
//   });