
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
