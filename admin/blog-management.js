document.addEventListener('DOMContentLoaded', () => {
    fetchBlogs();
    
    // Add Event Listener for 'Add New Post' button
    const addPostBtn = document.querySelector('.add-post-btn');
    addPostBtn.addEventListener('click', () => {
        openModal(); // This will open the modal for creating a new blog post
    });
});
async function fetchBlogs() {
    try {
        const response = await fetch('/admin/blogs');
        const blogs = await response.json();
        displayBlogs(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
    }
}

function displayBlogs(blogs) {
    const tbody = document.querySelector('.posts-table tbody');
    tbody.innerHTML = '';

    blogs.forEach(blog => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label>
            <img src="${blog.thumbnail || '/uploads/default-thumbnail.jpg'}" 
                    alt="${blog.title}" 
                     class="thumbnail">
            </td>
            <td>${blog.title}</td>
            <td>${blog.author}</td>
            <td>${new Date(blog.date).toLocaleDateString()}</td>
            <td>${blog.status}</td>
            <td>
                <button class="edit-btn" onclick="editBlog('${blog._id}')">Edit</button>
                <button class="delete-btn" onclick="deleteBlog('${blog._id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}
// Handle blog creation and updates
document.querySelector('.post-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = document.querySelector('.post-form');
    const formData = new FormData(form); // Use FormData to handle both text and file data
    const id = document.querySelector('.post-form').dataset.id;

    try {
        const url = id ? `/admin/blogs/${id}` : '/admin/blogs';
        const method = id ? 'PUT' : 'POST';

        // Send the formData directly without defining blogData
        const response = await fetch(url, {
            method,
            body: formData,
        });

        if (response.ok) {
            closeModal();
            fetchBlogs(); // Refresh the blog list after success
        } else {
            console.error('Error saving blog post:', await response.text());
        }
    } catch (error) {
        console.error('Error saving blog post:', error);
    }
});


async function deleteBlog(id) {
    if (confirm('Are you sure you want to delete this post?')) {
        try {
            await fetch(`/admin/blogs/${id}`, { method: 'DELETE' });
            fetchBlogs();
        } catch (error) {
            console.error('Error deleting blog post:', error);
        }
    }
}

function editBlog(id) {
    const blog = blogs.find(b => b._id === id);
    openModal(blog);
}

function openModal(blog = {}) {
    document.querySelector('.post-form').dataset.id = blog._id || '';
    document.getElementById('postTitle').value = blog.title || '';
    document.getElementById('postContent').value = blog.content || '';
    document.getElementById('postStatus').value = blog.status || 'Draft';
    document.getElementById('post-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('post-modal').style.display = 'none';
}

document.querySelector('.close-modal').onclick = closeModal;

