// car.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const carSchema = new Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    price: { type: Number, required: true },
    registration: {type: String,required: true,},
    drivetrain: { type: String, required: true},
    fuelType: { type: String, required: true },
    transmission: { type: String, required: true },
    mileage: { type: Number, required: true },
    description: { type: String, required: true },
    images: { type: [String] }, // Array of image URLs
    isUpdated: { type: Boolean, default: false }
    
});

module.exports = mongoose.model('Car', carSchema);
