document.getElementById('menu-toggle').addEventListener('click', function() {
    var navLinks = document.getElementById('nav-links');
    navLinks.classList.toggle('show');
});

document.getElementById('close-menu').addEventListener('click', function() {
    var navLinks = document.getElementById('nav-links');
    navLinks.classList.remove('show');
});

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('car-modal'); // Updated ID
    const modalContent = modal.querySelector('.modal-content');
    const closeBtn = modal.querySelector('.close');

    // Function to open modal with car details
    function openModal(car) {
        const carDetailsHtml = `
            <div class="car-images">
                ${car.images.map(img => `<img src="${img}" alt="Car Image">`).join('')}
            </div>
            <div class="car-details">
                <h3>${car.name}</h3>
                <p>Engine Capacity: ${car.engine}</p>
                <p>${car.doors} door</p>
                <p>${car.fuel}</p>
                <p>Price: ${car.price}</p>
                <p class="car-description">${car.description}</p>
            </div>
        `;
        
        modalContent.innerHTML = carDetailsHtml;
        modal.style.display = 'block';
    
        // If needed, ensure 'show' class is added
        const description = modalContent.querySelector('.car-description');
        if (description) {
            description.classList.add('show');
        }
    }
    
    

    // Event listener to close the modal
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Click outside the modal to close
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Event listener for car items
    document.querySelectorAll('.car-item').forEach(item => {
        item.addEventListener('click', function() {
            const carId = this.getAttribute('data-id');

            // Static car data
            const cars = {
                1: {
                    name: 'Audi A4',
                    engine: '2.0L',
                    doors: '4',
                    fuel: 'Petrol',
                    price: '$20,000',
                    images: [
                        'Assets/audi 2017 a4.webp',
                        'Assets/audi 2017 a4.webp',
                        'Assets/audi a4 front 2017.webp',
                        'Assets/audi a3 2016 front.webp',
                        'Assets/audi a3 2016 back.webp'
                    ],
                    description: `Like most of the current Audi lineup, 
                    The A4 does a commendable job of carving out passenger space from its relatively compact footprint. Rear seating is spacious, with 35.7 inches of legroom, and a standard sunroof.
                    Storage bins and cubbies are on the small side, however, but the trunk offers 12 cubic feet, which is about average for the class..`
                },
                2: {
                    name: 'Audi Q5',
                    engine: '3.0L',
                    doors: '5',
                    fuel: 'Petrol',
                    price: '$15,000',
                    images: [
                        'Assets/audi q5 back side 2016.webp',
                        'Assets/audi q5 front 2016.webp',
                        'Assets/audi sq 5 2016 back side.webp',
                        'Assets/audi sq5 2016.webp'
                    ],
                    description: `A versatile and stylish SUV, the Audi Q5 offers a luxurious interior with high-quality materials and advanced technology. Its spacious cabin ensures comfort for passengers,
                    while the powerful engine options provide an exhilarating driving experience. The Q5's cargo space is ample, making it a practical choice for families and adventurers alike.`
                },
                3: {
                    name: 'RangeRover Sport SVR',
                    engine: '5.0L',
                    doors: '5',
                    fuel: 'Petrol',
                    price: '$115,000',
                    images: [
                        'Assets/range sport 1.webp',
                        'Assets/range 2.webp',
                        'Assets/range 3.webp',
                        'Assets/range 4.webp',
                        'Assets/range 5.webp',
                    ],
                    description: `A versatile and stylish SUV, the SVR offers a luxurious interior with a sporty package.
                     Its spacious cabin ensures comfort for passengers,while the powerful engine options provide an exhilarating driving experience. The SVR is also a practical choice for families and adventurers alike.`
                }
                
            };

            const car = cars[carId];
            if (car) {
                openModal(car);
            }
        });
    });
});

