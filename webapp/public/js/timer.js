var countDownDate;
var x;
var isRunning = false;
var pausedTime;

// Function to start or stop the countdown
function startStop() {
    var startStopBtn = document.getElementById("startStopBtn");
    if (!isRunning) {
        if (!pausedTime) {
            var hours = parseInt(document.getElementById("hoursInput").value) || 0;
            var minutes = parseInt(document.getElementById("minutesInput").value) || 0;
            var seconds = parseInt(document.getElementById("secondsInput").value) || 0;

            // Calculate total seconds
            var totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

            countDownDate = new Date().getTime() + totalSeconds * 1000;
        } else {
            countDownDate = new Date().getTime() + pausedTime;
        }

        startStopBtn.textContent = "Pause";
        startStopBtn.style.backgroundColor = "#f0ad4e";

        // Update the count down every 1 second
        x = setInterval(function () {
            var now = new Date().getTime();
            var distance = countDownDate - now;

            // Time calculations for hours, minutes and seconds
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Output the result in an element with id="demo"
            document.getElementById("demo").innerHTML = hours + "h "
                + minutes + "m " + seconds + "s ";

            // If the count down is over, write some text 
            if (distance < 0) {
                clearInterval(x);
                document.getElementById("demo").innerHTML = "TIMES UP";
                startStopBtn.textContent = "Start";
                startStopBtn.style.backgroundColor = "#5cb85c";
                isRunning = false;
                pausedTime = null;
            } else {
                pausedTime = distance;
            }
        }, 1000);
        isRunning = true;
    } else {
        clearInterval(x);
        startStopBtn.textContent = "Start";
        startStopBtn.style.backgroundColor = "#5cb85c";
        isRunning = false;
    }
}

// Function to reset the timer
function resetTimer() {
    clearInterval(x);
    document.getElementById("demo").innerHTML = "0h 0m 0s";
    document.getElementById("startStopBtn").textContent = "Start";
    document.getElementById("startStopBtn").style.backgroundColor = "#5cb85c";
    isRunning = false;
    pausedTime = null;
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

function handleTouchStart(event) {
    this.startY = event.touches[0].clientY;
}

// Function to enforce input limits
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

// Add combined touch and keydown event listeners to the number inputs
document.querySelectorAll('input[type="number"]').forEach(function (input) {
    input.addEventListener('touchend', function (event) {
        var endY = event.changedTouches[0].clientY;
        var deltaY = this.startY - endY;
        updateValue(this, deltaY > 0 ? 1 : -1);
    });

    input.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault(); // Prevent the default action
            updateValue(this, event.key === 'ArrowUp' ? 1 : -1);
        }
    });

    input.addEventListener('input', function () {
        enforceLimits(this);
    });

    input.addEventListener('touchstart', handleTouchStart);
});