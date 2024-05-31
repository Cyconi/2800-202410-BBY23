var countDownDate;
var x;
var isRunning = false;
var pausedTime = 0;
var isPaused = isPaused;
var timeLeft;



/**
 * !IMPORTANT!
 * !IMPORTANT!
 * !IMPORTANT!
 * This is the same as timer.js because we needed 2 different codes so that if the user is on studySession.ejs the timer 
 * would technically be running twice if we used the same script. Probably an easier way to do it. but thats how we did it.
 * If you want more detailed comments look at timer.js
 */
document.addEventListener("DOMContentLoaded", function () {
    if(!timeLeft)
        return;

    if (timeLeft > 0) {
        if (isPaused) {
            pausedTime = timeLeft;
            updateTimerDisplay(pausedTime);
        } else {
            resumeTimer(timeLeft);
        }
    }
});

function breakStartStop() {
    var startStopBtn = document.getElementById("breakStartStopBtn");
    if (!isRunning) {
        
        var hours = parseInt(document.getElementById("breakHoursInput").value) || 0;
        var minutes = parseInt(document.getElementById("breakMinutesInput").value) || 0;
        var seconds = parseInt(document.getElementById("breakSecondsInput").value) || 0;
        var totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

        if (totalSeconds > 0) {
            // When timer is started for the first time
            if (pausedTime === 0) {
                countDownDate = new Date().getTime() + totalSeconds * 1000;
                pausedTime = totalSeconds * 1000; // Set pausedTime to the initial total seconds in milliseconds
            } else {
                // When timer is resumed
                countDownDate = new Date().getTime() + pausedTime;
            }

            isPaused = false;
            fetch('/study/serverTimer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    isPaused: false,
                    timer: pausedTime 
                })
            }).catch(error => console.error('Error:', error));

            startStopBtn.textContent = "Pause";
            startStopBtn.style.backgroundColor = "#f0ad4e";

            // Update the count down every 1 second
            x = setInterval(function () {
                var now = new Date().getTime();
                var distance = countDownDate - now;

                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);

                document.getElementById("break").innerHTML = hours + "h " + minutes + "m " + seconds + "s ";

                if (distance < 0) {
                    clearInterval(x);
                    document.getElementById("break").innerHTML = "TIMES UP";
                    startStopBtn.textContent = "Start";
                    startStopBtn.style.backgroundColor = "#0719c3";
                    isRunning = false;
                    pausedTime = 0;
                } else {
                    pausedTime = distance;
                }
            }, 1000);
            isRunning = true;
        } else {
            alert("Please set a valid break time.");
        }
    } else {
        clearInterval(x);
        startStopBtn.textContent = "Start";
        startStopBtn.style.backgroundColor = "#0719c3";
        isRunning = false;
        isPaused = true;
        fetch('/study/serverTimer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isPaused: true,
                timer: pausedTime 
            })
        }).catch(error => console.error('Error:', error));
    }
}

function resumeTimer(remainingTime) {
    countDownDate = new Date().getTime() + remainingTime;

    var startStopBtn = document.getElementById("breakStartStopBtn");
    startStopBtn.textContent = "Pause";
    startStopBtn.style.backgroundColor = "#f0ad4e";

    x = setInterval(function () {
        var now = new Date().getTime();
        var distance = countDownDate - now;

        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("break").innerHTML = hours + "h " + minutes + "m " + seconds + "s ";

        if (distance < 0) {
            clearInterval(x);
            document.getElementById("break").innerHTML = "TIMES UP";
            startStopBtn.textContent = "Start";
            startStopBtn.style.backgroundColor = "#0719c3";
            isRunning = false;
            pausedTime = 0;
        } else {
            pausedTime = distance;
        }
    }, 1000);
    isRunning = true;
}

function updateTimerDisplay(remainingTime) {
    var hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    document.getElementById("break").innerHTML = hours + "h " + minutes + "m " + seconds + "s ";
}

function breakResetTimer() {
    clearInterval(x);
    document.getElementById("break").innerHTML = "0h 0m 0s";
    document.getElementById("breakStartStopBtn").textContent = "Start";
    document.getElementById("breakStartStopBtn").style.backgroundColor = "#0719c3";
    isRunning = false;
    pausedTime = 0;
    isPaused = false;
    fetch('/study/serverTimer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            timer: 0,
            isPaused: true
        })
    }).catch(error => console.error('Error:', error));
}

function handleTouchStart(event) {
    this.startY = event.touches[0].clientY;
}

function updateValue(input, increment) {
    var value = parseInt(input.value);
    var max = parseInt(input.max);
    var min = parseInt(input.min);

    value = (value + increment + max + 1 - min) % (max + 1 - min) + min;

    input.value = value;
}

function enforceLimits(input) {
    var value = parseInt(input.value);
    var min = parseInt(input.min);
    var max = parseInt(input.max);

    if (value < min) {
        input.value = min;
    } else if (value > max) {
        input.value = max;
    }
}

document.querySelectorAll('input[type="number"]').forEach(function (input) {
    input.addEventListener('touchend', function (event) {
        var endY = event.changedTouches[0].clientY;
        var deltaY = this.startY - endY;
        updateValue(this, deltaY > 0 ? 1 : -1);
    });

    input.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            updateValue(this, event.key === 'ArrowUp' ? 1 : -1);
        }
    });

    input.addEventListener('input', function () {
        enforceLimits(this);
    });

    input.addEventListener('touchstart', handleTouchStart);
});
