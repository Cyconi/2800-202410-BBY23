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
                    document.querySelector('.habitName').textContent = data.habit;
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

    const modalButton = document.querySelector('#modalTour button[data-bs-dismiss="modal"]');
    modalButton.addEventListener('click', function () {
        location.reload();
    });
});


document.addEventListener("DOMContentLoaded", async() => {
    const response = await fetch('/habit/name', {method:"POST"});
    const userData = await response.json();
    document.querySelector('.name').textContent = userData.name;
});

document.addEventListener('DOMContentLoaded', function () {
    const editForms = document.querySelectorAll('.edit-form');

    editForms.forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            const habitID = form.querySelector('input[name="habitID"]').value;
            const habitGood = form.querySelector('input[name="habitGood"]').value;
            const habitName = form.querySelector('input[name="habitName"]').value;
            const habitQuestion = form.querySelector('input[name="habitQuestion"]').value;

            fetch('/habit/editHabit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    habitID: habitID,
                    habitGood: habitGood,
                    habit: habitName,
                    question: habitQuestion
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalSignin'));
                    modal.hide();
                    location.reload(); 
                } else {
                    alert('Failed to edit habit. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to edit habit. Please try again.');
            });
        });
    });
});

document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch('/habit/name', { method: "POST" });
    const userData = await response.json();
    document.querySelector('.name').textContent = userData.name;
});

document.addEventListener('DOMContentLoaded', function () {
    const editButtons = document.querySelectorAll('.edit-button');

    editButtons.forEach(button => {
        button.addEventListener('click', function () {
            const habitID = this.querySelector('input[name="habitID"]').value;
            const habitGood = this.querySelector('input[name="habitGood"]').value;
            const habitName = this.querySelector('input[name="habitName"]').value;
            const habitQuestion = this.querySelector('input[name="habitQuestion"]').value;

            document.getElementById('editHabitID').value = habitID;
            document.getElementById('editHabitGood').value = habitGood;
            document.getElementById('editHabitName').value = habitName;
            document.getElementById('editHabitQuestion').value = habitQuestion;
        });
    });
});
