document.addEventListener('DOMContentLoaded', async () => {
    try {
      const response = await fetch(`/profile/profileElements`, {method:"POST"});
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const userData = await response.json();
      document.querySelector('.username').textContent = userData.username;
      document.querySelector('.name').textContent = userData.name;
      document.querySelector('.email').textContent = userData.email;
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
    }
  });