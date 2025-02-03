document.addEventListener("DOMContentLoaded", function () {
    const sseUrl = '/public/cars/stream';  // Real-time updates for cars on index.html and dingaworld-stock.html
    const importSseUrl = '/public/cars/import-cars/stream';  // Real-time updates for imported cars (import.html)
    const fetchUrl = '/public/cars';
    const fetchImportUrl = '/public/cars/imported';
    const carListContainers = [
        document.getElementById('car-list'), // index.html 
        document.getElementById('car-list-stock'), //dingaworld-stock.html
        document.getElementById('import-car-list'),
    ];

    const importCarList = document.getElementById('import-car-list');  // import.html

    // Set the base URL depending on the environment
        const BASE_URL = window.location.hostname === 'localhost'
        ? 'http://localhost:3000' // Local URL
        : 'https://dinga-world-v2-production.up.railway.app'; // Production URL (Railway)




    document.getElementById('menu-toggle').addEventListener('click', () => {
        const navLinks = document.getElementById('nav-links');
        navLinks.classList.toggle('active'); // Toggle active class to show/hide links
        console.log('Menu toggle clicked'); // Debugging line
    });

    document.getElementById('close-menu').addEventListener('click', () => {
        const navLinks = document.getElementById('nav-links');
        navLinks.classList.remove('active'); // Hide the menu when close button is clicked
        console.log('Close menu clicked'); // Debugging line
    });

    // Car Display and Fetch Logic
    if (importCarList) {
        fetchImportedCars();  // Fetch and display imported cars only for import.html
    } else {
        fetchInitialCars();  // Fetch and display normal cars for index.html and dingaworld-stock.html
    }

    setupRealTimeUpdates();
    setupImportRealTimeUpdates();

    // Fetch and display normal cars
    function fetchInitialCars() {
        fetch(fetchUrl)
            .then(response => response.json())
            .then(cars => renderCarsToAllContainers(cars))
            .catch(error => console.error('Error fetching car list:', error));
    }


    // Fetch and display imported cars
    async function fetchImportedCars() {
        try {
            const response = await fetch(fetchImportUrl);
            if (!response.ok) throw new Error("Failed to load imported cars");

            const cars = await response.json();
            renderImportCars(cars); // Call function to render imported cars on import.html
        } catch (error) {
            console.error(error.message);
        }
    }

    // Real-time updates for normal cars
    function setupRealTimeUpdates() {
        const sse = new EventSource(sseUrl);
        sse.onmessage = function (event) {
            const updatedCars = JSON.parse(event.data);
            renderCarsToAllContainers(updatedCars);
        };
    }

    // Real-time updates for imported cars
    function setupImportRealTimeUpdates() {
        const sse = new EventSource(importSseUrl);
        sse.onmessage = function (event) {
            const updatedCars = JSON.parse(event.data);
            renderImportCars(updatedCars);
        };
    }

    // Render normal cars in the car list containers
    function renderCarsToAllContainers(cars) {
        carListContainers.forEach(container => {
            if (container) renderCars(container, cars);
        });
    }

    // Render imported cars only on import.html
    function renderImportCars(cars) {
        importCarList.innerHTML = ''; // Clear the import car list
        cars.forEach(car => importCarList.appendChild(createCarItem(car)));
    }

    // Render car items for a given container
    function renderCars(container, cars) {
        container.innerHTML = '';  // Clear the container before adding new cars
        cars.forEach(car => container.appendChild(createCarItem(car)));
    }


// Car sale form toggle function
document.getElementById('toggle-form-btn').addEventListener('click', function () {
    const formSection = document.querySelector('.form-section');
    // Toggle the display property of the form section
    if (formSection.style.display === 'none' || formSection.style.display === '') {
        formSection.style.display = 'block'; // Show the form
    } else {
        formSection.style.display = 'none'; // Hide the form
    }
    // Scroll to form
    formSection.scrollIntoView({ behavior: "smooth" });
});

// Get references to the form and close button
const carForm = document.getElementById('car-form');  // Ensure the form has id="car-form"
const closeButton = document.getElementById('close-form-btn');  // Ensure the button has id="close-form-btn"

// Function to close the form when the Close button is clicked
closeButton.addEventListener('click', function() {
    carForm.style.display = 'none';  // Hide the form
});

   

    
    // Create car item HTML
    function createCarItem(car) {
        const carItem = document.createElement('div');
        carItem.className = 'car-item';
        carItem.dataset.id = car._id;

        // Create a tag for imported cars
    const importTag = car.isInTransit
    ? '<span class="import-tag">Import</span>'
    : '';

        const imagesHtml = car.images?.length ? car.images.map((image, index) => `
            <img src="${image}" alt="${car.brand} ${car.model}" width="150" class="car-image" 
                 data-images='${JSON.stringify(car.images)}' data-index="${index}">
        `).join('') : '';

        carItem.innerHTML = `
            <div class="car-images">${imagesHtml}
             ${importTag} <!-- Add the Import tag here --></div>
            <div class="car-summary">
                <h3>${car.brand} ${car.model}</h3>
                <p><i class="fa-regular fa-calendar-days"></i>: ${car.year}</p>
                <p><i class="fa-solid fa-money-check-dollar"></i>: Kshs ${car.price.toLocaleString() || "N/A"}</p>
                <p><i class="fa-solid fa-hashtag"></i>: ${car.registration}</p>
                <p><i class="fa-solid fa-gas-pump"></i>: ${car.fuelType || 'N/A'}</p>
                <p><i class="fa-solid fa-gears"></i>: ${car.transmission || 'N/A'}</p>
                <p><i class="fa-solid fa-car-side"></i>: ${car.drivetrain || 'N/A'}</p>
                <p><i class="fa-solid fa-gauge"></i>: ${car.mileage.toLocaleString() || 'N/A'} Kms</p>
                <button class="load-more-btn">Load More</button>
                <div class="more-info" style="display: none;">
                    <p><i class="fa-solid fa-circle-info"></i>: ${car.description || 'No description available'}</p>
                </div>
            </div>
        `;

        attachLoadMoreFunctionality(carItem);
        attachImageModalEvents(carItem);

        return carItem;
    }

    // Add load more functionality
    function attachLoadMoreFunctionality(carItem) {
        const loadMoreBtn = carItem.querySelector('.load-more-btn');
        const moreInfoDiv = carItem.querySelector('.more-info');

        loadMoreBtn.addEventListener('click', () => {
            const isHidden = moreInfoDiv.style.display === 'none';
            moreInfoDiv.style.display = isHidden ? 'block' : 'none';
            loadMoreBtn.textContent = isHidden ? 'Show Less' : 'Load More';
        });
    }

    // Attach event listeners for car images
    function attachImageModalEvents(carItem) {
        const carImages = carItem.querySelectorAll('.car-image');
        carImages.forEach(image => {
            image.addEventListener('click', function () {
                openImageModal(JSON.parse(this.dataset.images), parseInt(this.dataset.index));
            });
        });
    }

    // Open image modal functionality
    function openImageModal(imagesArray, index) {
        const modal = document.getElementById('car-modal');
        const modalImage = modal.querySelector('#modal-image');
        const prevArrow = modal.querySelector('#prev-arrow');
        const nextArrow = modal.querySelector('#next-arrow');
        const closeBtn = modal.querySelector('.close');

        let currentImages = imagesArray;
        let currentImageIndex = index;

        modalImage.src = currentImages[currentImageIndex];
        modal.style.display = 'block';

        prevArrow.style.display = currentImages.length > 1 ? 'inline' : 'none';
        nextArrow.style.display = currentImages.length > 1 ? 'inline' : 'none';

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        prevArrow.onclick = () => {
            currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : currentImages.length - 1;
            modalImage.src = currentImages[currentImageIndex];
        };

        nextArrow.onclick = () => {
            currentImageIndex = (currentImageIndex < currentImages.length - 1) ? currentImageIndex + 1 : 0;
            modalImage.src = currentImages[currentImageIndex];
        };
    }

});

// car sale section

document.getElementById('car-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const formSection = document.getElementById('form-section');
    const successMessage = document.getElementById('successMessage');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    // Gather form data
    const formData = new FormData(this);


    // Send form data to the server
    fetch('/public/cars/add', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to submit the form');
        return response.json();
    })
    .then(data => {
        console.log('Form submitted successfully:', data);
        // Handle success - you might want to redirect or show a success message here

           // Reset the form fields
    document.getElementById('car-form').reset();

         
            // Hide the form and show the success message
            formSection.style.display = 'none';
            successMessage.style.display = 'block';
    })
    .catch(error => {
        console.error('Error submitting form:', error);
        submitBtn.disabled = false; // Re-enable the button
        submitBtn.textContent = 'Submit'; // Reset the button text
    });
});

// form view pic and delete

document.getElementById('images').addEventListener('change', function(event) {
    const imagePreviewContainer = document.getElementById('image-preview');
    imagePreviewContainer.innerHTML = ''; // Clear previous previews

    const files = Array.from(event.target.files);

    files.forEach((file, index) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = function(e) {
                // Create image preview element
                const previewDiv = document.createElement('div');
                previewDiv.classList.add('image-preview');

                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = 'Car Image Preview';
                img.classList.add('preview-image');

                // Create delete icon
                const deleteIcon = document.createElement('i');
                deleteIcon.classList.add('fas', 'fa-xmark', 'delete-icon'); // FontAwesome trash icon

                // Remove image from the preview and the file input
                deleteIcon.addEventListener('click', () => {
                    files.splice(index, 1); // Remove the file from the list
                    previewDiv.remove(); // Remove the preview
                    updateFileInput(files); // Update the file input with the new file list
                });

                // Append image and delete icon to the preview div
                previewDiv.appendChild(img);
                previewDiv.appendChild(deleteIcon);

                // Append the preview div to the container
                imagePreviewContainer.appendChild(previewDiv);
            };

            reader.readAsDataURL(file); // Read the image file
        }
    });

    // Update the file input element to reflect the files list
    function updateFileInput(updatedFiles) {
        const dataTransfer = new DataTransfer();
        updatedFiles.forEach(file => dataTransfer.items.add(file));
        document.getElementById('images').files = dataTransfer.files; // Update the input element
    }
});

// Initialize the SSE connection
const eventSource = new EventSource('/events');

// Listen for carAdded events
eventSource.addEventListener('carAdded', (event) => {
    const car = JSON.parse(event.data);
    addCarToDOM(car); // Function to add the car to the DOM
});

// Listen for carUpdated events
eventSource.addEventListener('carUpdated', (event) => {
    const car = JSON.parse(event.data);
    updateCarInDOM(car); // Function to update the car in the DOM
});

// Listen for carDeleted events
eventSource.addEventListener('carDeleted', (event) => {
    const { _id } = JSON.parse(event.data);
    removeCarFromDOM(_id); // Function to remove the car from the DOM
});

const sse = new EventSource('${BASE_URL}/admin/cars/stream');  // or for the public side
sse.onmessage = function(event) {
    const updatedCars = JSON.parse(event.data);
    fetchAndDisplayCars(updatedCars);  // Function to update the car list dynamically
};

// Create car item HTML
function createCarItem(car) {
    const carItem = document.createElement('div');
    carItem.className = 'car-item';
    carItem.dataset.id = car._id;

    // Create a tag for imported cars
    const importTag = car.isInTransit
        ? '<span class="import-tag">Import</span>'
        : '';

    const imagesHtml = car.images?.length
        ? car.images.map((image, index) => `
            <img src="${image}" alt="${car.brand} ${car.model}" width="150" class="car-image" 
                 data-images='${JSON.stringify(car.images)}' data-index="${index}">
        `).join('')
        : '';

    carItem.innerHTML = `
        <div class="car-images">${imagesHtml}
         ${importTag} <!-- Add the Import tag here --></div>
        <div class="car-summary">
            <h3>${car.brand} ${car.model}</h3>
            <p><i class="fa-regular fa-calendar-days"></i>: ${car.year}</p>
            <p><i class="fa-solid fa-money-check-dollar"></i>: Kshs ${car.price.toLocaleString() || "N/A"}</p>
            <p><i class="fa-solid fa-hashtag"></i>: ${car.registration}</p>
            <p><i class="fa-solid fa-gas-pump"></i>: ${car.fuelType || 'N/A'}</p>
            <p><i class="fa-solid fa-gears"></i>: ${car.transmission || 'N/A'}</p>
            <p><i class="fa-solid fa-car-side"></i>: ${car.drivetrain || 'N/A'}</p>
            <p><i class="fa-solid fa-gauge"></i>: ${car.mileage.toLocaleString() || 'N/A'} Kms</p>
            <button class="load-more-btn">Load More</button>
            <div class="more-info" style="display: none;">
                <p><i class="fa-solid fa-circle-info"></i>: ${car.description || 'No description available'}</p>
            </div>
        </div>
    `;

    attachLoadMoreFunctionality(carItem);
    attachImageModalEvents(carItem);

    return carItem;
}

// Attach "Load More" functionality
function attachLoadMoreFunctionality(carItem) {
    const loadMoreBtn = carItem.querySelector('.load-more-btn');
    const moreInfoDiv = carItem.querySelector('.more-info');

    loadMoreBtn.addEventListener('click', () => {
        const isHidden = moreInfoDiv.style.display === 'none';
        moreInfoDiv.style.display = isHidden ? 'block' : 'none';
        loadMoreBtn.textContent = isHidden ? 'Show Less' : 'Load More';
    });
}

// Attach image modal events
function attachImageModalEvents(carItem) {
    const images = carItem.querySelectorAll('.car-image');
    images.forEach(image => {
        image.addEventListener('click', () => {
            // Add your modal display logic here
        });
    });
}

// Search filter
document.getElementById('search-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Get search form values
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model').value;
    const year = document.getElementById('year').value;
    const priceRange = document.getElementById('priceRange').value;
    const isInTransit = document.getElementById('isInTransit').checked;

    // Build query string
    const queryString = new URLSearchParams({
        brand,
        model,
        year,
        priceRange,
        isInTransit: isInTransit ? 'true' : 'false',
    }).toString();

    try {
        // Fetch search results
        const response = await fetch(`${BASE_URL}/search?${queryString}`);
        if (!response.ok) {
            throw new Error('Failed to fetch search results.');
        }

        const cars = await response.json();

        // Update the car list dynamically
        const carListContainers = [
            document.getElementById('car-list'),
        ];

        // Clear current listings for all containers
        carListContainers.forEach((container) => {
            if (container) container.innerHTML = ''; // Check if the container exists
        });

        if (cars.length === 0) {
            carListContainers.forEach((container) => {
                if (container) {
                    container.innerHTML = '<p>No cars found for the given search criteria.</p>';
                }
            });
        } else {
            cars.forEach((car) => {
                const carItem = createCarItem(car); // Use your existing function
                carListContainers.forEach((container) => {
                    if (container) container.appendChild(carItem.cloneNode(true)); // Append a clone for multiple containers
                });
            });
        }

        // Scroll to the first available search results container
        const firstContainer = carListContainers.find((container) => container !== null);
        if (firstContainer) {
            firstContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (error) {
        console.error('Error fetching search results:', error);
        alert('An error occurred while fetching search results. Please try again.');
    }
});


// clear search results
document.getElementById('clear-filter').addEventListener('click', async function () {
    // Reset form fields
    document.getElementById('search-form').reset();

    try {
        // Fetch default car listings (all cars without filters)
        const response = await fetch('/search');
        if (!response.ok) {
            throw new Error('Failed to fetch default car listings.');
        }

        const cars = await response.json();

        // Update the car list dynamically
        const carListContainer = document.getElementById('car-list');
        carListContainer.innerHTML = ''; // Clear current listings

        if (cars.length === 0) {
            carListContainer.innerHTML = '<p>No cars available.</p>';
            return;
        }

        // Render each car using the consistent createCarItem function
        cars.forEach(car => {
            const carItem = createCarItem(car); // Use your existing function
            carListContainer.appendChild(carItem);
            attachImageModalEvents(carItem); // Add image modal functionality
        });


        // Scroll to the search results container
        carListContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Error fetching default car listings:', error);
        alert('An error occurred while fetching default car listings. Please try again.');
    }
});




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

// JavaScript to handle form submissions and switching between forms
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    alert(data.message || data.error);
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();
    alert(data.message || data.error);
});

// Switch to Signup Form
document.getElementById('switch-to-signup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('signup-form-container').style.display = 'block';
});

// Switch to Login Form
document.getElementById('switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-form-container').style.display = 'none';
    document.getElementById('login-form-container').style.display = 'block';
});

// Close Modal (optional)
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('login-signup-modal').style.display = 'none';
});

// JavaScript to handle modal display
document.getElementById('open-modal').addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the default anchor behavior
    document.getElementById('login-signup-modal').style.display = 'block'; // Show the modal
});

// Close modal when the close button is clicked
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('login-signup-modal').style.display = 'none'; // Hide the modal
});

// Close modal when clicking outside of the modal content
window.addEventListener('click', (event) => {
    const modal = document.getElementById('login-signup-modal');
    if (event.target === modal) {
        modal.style.display = 'none'; // Hide the modal
    }
});

// Check login status on page load
window.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/api/check-login');
    const data = await response.json();

    if (data.loggedIn) {
        // User is logged in
        document.querySelector('.login-text').innerText = 'Logout'; // Change text to Logout
        document.getElementById('welcome-message').style.display = 'block'; // Show welcome message
        document.querySelector('.login-text').addEventListener('click', async (e) => {
            e.preventDefault();
            const logoutResponse = await fetch('/logout', {
                method: 'POST',
            });
            const logoutData = await logoutResponse.json();
            alert(logoutData.message);
            location.reload(); // Reload the page to update the UI
        });
    } else {
        // User is not logged in
        document.querySelector('.login-text').innerText = 'Login'; // Ensure it shows Login
    }
});

// Close the menu when a link is clicked
const navItems = document.querySelectorAll('.nav-links li a');
navItems.forEach(item => {
    item.addEventListener('click', () => {
        const navLinks = document.getElementById('nav-links');
        navLinks.classList.remove('active'); // Hide the menu after clicking a link
        console.log('Menu item clicked'); // Debugging line
    });
});

// Ensure nav links are hidden on page load
window.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.remove('active'); // Ensure the menu is hidden on load
});


document.getElementById('menu-toggle').addEventListener('click', function() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('show'); // Toggle the 'show' class
});

document.getElementById('close-menu').addEventListener('click', function() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.remove('show'); // Hide the menu when close icon is clicked
});
