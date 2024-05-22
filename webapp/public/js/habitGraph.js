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
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true
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
                const labels = [];
                const currentDate = new Date(data.start);
                while (currentDate <= new Date(data.end)) {
                    labels.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
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

    // Attach event listener to the update button
    const updateButton = document.getElementById('updateGraphButton');
    if (updateButton) {
        console.log('Button found:', updateButton);
        updateButton.addEventListener('click', updateGraph);
        console.log('Event listener added');
    } else {
        console.error('Button not found');
    }
});
