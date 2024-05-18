document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`/profile/profileElements`, { method: "POST" });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const userData = await response.json();
        document.querySelector('.user-name').textContent = userData.name;
        document.querySelector('.username').textContent = userData.username;
        document.querySelector('.user-email').textContent = userData.email;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`/profile/profileElements`, { method: "POST" });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const userData = await response.json();
        document.querySelector('.user-name').textContent = userData.name;
        document.querySelector('.username').textContent = userData.username;
        document.querySelector('.user-email').textContent = userData.email;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }

    // Initialize the modal
    const editProfileModalElement = document.getElementById('modalSignin');
    const editProfileModal = new bootstrap.Modal(editProfileModalElement);

    // Button to trigger the modal
    const editProfileButton = document.querySelector('.btn.btn-primary.mt-3.btn-rounded.waves-effect.w-md.waves-light');
    editProfileButton.addEventListener('click', () => {
        editProfileModal.show();
    });

    // Form submission within the modal
    const editProfileForm = editProfileModalElement.querySelector('form');
    editProfileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = editProfileForm.querySelector('#floatingInput').value;
        const username = editProfileForm.querySelector('#floatingPassword').value;
        const email = editProfileForm.querySelector('#floatingEmail').value;

        try {
            const response = await fetch('/profile/editProfile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, username, email })
            });

            const result = await response.json();
            if (result.success) {
                editProfileModal.hide();
                location.reload(); // Reload the page to see the changes
            } else {
                alert('Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    });
});


