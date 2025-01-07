document.addEventListener('DOMContentLoaded', function() {
    const isAdminLoggedIn = sessionStorage.getItem('isAdminLoggedIn');
    if (!isAdminLoggedIn) {
        window.location.href = 'admin-login.html'; // Redirect to login if not authenticated
    }
});
