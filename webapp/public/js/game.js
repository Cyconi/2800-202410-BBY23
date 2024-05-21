let currentQuestionIndex = -1;
let scenario = null;

document.addEventListener('DOMContentLoaded', () => {
  const narratorDiv = document.getElementById('narrator');
  const questionDiv = document.getElementById('question');
  const optionsDiv = document.getElementById('options');
  const continueButton = document.getElementById('continue-button');
  const feedbackModal = new bootstrap.Modal(document.getElementById('feedbackModal'));
  const modalFeedbackText = document.getElementById('modalFeedbackText');
  const modalFeedbackGif = document.getElementById('modalFeedbackImage');
  const gameContainer = document.getElementById('game-container');

  function startGame(scenarioUrl) {
    fetch(scenarioUrl)
      .then(response => response.json())
      .then(data => {
        scenario = data.scenarios[0];
        showIntroduction();
      })
      .catch(error => console.error('Error fetching scenario:', error));
  }

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
    } else {
      showCompletionButtons();
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
      setTimeout(nextQuestion, 1000);
    } else {
      button.classList.add('incorrect');
      showFeedbackInModal(option.feedback);
      continueButton.classList.remove('hidden');
      continueButton.onclick = nextQuestion;
    }
  }

  function nextQuestion() {
    currentQuestionIndex++;
    showQuestion();
  }

  function showCompletionButtons() {
    questionDiv.classList.add('hidden');
    optionsDiv.classList.add('hidden');
    narratorDiv.classList.add('hidden');
    continueButton.classList.add('hidden');

    const completionDiv = document.createElement('div');
    completionDiv.classList.add('completion-buttons');

    const profileButton = document.createElement('button');
    profileButton.textContent = 'Go to Profile';
    profileButton.classList.add('btn', 'btn-primary', 'm-2');
    profileButton.onclick = () => window.location.href = '/home1';

    const selectScenarioButton = document.createElement('button');
    selectScenarioButton.textContent = 'Select Another Scenario';
    selectScenarioButton.classList.add('btn', 'btn-secondary', 'm-2');
    selectScenarioButton.onclick = () => window.location.href = '/interpersonal/select-scenario';

    completionDiv.appendChild(profileButton);
    completionDiv.appendChild(selectScenarioButton);

    gameContainer.appendChild(completionDiv);
  }

  const scenarioUrl = sessionStorage.getItem('scenarioUrl');
  if (scenarioUrl) {
    startGame(scenarioUrl);
  } else {
    alert('No scenario selected!');
    window.location.href = '/interpersonal/select-scenario';
  }
});
