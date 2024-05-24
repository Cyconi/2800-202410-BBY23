// trigger the leave queue when page is unloaded. 
// Currantly theres an issue where leave/join causes the page to reload making this not function properly
window.addEventListener('beforeunload', function () {
    navigator.sendBeacon('/chat/leave');
});
//    function getQueue() {
//         fetch('/chat/updateQueue', { method: 'POST' })
//             .then(response => response.json())
//             .then(data => {
//                 if (data.success) {
//                     document.querySelector('.queueCount').textContent = data.queueCount;
//                 }
//             })
//             .catch(error => {
//                 console.error('Error checking queue:', error);
//                 setTimeout(getQueue, 5000);
//             });
//     }
//     setTimeout(getQueue, 3000);

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
            console.log('Match found! Joining chatroom...');
            window.location.href = data.redirectTo;
        }
    });
}

$(document).ready(function () {
    getQueue(); // Check the queue when the page loads
    setInterval(getQueue, 5000); // Check the queue every 3 seconds
    matchFound();
    setInterval(matchFound, 3000);
});