document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('admin-login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;

            // Basic username/password check for demo purposes
            if (username === 'admin' && password === 'password') {
                sessionStorage.setItem('isAdminLoggedIn', true); // Store login status in session storage
                window.location.href = 'admin.html'; // Redirect to dashboard upon successful login
            } else {
                alert('Invalid credentials. Please try again.');
            }
        });
    }
});
