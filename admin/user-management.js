document.addEventListener("DOMContentLoaded", () => {
  fetch("/admin/users")
    .then((res) => res.json())
    .then((users) => {
      const tableBody = document.getElementById("user-table").querySelector("tbody");
      tableBody.innerHTML = ""; // Clear table body

      users.forEach((user) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.username}</td>
          <td>${user.email}</td>
          <td>${user.roles.join(", ")}</td>
          <td>
            <button onclick="updateRoles('${user._id}')">Update Roles</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch((err) => console.error("Error fetching users:", err));
});

function updateRoles(userId) {
  const newRoles = prompt("Enter new roles (comma-separated):");
  if (!newRoles) return;

  fetch("/admin/update-roles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, roles: newRoles.split(",") }),
  })
    .then((res) => {
      if (res.ok) {
        alert("Roles updated successfully");
        location.reload(); // Reload to reflect changes
      } else {
        alert("Failed to update roles");
      }
    })
    .catch((err) => console.error("Error updating roles:", err));
}
document.getElementById("add-user-form").addEventListener("submit", (e) => {
  e.preventDefault();
  
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const permissions = Array.from(
    document.querySelectorAll('input[name="permissions"]:checked')
  ).map((el) => el.value); // Collect selected permissions

  fetch("/admin/add-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password, permissions }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("User added successfully!");
      } else {
        alert("Failed to add user: " + data.message);
      }
    })
    .catch((err) => console.error(err));
});
document.addEventListener("DOMContentLoaded", () => {
  const token = document.cookie.split(";").find((cookie) => cookie.trim().startsWith("admin-token="));

  if (!token) {
    window.location.href = "/admin-login.html";
    return;
  }

  const permissions = JSON.parse(atob(token.split(".")[1])).permissions; // Decode token to get permissions

  // Hide or disable sections
  if (!permissions.includes("manage-cars")) {
    document.getElementById("manage-cars-section").style.display = "none";
  }

  if (!permissions.includes("blog-management")) {
    document.getElementById("blog-management-section").style.display = "none";
  }
});
