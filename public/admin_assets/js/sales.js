// public/js/sales.js
const ctx = document.getElementById('salesChart').getContext('2d');
const salesChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Sales',
      data: [],
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      tension: 0.4
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
});

fetch('/admin/sales')
  .then(response => response.json())
  .then(data => {
    salesChart.data.datasets[0].data = data;
    salesChart.update();
  });