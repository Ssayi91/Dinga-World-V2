document.getElementById("admin-login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    })
    .then((res) => {
      console.log("Response status:", res.status);  // Check the response status
      if (res.redirected) {
        console.log("Redirecting to:", res.url);  // Log the redirect URL
        window.location.href = res.url; // Redirect to admin.html
      } else {
        alert("Login failed");
      }
    })
    .catch((err) => console.error(err));
});

  
document.addEventListener("DOMContentLoaded", () => {
    const token = document.cookie.split(";").find(cookie => cookie.trim().startsWith("admin-token="));
  
    if (!token) {
      const currentPage = window.location.pathname; // Get the current page path
      if (currentPage !== "/admin-login.html") {
        // Redirect only if not already on the login page
        window.location.href = "/admin-login.html";
      }
    } else {
      console.log("User is authenticated");
    }
  });
  
  