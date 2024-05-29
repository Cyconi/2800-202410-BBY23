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
        breakResetTimer();
    }
});

// Periodically check the timer every 30 seconds
setInterval(checkTimer, 2000);

function checkNotification() {
    fetch('/checkHabitNotification', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.notify) {
                const notificationArea = document.getElementById('notification-area');
                const closeNotification = document.getElementById('close-notification');
                const explIcon = document.getElementById('expl-icon');
                
                if (notificationArea) {
                    notificationArea.style.display = "block";
                    closeNotification.addEventListener('click', function() {
                        notificationArea.style.display = "none";
                    });
                }
                if (explIcon) {
                    explIcon.style.filter = "invert(21%) sepia(88%) saturate(6645%) hue-rotate(358deg) brightness(96%) contrast(125%)";
                }   
            }
            if(data.success && !data.notify){
                const explIcon = document.getElementById('expl-icon');
                if (explIcon) {
                    explIcon.style.filter = "invert(21%) sepia(88%) saturate(6645%) hue-rotate(358deg) brightness(96%) contrast(125%)";
                }   
            }
        })
        .catch(error => {
            setTimeout(checkNotification, 60 * 60* 1000); // Retry after 1 hour if there's an error
        });
}

checkNotification();
setInterval(checkNotification, 60 * 60* 1000);

document.addEventListener('DOMContentLoaded', function() {
    let enterEmailModalInstance;
    let forgotPasswordModalInstance;
    let successModalInstance;
    let loginFailedModalInstance;
    let isEmailRequestInProgress = false;
    let enteredEmail = '';  // Variable to store the entered email

    const forgotPasswordButton = document.getElementById('forgotPasswordLink');
    const enterEmailForm = document.getElementById('enter-email-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const successButton = document.getElementById('successButton');

    // Show enter email modal
    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener('click', function(event) {
            event.preventDefault();
            if (!enterEmailModalInstance) {
                enterEmailModalInstance = new bootstrap.Modal(document.getElementById('enterEmailModal'));
            }
            enterEmailModalInstance.show();
        });
    }

    // Handle enter email form submission
    if (enterEmailForm) {
        enterEmailForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const email = document.getElementById('enter-email').value;
            if (email) {
                const response = await fetch('/getSecurityQuestion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                if (data.success) {
                    if (data.question) {
                        document.getElementById('securityQuestion').innerText = data.question;
                        enteredEmail = email;  // Store the entered email
                        if (!forgotPasswordModalInstance) {
                            forgotPasswordModalInstance = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
                        }
                        enterEmailModalInstance.hide();
                        forgotPasswordModalInstance.show();
                    } else {
                        // Directly handle password reset if no security question is set
                        fetch('/forgot', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ email: email })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                if (!successModalInstance) {
                                    successModalInstance = new bootstrap.Modal(document.getElementById('modalForgot'));
                                }
                                enterEmailModalInstance.hide();
                                successModalInstance.show();
                            } else {
                                alert(data.message || 'Failed to send reset email. Please try again.');
                            }
                        })
                        .catch(error => {
                            alert('Failed to send reset email. Please try again.');
                        });
                    }
                }
            }
        });
    }

    // Handle forgot password form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(event) {
            event.preventDefault();
            if (isEmailRequestInProgress) return; 
            isEmailRequestInProgress = true;

            const securityAnswer = document.getElementById('forgot-security-answer').value;

            fetch('/forgot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: enteredEmail, securityAnswer: securityAnswer })  // Use the stored email
            })
            .then(response => response.json())
            .then(data => {
                isEmailRequestInProgress = false;
                if (forgotPasswordModalInstance) {
                    forgotPasswordModalInstance.hide();
                }
                if (data.success) {
                    if (!successModalInstance) {
                        successModalInstance = new bootstrap.Modal(document.getElementById('modalForgot'));
                    }
                    successModalInstance.show();
                } else {
                    const errorMessage = data.message || 'Failed to send reset email. Please try again.';
                    document.getElementById('forgot-password-error').innerText = errorMessage;
                    document.getElementById('forgot-password-error').style.display = 'block';
                }
            })
            .catch(error => {
                isEmailRequestInProgress = false;
                const errorMessage = 'Failed to send reset email. Please try again.';
                document.getElementById('forgot-password-error').innerText = errorMessage;
                document.getElementById('forgot-password-error').style.display = 'block';
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

    // Handle login form submission
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const data = {
                identifier: formData.get('identifier'),
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
                const errorMessageHeader = document.getElementById('errorMessageH');
                const errorMessageBody = document.getElementById('errorMessageB');
                if (!loginFailedModalInstance) {
                    loginFailedModalInstance = new bootstrap.Modal(document.getElementById('modalLoginFailed'));
                }

                // Update LoginFailed Modal
                let headerMsg = errorData.message;
                errorMessageHeader.textContent = headerMsg.charAt(0).toUpperCase() + headerMsg.slice(1);
                errorMessageBody.textContent = errorData.message; 
                loginFailedModalInstance.show();
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
                const modalElement = document.getElementById('modalTour');
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
    
    // Handle FAQ modal
    const faqButton = document.getElementById('faqButton');
    const modalFAQ = document.getElementById('modalFAQ');
    if (faqButton) {
        if (modalFAQ) {
            let enabled = false;
            fetch('/checkFAQ', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ faqItem })
            }).then(response => response.json())
            .then(data => {
                if (data.success) {
                    const spanElement = faqButton.querySelector('span');
                    spanElement.style.color = 'red';
                    faqButton.style.display = 'block';
                    enabled = true;
                    if (window.location.href.includes("home1")) {
                        const faqModal = new bootstrap.Modal(modalFAQ);
                        faqModal.show();
                    }
                }
            })
            .catch(error => {
                console.log(error.message);
            });
            if(!enabled){
                faqButton.style.display = 'block';
            }
            faqButton.addEventListener('click', function() {
                fetch('/updateFAQ', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ faqItem })
                }).catch(error => {
                    console.log(error.message);
                });
                const spanElement = faqButton.querySelector('span');
                spanElement.style.color = '#FFFFFF';
                const faqModal = new bootstrap.Modal(modalFAQ);
                faqModal.show();
            });
        }
    }

    // Handle user already exists modal
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const formData = $(this).serialize();
            $.post('/signup', formData, function(data) {
                if (data.success) {
                    window.location.href = "/home1";
                } else if (data.message === "User already exists.") {
                    $('#modalUserExists').modal('show'); 
                } else {
                    alert(data.message || 'Signup failed. Please try again.');
                }
            });
        });
    }
});

// Function for back button
function goBack() {
    localStorage.setItem('refresh', 'true');
    window.history.back();
}
window.onload = function () {
    if (localStorage.getItem('refresh') === 'true') {
        localStorage.removeItem('refresh');
        location.reload();
    }
}
window.onpageshow = function (event) {
    if (event.persisted) {
        window.location.reload();
    }
};

// auto leave function for chat room
async function autoLeave() {
    try {
        let response = await fetch('/chat/autoleave', { method: 'POST' });
    
        let data = await response.json();
        //if (data.success) {}
    } catch (error) {}
}
// auto leave function for chat room
$(document).ready(function () {
    autoLeave();
    setInterval(autoLeave, 5000);
});