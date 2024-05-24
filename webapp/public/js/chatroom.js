window.addEventListener('beforeunload', function () {
    navigator.sendBeacon('/chat/closeRoom');
});

// Fetch the chat messages when the page loads
function fetchMessages() {
    $.get('/chat/pullMsg', function (data) {
        var chatMessages = document.getElementById('chat-messages');
        // Clear the chat messages
        chatMessages.innerHTML = '';
        if (data.success && data.chatRoom) {
            data.chatRoom.forEach(function (message) {
                var messageElement = document.createElement('div');
                if (data.email == message.email)
                    messageElement.className = 'container lighter bg-info text-white';
                else
                    messageElement.className = 'container darker bg-dark text-white';
                messageElement.innerHTML = `
                    <div><strong>${message.sender}</strong></div>
                    <div>
                        ${message.message}
                        <span class="time-right">${new Date(message.timestamp).toLocaleTimeString()}</span>
                    </div>`;
                chatMessages.appendChild(messageElement);
            });
        } else {
            roomNotFound();
        }
    });
}
function roomNotFound() {
    $.get('/chat/pullMsg', function (data) {
        if (!data.success) {
            window.location.href = data.redirectTo;
        }
    });
}

$(document).ready(function () {
    fetchMessages(); // Fetch messages when the page loads
    setInterval(fetchMessages, 2000); // Fetch messages every 5 seconds
    //setInterval(leaveRoom, 2000); // removes user from chat room if it no long exists
});

// Send a new message when the form is submitted
document.getElementById('message-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    var messageInput = document.getElementById('message-input');
    var msg = messageInput.value;

    if (msg) {
        // TODO: Send the message to the server
        fetch('/chat/pushMsg',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: msg
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    fetchMessages();
                }
            })
            .catch(error => {
                console.error('Error sending msg to server:', error);
            });

        // Clear the input field
        messageInput.value = '';
    }
});

// countdown timer code
var timeLeft = 0xB4; // Start with 3 minutes
var timerElement = document.getElementById('timer');

function updateTimer() {
    var minutes = Math.floor(timeLeft / 60);
    var seconds = timeLeft % 60;
    timerElement.textContent = 'Time Left: ' + minutes + 'm ' + seconds + 's';
}

function countdown() {
    if (timeLeft <= 0) {
        clearInterval(intervalId);
        timerElement.textContent = 'Time Left: 0m 0s';
        // Add a 3 second delay before submitting the form
        setTimeout(function () {
            //document.querySelector("form[action='/chat/closeRoom']").submit();
        }, 3000);
    } else {
        timeLeft--;
        updateTimer();
    }
}
var intervalId = setInterval(countdown, 1000);

document.getElementById('addMinute').addEventListener('click', function () {
    timeLeft += 60; // Add a minute
    updateTimer();
});