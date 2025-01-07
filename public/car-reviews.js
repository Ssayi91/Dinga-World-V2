// blog
document.addEventListener('DOMContentLoaded', () => {
    fetchBlogs();
});

async function fetchBlogs() {
    try {
        const response = await fetch('/blogs');
        const blogs = await response.json();
        displayBlogs(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
    }
}

function displayBlogs(blogs) {
    const blogList = document.getElementById('public-blog-list');
    blogList.innerHTML = '';

    blogs.forEach((blog) => {
        const blogItem = document.createElement('div');
        
        // Truncate the content and create the Read More button dynamically
        const truncatedContent = blog.content.slice(0, 150) + '...';
        const fullContent = blog.content;

        // Determine the image source or fallback to a default image
        const thumbnailSrc = blog.thumbnail || '/uploads/default-thumbnail.jpg';

        // Create the HTML for each blog post
        blogItem.innerHTML = `
            <h2>${blog.title}</h2>
            <p>By ${blog.author} on ${new Date(blog.date).toLocaleDateString()}</p>
            <img src="${thumbnailSrc}" alt="${blog.title}" class="thumbnail" />
            <p class="truncated-content">${truncatedContent}</p>
            <p class="full-content" style="display:none;">${fullContent}</p>
            <button class="read-more-btn">Read More</button>
        `;

        // Get the Read More button and add the toggle functionality
        const readMoreButton = blogItem.querySelector('.read-more-btn');
        const truncatedParagraph = blogItem.querySelector('.truncated-content');
        const fullParagraph = blogItem.querySelector('.full-content');

        readMoreButton.addEventListener('click', function() {
            if (fullParagraph.style.display === 'none') {
                fullParagraph.style.display = 'block'; // Show the full content
                truncatedParagraph.style.display = 'none'; // Hide the truncated content
                readMoreButton.textContent = 'Read Less'; // Change button text to "Read Less"
            } else {
                fullParagraph.style.display = 'none'; // Hide the full content
                truncatedParagraph.style.display = 'block'; // Show the truncated content
                readMoreButton.textContent = 'Read More'; // Change button text back to "Read More"
            }
        });

        blogList.appendChild(blogItem);
    });
}
