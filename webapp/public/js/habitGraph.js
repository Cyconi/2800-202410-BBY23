/**
 * Most of this code is chatGPT'd we did not know how to make a graph display properly at the time.
 * We will still comment it to show we understand the code.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('habitGraph');
    const ctx = canvas.getContext('2d');
    //Resizes the canvas.
    function resizeCanvas() {
        var aspectRatio = 2;
        canvas.width = canvas.parentElement.clientWidth;
        if(canvas.width <= 400){
            aspectRatio = 1;
        }
        canvas.height = canvas.width / aspectRatio;
    }

    resizeCanvas(); 
    window.addEventListener('resize', resizeCanvas);
    //Actually makes the chart with the given values.
    let habitChart = new Chart(ctx, {
        //This is the Y axis.
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
        //This is the X axis.
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
                            return `Day ${index + 1}`; 
                        }
                    }
                },
                y: {
                    //Make sure it goes from 0%->100%
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Consistency (%)',
                        font: {
                            size: 16
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%'; 
                        },
                        reverse: true
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                maintainAspectRatio: false 
            }
        }
    });
    //Puts in the values into the graph.
    async function updateGraph() {
        const timeRange = document.getElementById('timeRange').value;
        try {
            //Calls a fetch which calculates frequency ratios.
            const response = await fetch('/habit/getFrequencyRatios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                //Only displays the good or bad habits.
                body: JSON.stringify({ goodOrBad: goodOrBad, timeRange }) 
            });
            const data = await response.json();
            //If successful fetch fill in the data.
            if (data.success) {
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
    updateGraph();
    resizeCanvas();
    const updateButton = document.getElementById('updateGraphButton');
    if (updateButton) {
        updateButton.addEventListener('click', updateGraph);
    } else {
        console.error('Update button not found');
    }
});
