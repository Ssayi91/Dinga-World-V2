document.addEventListener('DOMContentLoaded', () => {
  const userTableBody = document.querySelector('#user-table tbody');
  const addUserForm = document.getElementById('add-user-form');

  // Fetch and display all users
  function fetchUsers() {
      fetch('/api/users')
          .then(response => response.json())
          .then(users => {
              userTableBody.innerHTML = users.map(user => `
                  <tr>
                      <td>${user.username}</td>
                      <td>${user.email}</td>
                      <td>${user.roles.join(', ')}</td>
                      <td>
                          <button onclick="deleteUser(${user.id})">Delete</button>
                      </td>
                  </tr>
              `).join('');
          })
          .catch(err => console.error('Error fetching users:', err));
  }

  // Add a new user
  addUserForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(addUserForm);
      const username = formData.get('username');
      const email = formData.get('email');
      const password = formData.get('password');
      const permissions = Array.from(
          document.querySelectorAll('input[name="permissions"]:checked')
      ).map(checkbox => checkbox.value);

      fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password, permissions })
      })
          .then(response => {
              if (response.ok) {
                  fetchUsers(); // Refresh the user list
                  addUserForm.reset();
              } else {
                  response.text().then(alert);
              }
          })
          .catch(err => console.error('Error adding user:', err));
  });

  // Delete a user
  window.deleteUser = function (id) {
      fetch(`/api/users/${id}`, { method: 'DELETE' })
          .then(response => {
              if (response.ok) {
                  fetchUsers(); // Refresh the user list
              } else {
                  alert('Error deleting user.');
              }
          })
          .catch(err => console.error('Error deleting user:', err));
  };

  // Initial fetch of users
  fetchUsers();
});
