function checkTimer() {
    fetch('/calculate', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const modal = new bootstrap.Modal(document.getElementById('modalTour'));
                modal.show();

                document.getElementById('modalTour').addEventListener('hidden.bs.modal', () => {
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.remove();
                    }
                });
            }
        })
        .catch(error => console.error('Error:', error));
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' || document.visibilityState === 'visible') {
        checkTimer();
    }
});

// Periodically check the timer every 30 seconds
setInterval(checkTimer, 1000);
