document.addEventListener('DOMContentLoaded', (event) => {
    const ctx = document.getElementById('habitGraph').getContext('2d');
    let habitChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Habit Frequency Ratios',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Days',
                        font: {
                            size: 16
                        }
                    },
                    ticks: {
                        callback: function(value, index, values) {
                            return `Day ${index + 1}`; // Label as Day 1, Day 2, etc.
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Consistency (%)',
                        font: {
                            size: 16
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%'; // Convert to percentage
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Consistency Graph',
                    font: {
                        size: 20
                    }
                },
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });

    async function updateGraph() {
        const timeRange = document.getElementById('timeRange').value;
        try {
            const response = await fetch('/habit/getFrequencyRatios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ goodOrBad: true, timeRange }) 
            });
            const data = await response.json();

            if (data.success) {
                console.log('Received data:', data);

                const labels = [];
                for (let i = 0; i < data.frequencyRatios.length; i++) {
                    labels.push(`Day ${i + 1}`);
                }

                habitChart.data.labels = labels;
                habitChart.data.datasets[0].data = data.frequencyRatios;
                habitChart.update();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error fetching data. Please try again later.');
        }
    }

    const updateButton = document.getElementById('updateGraphButton');
    if (updateButton) {
        updateButton.addEventListener('click', updateGraph);
    } else {
        console.error('Update button not found');
    }
});
