// trigger the leave queue when page is unloaded. 

//Represents how fast we check if the user is still in queue.
//@default 5000
const GETQUEUETIME = 5000;

//Represents how fast we check if the user is in a chatroom.
//@default 3000
const GETMATCHFOUND = 3000;

window.addEventListener('beforeunload', function () {
    navigator.sendBeacon('/chat/leave');
});

function getQueue() {
    $.get('/chat/updateQueue', function (data) {
        if (data.success) {
            document.querySelector('.queueCount').textContent = data.queueCount;
        }
    }).fail(function (error) {
        console.error('Error checking queue:', error);
        setTimeout(getQueue, 5000);
    });
}

function matchFound() {
    $.get('/chat/matchFound', function (data) {
        if (data.success) {
            window.location.href = data.redirectTo;
        }
    });
}

$(document).ready(function () {
    getQueue(); 
    setInterval(getQueue, GETQUEUETIME); 
    matchFound();
    setInterval(matchFound, GETMATCHFOUND);
});