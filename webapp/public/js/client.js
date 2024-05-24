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
                } else {
                    alert(data.message || 'Failed to fetch security question. Please try again.');
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
            console.log(data);
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
    if (faqButton) {
        faqButton.addEventListener('click', function() {
            const faqModal = new bootstrap.Modal(document.getElementById('modalFAQ'));
            faqModal.show();
        });
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
    window.history.back();
    window.location.reload();
}

function autoLeave() {
    $.get('/chat/autoleave', function (data) {
        if (data.success) {
            console.log("not on waiting page");
        }
    });
}

$(document).ready(function () {
    autoLeave();
    setInterval(autoLeave, 5000);
});
