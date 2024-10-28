document.addEventListener("DOMContentLoaded", function () {
    // Navigation Menu Toggle
    document.getElementById('menu-toggle').addEventListener('click', function () {
        var navLinks = document.getElementById('nav-links');
        navLinks.classList.toggle('show');
    });

    document.getElementById('close-menu').addEventListener('click', function () {
        var navLinks = document.getElementById('nav-links');
        navLinks.classList.remove('show');
    });

    // Login/Signup Modal Handling
    const loginLink = document.querySelector(".login-text");
    const loginSignupModal = document.getElementById("login-signup-modal");
    const closeModal = document.querySelector(".close-modal");
    const loginFormContainer = document.getElementById("login-form-container");
    const signupFormContainer = document.getElementById("signup-form-container");

    const switchToSignup = document.getElementById("switch-to-signup");
    const switchToLogin = document.getElementById("switch-to-login");

    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    let users = []; // Array to store user information

    // Open modal when login link is clicked
    loginLink.addEventListener("click", function (event) {
        event.preventDefault();
        loginSignupModal.style.display = "block";
        loginFormContainer.style.display = "block"; // Show login by default
        signupFormContainer.style.display = "none"; // Hide signup by default
    });

    // Close modal when the close button is clicked
    closeModal.addEventListener("click", function () {
        loginSignupModal.style.display = "none";
    });

    // Close modal when clicking outside of the modal content
    window.addEventListener("click", function (event) {
        if (event.target === loginSignupModal) {
            loginSignupModal.style.display = "none";
        }
    });

    // Switch to Signup form
    switchToSignup.addEventListener("click", function (event) {
        event.preventDefault();
        loginFormContainer.style.display = "none";
        signupFormContainer.style.display = "block";
    });

    // Switch to Login form
    switchToLogin.addEventListener("click", function (event) {
        event.preventDefault();
        signupFormContainer.style.display = "none";
        loginFormContainer.style.display = "block";
    });

    // Handle Login Form Submission
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        if (!username || !password) {
            alert("Please fill in both fields.");
            return;
        }

        const user = users.find(user => user.username === username && user.password === password);

        if (user) {
            alert(`Welcome back, ${username}!`);
            loginSignupModal.style.display = "none"; // Close modal on success
        } else {
            alert("Invalid login credentials.");
        }
    });

    // Handle Signup Form Submission
    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("signup-username").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;

        if (!username || !email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        // Check for existing users
        if (users.find(user => user.username === username)) {
            alert("Username already exists.");
            return;
        }

        // Save the user in the users array (replace this with backend call in production)
        users.push({ username, email, password });
        alert(`Account created successfully for ${username}!`);

        // Notify admin (could be sent to the backend)
        console.log(`New account created:\nUsername: ${username}\nEmail: ${email}`);

        // Clear the form and switch to login
        signupForm.reset();
        loginFormContainer.style.display = "block";
        signupFormContainer.style.display = "none";
    });


    // car sale form function
    document.getElementById('toggle-form-btn').addEventListener('click', function () {
    const formSection = document.querySelector('.form-section');
    // Toggle the display property of the form section
    if (formSection.style.display === 'none' || formSection.style.display === '') {
        formSection.style.display = 'block'; // Show the form
    } else {
        formSection.style.display = 'none'; // Hide the form
    }
});

    // Create car item element
    function createCarItem(car) {
        const carItem = document.createElement('div');
        carItem.className = 'car-item';
        carItem.dataset.id = car._id;

        let imagesHtml = car.images && car.images.length > 0 
            ? car.images.map((image, index) => 
                `<img src="${image}" alt="${car.brand} ${car.model}" width="150" class="car-image" data-images='${JSON.stringify(car.images)}' data-index="${index}">`
            ).join('') 
            : '';

        const formattedPrice = car.price ? car.price.toLocaleString() : "N/A";
        const formattedMileage = car.mileage ? car.mileage.toLocaleString() : "N/A";

        carItem.innerHTML = `
            <div class="car-images">${imagesHtml}</div>
            <div class="car-summary">
                <h3>${car.brand} ${car.model}</h3>
                <p><i class="fa-regular fa-calendar-days"></i>: ${car.year}</p>
                <p><i class="fa-solid fa-money-check-dollar"></i>: Kshs ${formattedPrice}</p>
                <p><i class="fa-solid fa-hashtag"></i>: ${car.registration}</p>
                <p><i class="fa-solid fa-gas-pump"></i>: ${car.fuelType || 'N/A'}</p>
                <p><i class="fa-solid fa-gears"></i>: ${car.transmission || 'N/A'}</p>
                <p><i class="fa-solid fa-car-side"></i>: ${car.drivetrain || 'N/A'}</p>
                <p><i class="fa-solid fa-gauge"></i>: ${formattedMileage} Kms</p>
                <button class="load-more-btn">Load More</button>
                <div class="more-info" style="display: none;">
                    <p><i class="fa-solid fa-circle-info"></i>: ${car.description || 'No description available'}</p>
                </div>
            </div>
        `;

        return carItem;
    }


    // Attach event listeners to "Load More" buttons
function attachLoadMoreButtons() {
    const loadMoreButtons = document.querySelectorAll('.load-more-btn');
    loadMoreButtons.forEach(button => {
        button.addEventListener('click', function () {
            const moreInfoDiv = this.nextElementSibling;
            if (moreInfoDiv.style.display === 'none') {
                moreInfoDiv.style.display = 'block';
                this.textContent = 'Show Less';
            } else {
                moreInfoDiv.style.display = 'none';
                this.textContent = 'Load More';
            }
        });
    });
}

    
    // Fetch and display cars
    function fetchAndDisplayCars(cars) {
        const carListContainer = document.getElementById('car-list');
        carListContainer.innerHTML = '';  // Clear the list to avoid duplicates

        cars.forEach(car => {
            const carItem = createCarItem(car);
            carListContainer.appendChild(carItem);
        });

        // Re-attach event listeners after re-rendering cars
        attachEventListenersToImages();
        attachLoadMoreButtons(); // Attach the "Load More" functionality
    }

    // Attach event listeners to car images for modal
    function attachEventListenersToImages() {
        const carImages = document.querySelectorAll('.car-image');
        carImages.forEach(image => {
            image.addEventListener('click', function() {
                const imagesArray = JSON.parse(this.dataset.images);
                const clickedIndex = parseInt(this.dataset.index);
                openImageModal(imagesArray, clickedIndex);
            });
        });
    }

    // Open image modal function
    function openImageModal(imagesArray, index) {
        const modal = document.getElementById('car-modal');
        const modalImage = modal.querySelector('#modal-image');
        const prevArrow = modal.querySelector('#prev-arrow');
        const nextArrow = modal.querySelector('#next-arrow');
        const closeBtn = modal.querySelector('.close');

        currentImages = imagesArray;
        currentImageIndex = index;

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

    // Server-Sent Events for real-time updates
    const sse = new EventSource('https://dinga-world.onrender.com/public/cars/stream');

    sse.onmessage = function (event) {
        const updatedCars = JSON.parse(event.data);
        fetchAndDisplayCars(updatedCars);
    };

    // Initial fetch of cars
    fetch('/public/cars')
        .then(response => response.json())
        .then(cars => {
            fetchAndDisplayCars(cars);
        })
        .catch(error => console.error('Error fetching car list:', error));
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


const sse = new EventSource('https://dinga-world.onrender.com/admin/cars/stream');  // or for the public side
sse.onmessage = function(event) {
    const updatedCars = JSON.parse(event.data);
    fetchAndDisplayCars(updatedCars);  // Function to update the car list dynamically
};


