let currentQuestionIndex = -1;
let scenario = null;

document.addEventListener('DOMContentLoaded', () => {
  const narratorDiv = document.getElementById('narrator');
  const questionDiv = document.getElementById('question');
  const optionsDiv = document.getElementById('options');
  const feedbackDiv = document.getElementById('feedback');
  const continueButton = document.getElementById('continue-button');

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
      feedbackDiv.classList.add('hidden');
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

      question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.classList.add('option-button');
        button.addEventListener('click', () => handleAnswer(option, button));
        optionsDiv.appendChild(button);
      });

      questionDiv.classList.remove('hidden');
      optionsDiv.classList.remove('hidden');
      continueButton.classList.add('hidden');
      feedbackDiv.classList.add('hidden');
    } else {
      alert('Game completed!');
    }
  }

  function handleAnswer(option, button) {
    if (option.correct) {
      button.classList.add('correct');
      setTimeout(nextQuestion, 1000);
    } else {
      button.classList.add('incorrect');
      feedbackDiv.textContent = option.feedback;
      feedbackDiv.classList.remove('hidden');
      continueButton.classList.remove('hidden');
      continueButton.onclick = showQuestion;
    }
  }

  function nextQuestion() {
    currentQuestionIndex++;
    showQuestion();
  }

  const scenarioUrl = sessionStorage.getItem('scenarioUrl');
  if (scenarioUrl) {
    startGame(scenarioUrl);
  } else {
    alert('No scenario selected!');
    window.location.href = '/interpersonal/select-scenario';
  }
});
