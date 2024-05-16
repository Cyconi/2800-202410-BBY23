document.addEventListener('DOMContentLoaded', function () {
    const deleteForms = document.querySelectorAll('.delete-form');

    deleteForms.forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const habitID = form.querySelector('input[name="habitID"]').value;
            const habitGood = form.querySelector('input[name="habitGood"]').value;

            fetch('/habit/deleteHabit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    habitID: habitID,
                    habitGood: habitGood
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const modal = new bootstrap.Modal(document.getElementById('modalTour'));
                    modal.show();
                } else {
                    alert('Failed to delete habit. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to delete habit. Please try again.');
            });
        });
    });

    // Add event listener to modal button to reload the page
    const modalButton = document.querySelector('#modalTour button[data-bs-dismiss="modal"]');
    modalButton.addEventListener('click', function () {
        location.reload();
    });
});
document.addEventListener('DOMContentLoaded', function () {
    const deleteForms = document.querySelectorAll('.me-1 me-sm-2');

    deleteForms.forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const habitID = form.querySelector('input[name="habitID"]').value;
            const habitGood = form.querySelector('input[name="habitGood"]').value;

            
        });
    });
});


document.addEventListener("DOMContentLoaded", async() => {
    const response = await fetch('/habit/name', {method:"POST"});
    const userData = await response.json();
    document.querySelector('.name').textContent = userData.name;
});