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

document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgot-password-form');

    forgotPasswordForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const forgotPasswordModal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
        const email = document.getElementById('forgot-email').value;
        console.log("email= " + email);
        fetch('/forgot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Data" + data);
            
            console.log("forgor" + fogotPasswordModal);
            forgotPasswordModal.hide();
            if (data.success) {
                const successModal = new bootstrap.Modal(document.getElementById('modalForgot'));
                console.log("successModal = " + successModal );
                successModal.show();
            } else {
                alert(data.message || 'Failed to send reset email. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to send reset email. Please try again.');
        });
    });

    const successButton = document.getElementById('successButton');
    successButton.addEventListener('click', function() {
        const successModal = bootstrap.Modal.getInstance(document.getElementById('modalForgot'));
        console.log("successModal = " + successModal );
        successModal.hide();
    });
    forgotPasswordModal.hide();
    successModal.hide();
});

