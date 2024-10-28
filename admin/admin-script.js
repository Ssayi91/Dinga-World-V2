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

    let currentImageIndex = 0;
    let currentImages = [];
    let removedImages = [];  // Array to store removed images
    let expandedCarStates = {}; // Object to store expanded state of cars

    // Toggle form visibility
    toggleFormBtn.addEventListener('click', () => {
        formSection.style.display = formSection.style.display === 'none' ? 'block' : 'none';
    });

    // Image preview feature
    carForm.images.addEventListener('change', handleImagePreview);

    // Load cars with sorting and filtering functionality
    function loadCars(sortBy = '', brand = '', model = '', year = '', price = '') {
        const url = `https://dinga-world.onrender.com/admin/cars?sortBy=${sortBy}&brand=${brand}&model=${model}&year=${year}&price=${price}`;
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

    // Combined form submission handler
    function handleFormSubmission(event) {
        event.preventDefault();
        const submitButton = document.getElementById('submit-btn');
        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';

        const formData = new FormData(carForm);
        const carId = document.getElementById('car-id').value;
        
        // Append removed images to the form data if in edit mode
        if (carId) {
            formData.append('removedImages', JSON.stringify(removedImages));
            const imagesInput = document.getElementById('images');
            if (imagesInput.files.length === 0) {
                formData.delete('images'); // Prevent mandatory new image upload on edit
            }
        }

        const method = carId ? 'PUT' : 'POST'; // Use PUT if editing, POST if adding
        const url = carId ? `https://dinga-world.onrender.com/admin/cars/${carId}` : '/admin/cars';

        fetch(url, { method, body: formData })
            .then(handleResponse)
            .then(car => {
                if (carId) {
                    alert('Car updated successfully!');
                } else if (car._id) {
                    alert('Car added successfully!');
                } else {
                    alert('Failed to save car');
                }

                // Reset form and preview
                carForm.reset();
                imagePreview.innerHTML = '';
                formSection.style.display = 'none';

                // Refetch cars after upload or update
                loadCars();
                
                if (!carId) {
                    updatePublicSection(car); // Add new car to public section
                    totalCarsElement.textContent = parseInt(totalCarsElement.textContent) + 1;
                }
            })
            .catch(handleError)
            .finally(() => {
                submitButton.disabled = false;
                submitButton.textContent = carId ? 'Save Changes' : 'Add Car';
            });
    }

    carForm.addEventListener('submit', handleFormSubmission); // Single listener for form submission

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
        attachEventListenersToLoadMoreButtons();
    }

    // Function to update the public section with new car details
    function updatePublicSection(newCar) {
        const publicCarContainer = document.getElementById('car-container');
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

    // Event listener for the Load More button
    function attachEventListenersToLoadMoreButtons() {
        const loadMoreButtons = document.querySelectorAll('.load-more-btn');
        loadMoreButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                const carItem = this.closest('.car-item');
                const carId = carItem.dataset.id;
                const moreInfo = carItem.querySelector('.more-info');
                const isExpanded = carItem.classList.toggle('expanded');

                expandedCarStates[carId] = isExpanded;
                this.innerText = isExpanded ? 'Show Less' : 'Load More';
                moreInfo.style.display = isExpanded ? 'block' : 'none';
            });
        });
    }

    loadCars();
});
