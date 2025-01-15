// car.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carSchema = new Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    price: { type: Number, required: true },
    registration: { 
        type: String, 
        unique: true,
        sparse: true, // Allows null values to bypass the unique constraint
        default: null,
        validate: {
            validator: function(value) {
                // Only require registration if the car is not in transit
                return this.isInTransit || (value && value.trim() !== '');

            },
            message: 'Registration is required for non-imported cars.'
        }
    },
    drivetrain: { type: String, required: true },
    fuelType: { type: String, required: true },
    transmission: { type: String, required: true },
    mileage: { type: Number, required: true },
    description: { type: String, required: true },
    images: { type: [String], default:[] }, // Array of image paths/URLs
    isInTransit: { type: Boolean, default: false }, // Indicates if the car is imported and in transit
    isUpdated: { type: Boolean, default: false }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Export the model
module.exports = mongoose.model('Car', carSchema);
