document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('user-modal');
    const addUserBtn = document.querySelector('.add-user-btn');
    const closeModal = modal.querySelector('.close-modal');

    addUserBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
    });

    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
document.addEventListener("DOMContentLoaded", function() {
    const addCarBtn = document.querySelector(".add-car-btn");
    const modal = document.getElementById("car-modal");
    const closeModalBtn = document.querySelector(".close-modal");
    const carForm = document.querySelector(".car-form");
    const carsTableBody = document.querySelector(".cars-table tbody");
    let editMode = false;
    let currentRow = null;

    // Open modal to add new car
    addCarBtn.addEventListener("click", function() {
        editMode = false;
        modal.style.display = "block";
        carForm.reset();
    });

    // Close modal
    closeModalBtn.addEventListener("click", function() {
        modal.style.display = "none";
    });

    // Close modal when clicking outside of it
    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Handle form submission to add or edit a car
    carForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const carName = document.getElementById("carName").value;
        const carModel = document.getElementById("carModel").value;
        const carBrand = document.getElementById("carBrand").value;
        const carYear = document.getElementById("carYear").value;
        const carStatus = document.getElementById("carStatus").value;

        if (editMode) {
            // Update existing car
            currentRow.querySelector(".car-name").textContent = carName;
            currentRow.querySelector(".car-model").textContent = carModel;
            currentRow.querySelector(".car-brand").textContent = carBrand;
            currentRow.querySelector(".car-year").textContent = carYear;
            currentRow.querySelector(".car-status").textContent = carStatus;
        } else {
            // Add new car to the table
            const newRow = document.createElement("tr");

            newRow.innerHTML = `
                <td class="car-name">${carName}</td>
                <td class="car-model">${carModel}</td>
                <td class="car-brand">${carBrand}</td>
                <td class="car-year">${carYear}</td>
                <td class="car-status">${carStatus}</td>
                <td>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;

            // Add event listeners for Edit and Delete buttons
            newRow.querySelector(".edit-btn").addEventListener("click", function() {
                editMode = true;
                currentRow = newRow;
                openEditModal(newRow);
            });

            newRow.querySelector(".delete-btn").addEventListener("click", function() {
                newRow.remove();
            });

            carsTableBody.appendChild(newRow);
        }

        modal.style.display = "none";
    });

    // Open modal to edit an existing car
    function openEditModal(row) {
        modal.style.display = "block";
        carForm.reset();
        
        document.getElementById("carName").value = row.querySelector(".car-name").textContent;
        document.getElementById("carModel").value = row.querySelector(".car-model").textContent;
        document.getElementById("carBrand").value = row.querySelector(".car-brand").textContent;
        document.getElementById("carYear").value = row.querySelector(".car-year").textContent;
        document.getElementById("carStatus").value = row.querySelector(".car-status").textContent;
    }

    // Functionality for searching cars
    const searchInput = document.querySelector(".search-cars");

    searchInput.addEventListener("keyup", function() {
        const filter = searchInput.value.toLowerCase();
        const rows = carsTableBody.querySelectorAll("tr");

        rows.forEach(row => {
            const carName = row.querySelector(".car-name").textContent.toLowerCase();
            const carModel = row.querySelector(".car-model").textContent.toLowerCase();
            const carBrand = row.querySelector(".car-brand").textContent.toLowerCase();

            if (carName.includes(filter) || carModel.includes(filter) || carBrand.includes(filter)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    });
});
