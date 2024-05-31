/**
 * This script manages the gameplay flow for the interpersonal game.
 * It fetches scenario data, handles user interactions, and updates the game progress.
 */

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

    /**
     * Starts the game by fetching the scenario data from the provided URL.
     * Initializes the game with the first scenario and prepares the introduction.
     * @param {string} scenarioUrl - The URL of the scenario JSON file.
     */
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

   /**
     * Shows the introduction text from the scenario.
     * Displays the narrator text and sets up the continue button to proceed to the first question.
     */
    function showIntroduction() {
        if (scenario.narrator) {
            narratorDiv.textContent = scenario.narrator;
            questionDiv.classList.add('hidden');
            optionsDiv.classList.add('hidden');
            narratorDiv.classList.remove('hidden');
            continueButton.classList.remove('hidden');
            continueButton.onclick = nextQuestion;
        } else {
            nextQuestion();
        }
    }

    /**
     * Displays the narrator text.
     * @param {string} text - The text to display in the narrator div.
     */
    function showNarrator(text) {
        if (text) {
            narratorDiv.textContent = text;
            narratorDiv.classList.remove('hidden');
        } else {
            narratorDiv.classList.add('hidden');
        }
    }

     /**
     * Displays the current question and its options.
     * Updates the progress bar and handles image and text questions separately.
     * 
     * This function was created with the help of ChatGPT.
     */
    function showQuestion() {
        if (currentQuestionIndex >= 0 && currentQuestionIndex < scenario.questions.length) {
            const question = scenario.questions[currentQuestionIndex];

            showNarrator(question.narrator);

            questionDiv.textContent = question.text;
            optionsDiv.innerHTML = '';

            if (question.type === 'image') {
                // For image type questions, create and display images and buttons for each option
                question.images.forEach((imageSrc, index) => {
                    const img = document.createElement('img');
                    img.src = imageSrc;
                    img.alt = `Option ${index + 1}`;
                    img.classList.add('question-image');
                    img.style.width = '200px';
                    img.style.display = 'block';
                    img.style.margin = '0 auto';

                    const button = document.createElement('button');
                    button.textContent = question.options[index].text;
                    button.classList.add('option-button');
                     // Set custom CSS property for animation order
                    button.style.setProperty('--order', index + 1);
                    button.addEventListener('click', () => handleAnswer(question.options[index], button));

                    optionsDiv.appendChild(img);
                    optionsDiv.appendChild(button);
                });
            } else {
                // For text type questions, create and display buttons for each option
                question.options.forEach((option, index) => {
                    const button = document.createElement('button');
                    button.textContent = option.text;
                    button.classList.add('option-button');
                    // Set custom CSS property for animation order
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
            showCompletionModal();
        }
    }

    /**
     * Displays feedback in a modal window.
     * Provides feedback to the user based on their answer.
     * @param {string} feedbackText - The feedback text to display.
     */
    function showFeedbackInModal(feedbackText) {
        const gifSrc = 'img/incorrect.png';
        modalFeedbackText.textContent = feedbackText;
        modalFeedbackGif.innerHTML = gifSrc ? `<img src="${gifSrc}" alt="Feedback GIF" class="img-fluid">` : '';
        feedbackModal.show();
    }

    /**
     * Handles the user's answer selection.
     * Marks the answer as correct or incorrect and shows feedback accordingly.
     * @param {object} option - The selected option object.
     * @param {HTMLElement} button - The button element that was clicked.
     */
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

    /**
     * Advances to the next question in the scenario.
     * Increments the current question index and displays the next question.
     */
    function nextQuestion() {
        currentQuestionIndex++;
        showQuestion();
    }

    /**
     * Shows the completion modal when the scenario is finished.
     * Updates the scenario completion status on the server and displays a success message.
     */
    function showCompletionModal() {
        //Fetches if the user has ever completed this scenario. If not, we mark it as completed.
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
            } else {
                console.error('Failed to update scenario completion status');
            }
        })
        .catch(error => {
            console.error('Error updating scenario completion status:', error);
        });
        //after the fetch show the modal that you've completed it.
        completionImage.innerHTML = '<img src="img/success-icon.png" alt="Completion Image" class="img-fluid">';
        completionModal.show();
        document.getElementById('profileButton').onclick = () => window.location.href = '/home1';
        document.getElementById('selectScenarioButton').onclick = () => window.location.href = '/interpersonal/select-scenario';
    }

    // Start the game by fetching the scenario URL from session storage
    const scenarioUrl = sessionStorage.getItem('scenarioUrl');
    if (scenarioUrl) {
        startGame(scenarioUrl);
    } else {
        alert('No scenario selected!');
        window.location.href = '/interpersonal/select-scenario';
    }
});
