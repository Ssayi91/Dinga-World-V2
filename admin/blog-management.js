document.addEventListener('DOMContentLoaded', function () {
    const addPostBtn = document.querySelector('.add-post-btn');
    const postModal = document.getElementById('post-modal');
    const closeModal = document.querySelector('.close-modal');
    const postForm = document.querySelector('.post-form');
    const postsTable = document.querySelector('.posts-table tbody');
    let editingPost = null;

    // Function to open the modal
    function openModal() {
        postModal.style.display = 'block';
    }

    // Function to close the modal
    function closeModalFunc() {
        postModal.style.display = 'none';
        postForm.reset();
        editingPost = null; // Reset editing state
    }

    // Event listener to open the modal when clicking the "Add New Post" button
    addPostBtn.addEventListener('click', openModal);

    // Event listener to close the modal when clicking the close button
    closeModal.addEventListener('click', closeModalFunc);

    // Event listener to close the modal when clicking outside of it
    window.addEventListener('click', function (event) {
        if (event.target === postModal) {
            closeModalFunc();
        }
    });

    // Function to add a new post to the table
    function addPostToTable(post) {
        const newRow = document.createElement('tr');

        newRow.innerHTML = `
            <td>${post.title}</td>
            <td>${post.author}</td>
            <td>${post.date}</td>
            <td>${post.status}</td>
            <td>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </td>
        `;

        postsTable.appendChild(newRow);

        // Attach event listeners to new Edit and Delete buttons
        newRow.querySelector('.edit-btn').addEventListener('click', function () {
            editPost(newRow, post);
        });
        newRow.querySelector('.delete-btn').addEventListener('click', function () {
            deletePost(newRow);
        });
    }

    // Function to handle form submission
    postForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const postTitle = document.getElementById('postTitle').value;
        const postContent = document.getElementById('postContent').value;
        const postStatus = document.getElementById('postStatus').value;

        const post = {
            title: postTitle,
            author: 'Admin', // Assuming the logged-in user is the author
            date: new Date().toLocaleDateString(),
            status: postStatus,
            content: postContent
        };

        if (editingPost) {
            updatePostInTable(editingPost, post);
        } else {
            addPostToTable(post);
        }

        closeModalFunc();
    });

    // Function to edit an existing post
    function editPost(row, post) {
        editingPost = row;
        openModal();

        // Populate form with post details
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postContent').value = post.content;
        document.getElementById('postStatus').value = post.status;
    }

    // Function to update the post in the table
    function updatePostInTable(row, updatedPost) {
        row.cells[0].innerText = updatedPost.title;
        row.cells[1].innerText = updatedPost.author;
        row.cells[2].innerText = updatedPost.date;
        row.cells[3].innerText = updatedPost.status;
    }

    // Function to delete a post from the table
    function deletePost(row) {
        postsTable.removeChild(row);
    }

    // Example of pre-existing posts (for mockup purposes)
    const examplePosts = [
        {
            title: 'How to Maintain Your Car',
            author: 'John Doe',
            date: 'August 15, 2024',
            status: 'Published',
            content: 'This is an example blog post about car maintenance.'
        },
        {
            title: 'Top 10 Car Models of 2024',
            author: 'Jane Smith',
            date: 'August 20, 2024',
            status: 'Draft',
            content: 'This post lists the top 10 car models of 2024.'
        }
    ];

    // Load example posts into the table
    examplePosts.forEach(post => addPostToTable(post));
});
