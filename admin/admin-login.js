// login.js
document.getElementById('admin-login-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  
  const password = document.getElementById('password').value;
  
  try {
      const response = await fetch('/admin/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
      });

      if (response.ok) {
          // If the login is successful, redirect to the dashboard
          window.location.href = '/admin/dashboard';
      } else {
          alert('Incorrect password. Please try again.');
      }
  } catch (error) {
      console.error('Error logging in:', error);
      alert('An error occurred while logging in. Please try again.');
  }
});
