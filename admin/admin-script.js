document.addEventListener('DOMContentLoaded', () => {
    const formSection = document.querySelector('.form-section');
    const toggleFormBtn = document.getElementById('toggle-form-btn');
    const carForm = document.getElementById('car-form');
    const imagePreview = document.getElementById('image-preview');
    const carContainer = document.getElementById('car-container');
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const closeModal = document.getElementById('close-modal');
    const prevBtn = document.querySelector('.modal-buttons .prev-btn');
    const nextBtn = document.querySelector('.modal-buttons .next-btn');
    const yearInput = document.getElementById('filter-year');
    const priceInput = document.getElementById('filter-price');
    const filterBtn = document.getElementById('filter-btn');
    const brandSelect = document.getElementById('filter-brand');
    const totalCarsElement = document.getElementById('total-cars');
    const carId = document.getElementById('car-id').value; // Get car ID
    const method = carId ? 'PUT' : 'POST'; // Use PUT if editing
    const url = carId ? `/admin/cars/${carId}` : '/admin/cars'; // Dynamic URL
    const importBtn = document.getElementById('import-btn');


    let currentImageIndex = 0;
    let currentImages = [];
    let removedImages = [];  // Array to store removed images


    // dashoard overview
    async function fetchDashboardCounts() {
        try {
            // Fetch total cars
            const carResponse = await fetch('/admin/total-cars'); // Ensure the route matches your backend
            if (!carResponse.ok) throw new Error('Failed to fetch total cars');
            const carData = await carResponse.json();
    
            // Update DOM
            document.querySelector('.overview-card:nth-child(1) p').textContent = carData.count;
    
            // Fetch total blogs
            const blogResponse = await fetch('/admin/total-blogs'); // Ensure the route matches your backend
            if (!blogResponse.ok) throw new Error('Failed to fetch total blogs');
            const blogData = await blogResponse.json();
    
            // Update DOM
            document.querySelector('.overview-card:nth-child(2) p').textContent = blogData.count;
        } catch (error) {
            console.error('Error fetching dashboard counts:', error);
            document.querySelector('.overview-card:nth-child(1) p').textContent = 'Error';
            document.querySelector('.overview-card:nth-child(2) p').textContent = 'Error';
        }
    }
    
    // Run function when page loads
    document.addEventListener('DOMContentLoaded', fetchDashboardCounts);
    
    


    // Toggle form visibility
    toggleFormBtn.addEventListener('click', () => {
        formSection.style.display = formSection.style.display === 'none' ? 'block' : 'none';
    });

    // Image preview feature
    carForm.images.addEventListener('change', handleImagePreview);

    // Handle form submission
    carForm.addEventListener('submit', handleFormSubmission);

    // Load cars with sorting and filtering functionality
    function loadCars(sortBy = '', brand = '', model = '', year = '', price = '') {
        const url = `/admin/cars?sortBy=${sortBy}&brand=${brand}&model=${model}&year=${year}&price=${price}`;
    
        fetch(url)
            .then(handleResponse)
            .then(cars => {
                renderCars(cars);
            })
            .catch(error => console.error('Error loading cars:', error));
    }

    // Handle image preview
    function handleImagePreview() {
        imagePreview.innerHTML = '';
        const files = this.files;

        if (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.width = '100px';
                    img.style.marginRight = '10px';
                    imagePreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        }
    }

 // Handle form submission
 function handleFormSubmission(e) {
    e.preventDefault();
    const submitButton = document.getElementById('submit-btn');
    submitButton.disabled = true;
    submitButton.textContent = 'Uploading...';

    const formData = new FormData(carForm);
    const carId = document.getElementById('car-id').value; // Get car ID to check if editing

    // Check if this is an import
    if (isImport) {
        formData.append('source', 'import');  // Add source for imports
    }

    // Add removed images to the form data
    if (removedImages.length > 0) {
        formData.append('removedImages', JSON.stringify(removedImages));
    }

    const method = carId ? 'PUT' : 'POST'; // Use PUT if editing, POST if adding
    const url = carId ? `/admin/cars/${carId}` : '/admin/cars'; // Dynamic URL based on edit or add

    fetch(url, { method: method, body: formData })
        .then(handleResponse)
        .then(car => {
            if (carId) {
                alert('Car updated successfully!');
            } else if (car._id) {
                alert('Car added successfully!');
            } else {
                alert('Failed to save car');
            }

            carForm.reset();
            imagePreview.innerHTML = '';
            formSection.style.display = 'none';

            // Refetch cars after upload or update
            loadCars();
        })
        .catch(handleError)
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit';
        });
}


// Handle response from fetch requests
function handleResponse(response) {
    if (!response.ok) {
        return handleError(response); // Handle the error if response is not ok
    }
    return response.json();
}

// Define handleError to log or display the error
function handleError(error) {
    console.error('An error occurred:', error);
    alert('An error occurred: ' + error.message);
}

    // Render cars in the container
    function renderCars(cars) {
        carContainer.innerHTML = '';
        totalCarsElement.textContent = cars.length;

        cars.forEach(car => {
            const carItem = createCarItem(car);
            carContainer.appendChild(carItem);
      
    
    // Restore expanded state if previously expanded
        const carId = car._id;
        const isExpanded = expandedCarStates[carId];

        if (isExpanded) {
            const moreInfo = carItem.querySelector('.more-info');
            carItem.classList.add('expanded');
            moreInfo.style.display = 'block';
            carItem.querySelector('.load-more-btn').innerText = 'Show Less';
        }
    });

        attachEventListenersToImages();
        attachEventListenersToLoadMoreButtons(); // Ensure this function is defined
    }

    // Function to update the public section with new car details
    function updatePublicSection(newCar) {
        const publicCarContainer = document.getElementById('car-container');
    
        // Add the new car to the public section
        publicCarContainer.appendChild(createCarItem(newCar));
    }

    // Create car item element
    function createCarItem(car) {
        const carItem = document.createElement('div');
        carItem.className = 'car-item';
        carItem.dataset.id = car._id;

        let imagesHtml = car.images && car.images.length > 0 
            ? car.images.map((image, index) => `<img src="${image}" alt="${car.brand} ${car.model}" width="150" class="car-image" data-images='${JSON.stringify(car.images)}' data-index="${index}">`).join('') 
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
            <button onclick="editCar('${car._id}')">Edit</button>
            <button onclick="deleteCar('${car._id}')">Delete</button>
        `;

        return carItem;
    }



    // Attach event listeners to car images for modal
    function attachEventListenersToImages() {
        const carImages = document.querySelectorAll('.car-image');
        carImages.forEach(image => {
            image.addEventListener('click', function() {
                const imagesArray = JSON.parse(this.dataset.images);
                const clickedIndex = parseInt(this.dataset.index);
                openModal(imagesArray, clickedIndex);
            });
        });
    }

    let expandedCarStates = {}; // Global object to store expanded state

    // Event listener for the Load More button
    function attachEventListenersToLoadMoreButtons() {
        const loadMoreButtons = document.querySelectorAll('.load-more-btn');
        loadMoreButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const carItem = this.closest('.car-item'); // Get the closest car item
                const carId = carItem.dataset.id; // Get the car ID to store its state
                const moreInfo = carItem.querySelector('.more-info'); // Get the more-info div
                const isExpanded = carItem.classList.toggle('expanded'); // Toggle the expanded class

                 // Store the expanded state
            expandedCarStates[carId] = isExpanded;

                // Show or hide the more-info div
                moreInfo.style.display = isExpanded ? 'block' : 'none'; // Show or hide without overlap
                this.innerText = isExpanded ? 'Show Less' : 'Load More';
            });
        });
    }
    document.getElementById('toggle-form-btn').addEventListener('click', function () {
        const formSection = document.querySelector('.form-section');
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
// Close button functionality
document.getElementById('close-form-btn').addEventListener('click', function () {
    const formSection = document.querySelector('.form-section');
    formSection.style.display = 'none';
});

    // Open modal with images
    function openModal(imagesArray, index) {
        currentImages = imagesArray;
        currentImageIndex = index;

        modalImage.src = currentImages[currentImageIndex];
        modal.style.display = 'block';

        prevBtn.style.display = currentImages.length > 1 ? 'inline' : 'none';
        nextBtn.style.display = currentImages.length > 1 ? 'inline' : 'none';
    }

    // Close modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Previous image in modal
    prevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : currentImages.length - 1;
        modalImage.src = currentImages[currentImageIndex];
    });

    // Next image in modal
    nextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex < currentImages.length - 1) ? currentImageIndex + 1 : 0;
        modalImage.src = currentImages[currentImageIndex];
    });

    // Handle filter functionality
    filterBtn.addEventListener('click', () => {
        const year = yearInput.value;
        const price = priceInput.value;
        const brand = brandSelect.value;

        loadCars('price', brand, '', year, price); // Adjust sort and filter as needed
    });

    // Delete car function
    window.deleteCar = function(carId) {
        const confirmation = confirm("Are you sure you want to delete this car?");
        if (!confirmation) return;

        fetch(`/admin/cars/${carId}`, { method: 'DELETE' })
            .then(handleResponse)
            .then(() => {
                alert('Car deleted successfully!');
                loadCars(); // Refresh car list after deletion

                // Optionally update the public section after deletion
                updatePublicSectionAfterDelete(carId);
            })
            .catch(error => console.error('Error deleting car:', error));
    };

    // Function to update the public section after car deletion
    function updatePublicSectionAfterDelete(carId) {
        const publicCarContainer = document.getElementById('car-container');
        const carItem = publicCarContainer.querySelector(`.car-item[data-id="${carId}"]`);

        if (carItem) {
            publicCarContainer.removeChild(carItem); // Remove the car from the public section
        }
    }

    // Load initial cars on page load
    loadCars();
});

// import section
document.getElementById('car-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Send request for normal car addition
    try {
        const response = await fetch('/admin/cars', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            alert('Car added successfully!');
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }

 // Optional: Display a success message or perform an action
 alert("Form submitted successfully!");
});

document.getElementById('import-btn').addEventListener('click', async () => {
    const form = document.getElementById('car-form');
    const formData = new FormData(form);
    formData.append('source', 'import'); // Mark as imported

    try {
        const response = await fetch('/admin/cars/import-cars', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            alert('Car imported successfully!');
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
});


// Set up EventSource for real-time updates
const eventSource = new EventSource('/events');

eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);

    // Handle different event types
    switch (event.type) {
        case 'carAdded':
            // Handle new car addition
            updatePublicSection(data);
            totalCarsElement.textContent = parseInt(totalCarsElement.textContent) + 1; // Increment total count
            break;
        case 'carUpdated':
            // Update existing car on the public side
            updatePublicSection(data);
            break;
        case 'carDeleted':
            // Remove deleted car from the public side
            updatePublicSectionAfterDelete(data._id);
            totalCarsElement.textContent = parseInt(totalCarsElement.textContent) - 1; // Decrement total count
            break;
    }
};

// Close EventSource when no longer needed (optional)
window.addEventListener('beforeunload', () => {
    eventSource.close();
});


// Move editCar function outside the DOMContentLoaded event listener
// Array to hold removed images
const removedImages = [];

// Move editCar function outside the DOMContentLoaded event listener
window.editCar = function(carId) {
    console.log('Editing car with ID:', carId); // Log the car ID
    fetch(`/admin/cars/${carId}`)
        .then(response => response.json())
        .then(car => {
            // Populate form fields with car data
            document.getElementById('brand').value = car.brand;
            document.getElementById('model').value = car.model;
            document.getElementById('year').value = car.year;
            document.getElementById('price').value = car.price;
            document.getElementById('registration').value = car.registration;
            document.getElementById('drivetrain').value = car.drivetrain;
            document.getElementById('fuelType').value = car.fuelType;
            document.getElementById('transmission').value = car.transmission;
            document.getElementById('mileage').value = car.mileage;
            document.getElementById('description').value = car.description;
            document.getElementById('car-id').value = car._id;  // Set the car ID for editing mode

            // Show existing images with delete option
            const imagePreview = document.getElementById('image-preview');
            imagePreview.innerHTML = '';  // Clear current preview

            car.images.forEach((image) => {
                const imgElement = document.createElement('img');
                imgElement.src = image;
                imgElement.style.width = '100px';
                imgElement.style.marginRight = '10px';

                // Add delete button next to each image
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'X';
                deleteBtn.style.marginLeft = '5px';
                deleteBtn.addEventListener('click', () => {
                    imgElement.remove(); // Remove from preview
                    deleteBtn.remove();  // Remove delete button
                    removedImages.push(image);  // Store removed images
                });

                imagePreview.appendChild(imgElement);
                imagePreview.appendChild(deleteBtn);
            });

            // Show form in edit mode
            document.querySelector('.form-section').style.display = 'block';
            document.getElementById('submit-btn').textContent = 'Save Changes';

            // Scroll to form
            document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });

            // Remove "required" attribute from images input for editing
            document.getElementById('images').removeAttribute('required');
        })
        .catch(error => console.error('Error loading car details for editing:', error));
};

// Handle form submission
document.getElementById('car-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true; // Disable the button to prevent double submission

    const formData = new FormData(this);
    formData.append('removedImages', JSON.stringify(removedImages)); // Send removed images

    fetch(`/admin/cars/${document.getElementById('car-id').value}`, {
        method: 'PUT',
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update car');
        return response.json();
    })
    .then(data => {
        console.log('Car updated successfully:', data);
        // Optionally: refresh the car list or give feedback to the user
    })
    .catch(error => {
        console.error('Error updating car:', error);
    })
    .finally(() => {
        submitBtn.disabled = false; // Re-enable button after request completes
    });
});



// Adjust form submission to handle images conditionally
document.getElementById('car-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const carId = document.getElementById('car-id').value;

    // Append removed images array to the form data if editing an existing car
    if (carId) {
        formData.append('removedImages', JSON.stringify(removedImages));

        // Check if new images were added
        const imagesInput = document.getElementById('images');
        if (imagesInput.files.length === 0) {
            formData.delete('images');  // Prevent mandatory new image upload on edit
        }
    }

    fetch(carId ? `/admin/cars/${carId}` : '/admin/cars', {
        method: carId ? 'PUT' : 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        console.log('Car saved successfully:', data);
        // Reset form and hide it after submission
        event.target.reset();
        document.querySelector('.form-section').style.display = 'none';
    })
    .catch(error => console.error('Error saving car:', error));
});


// public car form section // Display these cars with a special marker on the admin side
car.find({ source: 'public' }).then(carsFromPublic => {
});

const sse = new EventSource('/admin/cars/stream');  // or for the public side
sse.onmessage = function(event) {
    const updatedCars = JSON.parse(event.data);
    fetchAndDisplayCars(updatedCars);  // Function to update the car list dynamically
};

// Blog Post
document.addEventListener('DOMContentLoaded', () => {
    fetchBlogs();
});

document.getElementById('blog-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const form = document.getElementById('blog-form');
    const formData = new FormData(form);

    try {
        const response = await fetch('/admin/blogs', {
            method: 'POST',
            body: formData, // FormData includes all fields and files
        });

        if (response.ok) {
            alert('Blog posted successfully!');
            fetchBlogs(); // Refresh the admin blog list
        } else {
            alert('Failed to post blog.');
        }
    } catch (error) {
        console.error('Error posting blog:', error);
    }
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
    const blogList = document.getElementById('blog-list');
    blogList.innerHTML = '';

    blogs.forEach((blog) => {
        const blogItem = document.createElement('div');
        blogItem.innerHTML = `
            <h3>${blog.title}</h3>
            <p>By ${blog.author} on ${new Date(blog.date).toLocaleDateString()}</p>
            <img src="/uploads/${blog.thumbnail}" alt="${blog.title}" />
            <p>${blog.content.slice(0, 200)}...</p>
            <button onclick="deleteBlog('${blog._id}')">Delete</button>
        `;
        blogList.appendChild(blogItem);
    });
}

async function deleteBlog(blogId) {
    try {
        const response = await fetch(`/admin/blogs/${blogId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Blog deleted successfully!');
            fetchBlogs(); // Refresh the admin blog list
        } else {
            alert('Failed to delete blog.');
        }
    } catch (error) {
        console.error('Error deleting blog:', error);
    }
}


// user/admin management
document.addEventListener("DOMContentLoaded", () => {
    const token = document.cookie.split(';').find(cookie => cookie.trim().startsWith('admin-token='));

    if (!token) {
        // Redirect to the login page if no token is found
        window.location.href = '/admin-login.html';
    } else {
        console.log("User is authenticated");
    }
});

  
  // Set inactivity timeout duration (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

let inactivityTimeout;

const resetInactivityTimer = () => {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    alert("Session expired due to inactivity. Redirecting to login page...");
    window.location.href = "/admin-login.html"; // Redirect to login page
  }, INACTIVITY_TIMEOUT); // Timeout after 30 minutes
};

// Reset the timer on any user activity
document.addEventListener("mousemove", resetInactivityTimer);
document.addEventListener("keydown", resetInactivityTimer);

// Start the timer when the page loads
resetInactivityTimer();
