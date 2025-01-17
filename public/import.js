
document.getElementById('menu-toggle').addEventListener('click', function() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('show'); // Toggle the 'show' class
});

document.getElementById('close-menu').addEventListener('click', function() {
    const navLinks = document.getElementById('nav-links');
    navLinks.classList.remove('show'); // Hide the menu when close icon is clicked
});
async function fetchImportedCars() {
    try {
        const response = await fetch('/admin/cars/imported');
        if (!response.ok) {
            throw new Error(`Server Error: ${response.status} - ${response.statusText}`);
        }

        const cars = await response.json();
        const importCarList = document.getElementById('import-car-list');
        importCarList.innerHTML = ''; // Clear existing content

        cars.forEach(car => {
            const carItem = document.createElement('div');
            carItem.classList.add('car-item');

            // Generate images HTML
            const imagesHtml = car.images
                .map(img => `<img src="${img}" alt="${car.brand} ${car.model}">`)
                .join('');

            // Populate car content
            const formattedPrice = car.price.toLocaleString();
            const formattedMileage = car.mileage.toLocaleString();
            carItem.innerHTML = `
                <div class="car-images">${imagesHtml}</div>
                <div class="car-summary">
                    <h3>${car.brand} ${car.model}</h3>
                    <p><i class="fa-regular fa-calendar-days"></i>: ${car.year}</p>
                    <p><i class="fa-solid fa-money-check-dollar"></i>: Kshs ${formattedPrice}</p>
                    <p><i class="fa-solid fa-hashtag"></i>: ${car.registration || 'N/A'}</p>
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

            // Attach event listener for the Load More button
            const loadMoreBtn = carItem.querySelector('.load-more-btn');
            const moreInfo = carItem.querySelector('.more-info');
            loadMoreBtn.addEventListener('click', () => {
                const isHidden = moreInfo.style.display === 'none';
                moreInfo.style.display = isHidden ? 'block' : 'none';
                loadMoreBtn.textContent = isHidden ? 'Show Less' : 'Load More';
            });   

            importCarList.appendChild(carItem);
        });
    } catch (error) {
        console.error('Error fetching imported cars:', error);
    }
}



// Fetch imported cars on page load
document.addEventListener('DOMContentLoaded', fetchImportedCars);

const eventSource = new EventSource('/events');
eventSource.onmessage = (event) => {
    const car = JSON.parse(event.data);
    // Append the new car to the list
    const carElement = document.createElement('div');
    carElement.classList.add('car-item');
    carElement.innerHTML = `
        <h3>${car.brand} ${car.model} (${car.year})</h3>
        <p>Price: Kshs ${car.price}</p>
        <p>Drivetrain: ${car.drivetrain}</p>
        <p>Fuel Type: ${car.fuelType}</p>
        <p>Transmission: ${car.transmission}</p>
        <p>Mileage: ${car.mileage} km</p>
        <p>${car.description}</p>
        ${car.images.map(img => `<img src="${img}" alt="${car.brand} ${car.model}">`).join('')}
    `;
    document.getElementById('import-car-list').appendChild(carElement);
};
// Modal elements
const modal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const closeModal = document.getElementById('close-modal');
const prevArrow = document.getElementById('prev-arrow');
const nextArrow = document.getElementById('next-arrow');

let currentImageIndex = 0;
let images = [];

// Function to open the modal
function openModal(imgSrc, allImages) {
    images = allImages; // Save all image sources for navigation
    currentImageIndex = images.indexOf(imgSrc); // Set the clicked image index
    modal.style.display = 'flex'; // Show the modal
    modalImage.src = imgSrc; // Set the modal image to the clicked image
    document.body.style.overflow = 'hidden'; // Disable background scrolling
}

// Close the modal
closeModal.addEventListener('click', () => {
    modal.style.display = 'none'; // Hide the modal
    document.body.style.overflow = 'auto'; // Re-enable scrolling
});

// Navigate to the next image
nextArrow.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % images.length; // Loop to the first image
    modalImage.src = images[currentImageIndex];
});

// Navigate to the previous image
prevArrow.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length; // Loop to the last image
    modalImage.src = images[currentImageIndex];
});

// Event delegation for dynamically added images
document.getElementById('import-car-list').addEventListener('click', (event) => {
    if (event.target.tagName === 'IMG') { // Check if the clicked element is an image
        const clickedImage = event.target;
        const allImages = Array.from(document.querySelectorAll('#import-car-list img')).map(img => img.src); // Get all image sources
        openModal(clickedImage.src, allImages); // Open modal for the clicked image
    }
});


// Handle search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const importCarList = document.getElementById('import-car-list'); // Container for the cars
    const clearFilterButton = document.getElementById('clear-filter');

    // Function to fetch and display all imported cars
    async function fetchAllImportedCars() {
        try {
            const response = await fetch('/search?type=imported'); // Fetch all imported cars
            if (!response.ok) {
                throw new Error('Failed to fetch imported cars.');
            }

            const cars = await response.json();
            importCarList.innerHTML = ''; // Clear the container

            if (cars.length === 0) {
                importCarList.innerHTML = '<p>No imported cars available at the moment.</p>';
                return;
            }

            cars.forEach(car => {
                const carItem = createCarItem(car);
                importCarList.appendChild(carItem);
            });
        } catch (error) {
            console.error('Error fetching imported cars:', error);
            importCarList.innerHTML = '<p>An error occurred while loading imported cars. Please try again later.</p>';
        }
    }

    // Event listener for search form submission
    searchForm.addEventListener('submit', async function (e) {
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
            type: 'imported' // Ensure only imported cars are fetched
        }).toString();

        try {
            // Fetch search results
            const response = await fetch(`/search?${queryString}`);
            if (!response.ok) {
                throw new Error('Failed to fetch search results.');
            }

            const cars = await response.json();

            // Clear current listings
            importCarList.innerHTML = '';

            if (cars.length === 0) {
                importCarList.innerHTML = '<p>No imported cars found for the given search criteria.</p>';
                return;
            }

            // Populate search results dynamically
            cars.forEach(car => {
                const carItem = createCarItem(car);
                importCarList.appendChild(carItem);
            });

            // Scroll to results
            importCarList.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error fetching search results:', error);
            alert('An error occurred while fetching search results. Please try again.');
        }
    });

    // Event listener for clear filter button
    clearFilterButton.addEventListener('click', () => {
        searchForm.reset(); // Reset the search form
        fetchImportedCars(); // Reload all imported cars
    });

    // Function to create a car item
    function createCarItem(car) {
        const carItem = document.createElement('div');
        carItem.classList.add('car-item');

        // Create car images
        const carImages = document.createElement('div');
        carImages.classList.add('car-images');
        car.images.forEach(imageUrl => {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = car.model;
            carImages.appendChild(img);
        });

        // Create car summary
        const carSummary = document.createElement('div');
        carSummary.classList.add('car-summary');

        carSummary.innerHTML = `
            <h3>${car.brand} ${car.model}</h3>
            <p><i class="fa-regular fa-calendar-days"></i>: ${car.year}</p>
            <p><i class="fa-solid fa-money-check-dollar"></i>: Kshs ${car.price}</p>
            <p><i class="fa-solid fa-hashtag"></i>: ${car.registration || 'Not Registered'}</p>
            <p><i class="fa-solid fa-gas-pump"></i>: ${car.fuelType}</p>
            <p><i class="fa-solid fa-gears"></i>: ${car.transmission}</p>
            <p><i class="fa-solid fa-car-side"></i>: ${car.drivetrain}</p>
            <p><i class="fa-solid fa-gauge"></i>: ${car.mileage} Kms</p>
            <button class="load-more-btn">Load More</button>
        `;

        // Add hidden description
        const moreInfo = document.createElement('div');
        moreInfo.classList.add('more-info');
        moreInfo.style.display = 'none';
        moreInfo.innerHTML = `
            <p><i class="fa-solid fa-circle-info"></i>: ${car.description}</p>
        `;
        carSummary.appendChild(moreInfo);

        // Attach event listener to "Load More" button
        const loadMoreBtn = carSummary.querySelector('.load-more-btn');
        loadMoreBtn.addEventListener('click', () => {
            moreInfo.style.display = moreInfo.style.display === 'none' ? 'block' : 'none';
        });

        // Append images and summary to the car item
        carItem.appendChild(carImages);
        carItem.appendChild(carSummary);

        return carItem;
    }

    // Initial load of all imported cars
    fetchImportedCars();
});
