let currentQuestionIndex = -1;
let scenario = null;
let scenarioID = null;
document.addEventListener('DOMContentLoaded', () => {
    const narratorDiv = document.getElementById('narrator');
    const questionDiv = document.getElementById('question');
    const optionsDiv = document.getElementById('options');
    const continueButton = document.getElementById('continue-button');
    const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
    const modalFeedbackText = document.getElementById('modalFeedbackText');
    const modalFeedbackGif = document.getElementById('modalFeedbackImage');
    const progressBar = document.getElementById('progress-bar');
    const completionModal = new bootstrap.Modal(document.getElementById('completionModal'));
    const completionImage = document.getElementById('completionImage');

    function startGame(scenarioUrl) {
        fetch(scenarioUrl)
            .then(response => response.json())
            .then(data => {
                scenario = data.scenarios[0];
                scenarioID = scenario.id;
                showIntroduction();
            })
            .catch(error => console.error('Error fetching scenario:', error));
    }

    function showIntroduction() {
        console.log(scenarioID);
        if (scenario.narrator) {
            narratorDiv.textContent = scenario.narrator;
            questionDiv.classList.add('hidden');
            optionsDiv.classList.add('hidden');
            narratorDiv.classList.remove('hidden');
            continueButton.classList.remove('hidden');
            continueButton.onclick = nextQuestion;
        } else {
            console.log(scenarioID);
            nextQuestion();
        }
    }

    function showNarrator(text) {
        if (text) {
            narratorDiv.textContent = text;
            narratorDiv.classList.remove('hidden');
        } else {
            narratorDiv.classList.add('hidden');
        }
    }

    function showQuestion() {
        if (currentQuestionIndex >= 0 && currentQuestionIndex < scenario.questions.length) {
            const question = scenario.questions[currentQuestionIndex];

            showNarrator(question.narrator);

            questionDiv.textContent = question.text;
            optionsDiv.innerHTML = '';

            if (question.type === 'image') {
                question.images.forEach((imageSrc, index) => {
                    const img = document.createElement('img');
                    img.src = imageSrc;
                    img.alt = `Option ${index + 1}`;
                    img.classList.add('question-image');

                    const button = document.createElement('button');
                    button.textContent = question.options[index].text;
                    button.classList.add('option-button');
                    button.style.setProperty('--order', index + 1);
                    button.addEventListener('click', () => handleAnswer(question.options[index], button));

                    optionsDiv.appendChild(img);
                    optionsDiv.appendChild(button);
                });
            } else {
                question.options.forEach((option, index) => {
                    const button = document.createElement('button');
                    button.textContent = option.text;
                    button.classList.add('option-button');
                    button.style.setProperty('--order', index + 1);
                    button.addEventListener('click', () => handleAnswer(option, button));
                    optionsDiv.appendChild(button);
                });
            }

            questionDiv.classList.remove('hidden');
            optionsDiv.classList.remove('hidden');
            continueButton.classList.add('hidden');
            const progress = ((currentQuestionIndex + 1) / scenario.questions.length) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        } else {
            console.log(scenarioID);
            showCompletionModal();
        }
    }

    function showFeedbackInModal(feedbackText) {
        const gifSrc = 'img/incorrect.png';
        modalFeedbackText.textContent = feedbackText;
        modalFeedbackGif.innerHTML = gifSrc ? `<img src="${gifSrc}" alt="Feedback GIF" class="img-fluid">` : '';
        feedbackModal.show();
    }

    function handleAnswer(option, button) {
        if (option.correct) {
            button.classList.add('correct');
            setTimeout(nextQuestion, 500);
        } else {
            button.classList.add('incorrect');
            showFeedbackInModal(option.feedback);
            continueButton.classList.remove('hidden');
            continueButton.onclick = nextQuestion;
        }
    }

    function nextQuestion() {
        console.log(scenarioID);
        currentQuestionIndex++;
        showQuestion();
    }

    function showCompletionModal() {
        console.log(scenarioID);
        fetch('/interpersonal/completed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ scenarioID: scenarioID })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Scenario completion status updated');
            } else {
                console.error('Failed to update scenario completion status');
            }
        })
        .catch(error => {
            console.error('Error updating scenario completion status:', error);
        });
        completionImage.innerHTML = '<img src="img/success-icon.png" alt="Completion Image" class="img-fluid">';
        completionModal.show();
        document.getElementById('profileButton').onclick = () => window.location.href = '/home1';
        document.getElementById('selectScenarioButton').onclick = () => window.location.href = '/interpersonal/select-scenario';
    }

    const scenarioUrl = sessionStorage.getItem('scenarioUrl');
    if (scenarioUrl) {
        startGame(scenarioUrl);
    } else {
        alert('No scenario selected!');
        window.location.href = '/interpersonal/select-scenario';
    }
});
