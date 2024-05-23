function checkTimer() {
    fetch('/calculate', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const modalElement = document.getElementById('timer');
                if (modalElement) {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();

                    modalElement.addEventListener('hidden.bs.modal', () => {
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                            backdrop.remove();
                        }
                    });
                }
            }
        })
        .catch(error => {
            setTimeout(checkTimer, 180000); // Retry after 3 minutes if there's an error
        });
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' || document.visibilityState === 'visible') {
        checkTimer();
    }
});

// Periodically check the timer every 30 seconds
setInterval(checkTimer, 2000);


function checkNotification(){
    console.log("RAN IT");
    fetch('/checkHabitNotification', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.success) {
                console.log("success");
                if(data.notify){
                    console.log("notify");
                    const modalElement = document.getElementById('timer');
                    if (modalElement) {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();

                        modalElement.addEventListener('hidden.bs.modal', () => {
                            const backdrop = document.querySelector('.modal-backdrop');
                            if (backdrop) {
                                backdrop.remove();
                            }
                        });
                    }
                }
            }
        })
        .catch(error => {
            setTimeout(checkTimer, 3600000); 
        });
}

checkNotification();

setInterval(checkNotification, 3600000);

document.addEventListener('DOMContentLoaded', function() {
    let forgotPasswordModalInstance;
    let successModalInstance;
    let loginFailedModalInstance; // Add a reference for the login failed modal
    let isEmailRequestInProgress = false; // Flag to prevent duplicate requests
    const forgotPasswordButton = document.getElementById('forgotPasswordLink');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const successButton = document.getElementById('successButton');

    // Ensure forgot password modal is only shown once
    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener('click', function(event) {
            event.preventDefault();
            if (!forgotPasswordModalInstance) {
                forgotPasswordModalInstance = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
            }
            forgotPasswordModalInstance.show();
        });
    }

    // Handle forgot password form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(event) {
            event.preventDefault();
            if (isEmailRequestInProgress) return; // Prevent duplicate requests
            isEmailRequestInProgress = true;

            const email = document.getElementById('forgot-email').value;

            fetch('/forgot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            })
            .then(response => response.json())
            .then(data => {
                isEmailRequestInProgress = false; // Reset flag
                if (forgotPasswordModalInstance) {
                    forgotPasswordModalInstance.hide();
                }
                if (data.success) {
                    if (!successModalInstance) {
                        successModalInstance = new bootstrap.Modal(document.getElementById('modalForgot'));
                    }
                    successModalInstance.show();
                } else {
                    alert(data.message || 'Failed to send reset email. Please try again.');
                }
            })
            .catch(error => {
                isEmailRequestInProgress = false; // Reset flag
                alert('Failed to send reset email. Please try again.');
            });
        });
    }

    // Handle success modal close button
    if (successButton) {
        successButton.addEventListener('click', function() {
            if (successModalInstance) {
                successModalInstance.hide();
            }
        });
    }

    // Handle reset password form submission
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const data = {
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const modalElement = document.getElementById('timer');
                if (modalElement) {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                }
            } else {
                const errorData = await response.json();
                alert('Error: ' + errorData.message);
            }
        });
    }

    // Handle modal button click
    const modalButton = document.getElementById('modalButton');
    if (modalButton) {
        modalButton.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

    // Handle login form submission
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const data = {
                username: formData.get('username'),
                password: formData.get('password')
            };
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const errorData = await response.json();
            if (response.ok) {
                window.location.href = '/home1';
            } else {
                const errorMessageHeader = document.getElementById('errorMessageH'); // Header LoginFailed Modal
                const errorMessageBody = document.getElementById('errorMessageB'); // Body LoginFailed Modal
                if (!loginFailedModalInstance) {
                    loginFailedModalInstance = new bootstrap.Modal(document.getElementById('modalLoginFailed'));
                }

                // Header LoginFailed Modal
                // errorMessageHeader.textContent = errorData.message; // Original code
                let headerMsg = errorData.message;
                errorMessageHeader.textContent = headerMsg.charAt(0).toUpperCase() + headerMsg.slice(1);

                // Body LoginFailed Modal
                errorMessageBody.textContent = errorData.message; 
                loginFailedModalInstance.show();
            }
        });
    }
});

function goBack() { // for back button
    window.history.back();
}

// ? Modals Header
document.addEventListener('DOMContentLoaded', function() {
    const faqButton = document.getElementById('faqButton');
    const faqModal = new bootstrap.Modal(document.getElementById('modalFAQ'));
      
    if (faqButton) {
        faqButton.addEventListener('click', function() {
            faqModal.show();
        });
    }
});

// user already exists modal
document.addEventListener('DOMContentLoaded', function() {
    // Get the signup form
    const signupForm = document.getElementById('signup-form');

    // Handle signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();

            // Serialize form data
            var formData = $(this).serialize();

            // Send POST request
            $.post('/signup', formData, function(data) {
                if (data.success) {
                    // Handle successful signup
                    // Redirect to dashboard or show a success message
                    // window.location.href = '/dashboard'; // replace '/dashboard' with the actual path
                } else if (data.message === "User already exists.") {
                    // Show the modal
                    $('#modalUserExists').modal('show'); 
                } else {
                    // Handle other errors
                    // Show an error message
                    alert(data.message || 'Signup failed. Please try again.');
                }
            });
        });
    }
});


