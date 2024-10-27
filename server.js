require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const Car = require('./models/car'); // Correct path to the Car model
const EventEmitter = require('events'); // For handling custom events



const app = express();
const PORT = process.env.PORT || 3000;
const carEventEmitter = new EventEmitter(); // EventEmitter instance

app.use(cors());

// Middleware for parsing body and handling JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from 'public' and 'admin' directories
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB URI from environment variables
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
    console.error('MongoDB URI not defined!');
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/carDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));


  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|webp|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'));
        }
    }
});

// POST route for adding a new car (with multiple images)
app.post('https://dinga-world.onrender.com/admin/cars', upload.array('images', 15), async (req, res) => {
    try {
        const { brand, model, year, price, registration, drivetrain, fuelType, transmission, mileage, description } = req.body;

        // Validate required fields
        if (!brand || !model || !year || !price) {
            return res.status(400).json({ error: 'Brand, model, year, and price are required.' });
        }

        // Save file paths of uploaded images
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        // Create a new car instance
        const newCar = new Car({
            brand,
            model,
            year,
            price,
            registration,
            drivetrain,
            fuelType,
            transmission,
            mileage,
            description,
            images
        });

        // Save the car to the database
        const car = await newCar.save();
        console.log('Car saved successfully:', car);

        // Emit an event to notify the public side clients
        carEventEmitter.emit('carAdded', car);

        res.status(201).json(car);
    } catch (err) {
        console.error('Error saving car:', err);
        res.status(400).json({ error: 'Failed to add car', details: err.message });
    }
});

// GET route to fetch all cars for admin with sorting and filtering
app.get('https://dinga-world.onrender.com/admin/cars', async (req, res) => {
    try {
        const { brand, model, year, price, sortBy, limit, skip } = req.query;
        const query = {};

        if (brand) query.brand = brand;
        if (model) query.model = new RegExp(model, 'i'); // case-insensitive match
        if (year) query.year = year;

        if (price) {
            const priceRange = price.split('-');
            query.price = { $gte: Number(priceRange[0]), $lte: Number(priceRange[1]) };
        }

        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = 1; // Sorting in ascending order
        }

        const limitValue = parseInt(limit) || 10000000000000; // Default limit
        const skipValue = parseInt(skip) || 0; // Default skip to 0

        const cars = await Car.find(query)
            .sort(sortOptions)
            .skip(skipValue)
            .limit(limitValue);

        console.log('Cars fetched:', cars);
        res.json(cars);
    } catch (err) {
        console.error('Error fetching cars:', err);
        res.status(500).send(err);
    }
});

// Public GET route to fetch all cars
app.get('https://dinga-world.onrender.com/public/cars', async (req, res) => {
    try {
        const cars = await Car.find(); // Retrieve all cars without filters
        res.json(cars);
    } catch (err) {
        console.error('Error fetching cars:', err);
        res.status(500).send(err);
    }
});

// GET route to fetch a car by ID for editing (with validation)
app.get('https://dinga-world.onrender.com/admin/cars/:id', async (req, res) => {
    const carId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
        return res.status(400).json({ error: 'Invalid car ID format' });
    }

    try {
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        res.json(car);
    } catch (err) {
        console.error('Error fetching car by ID:', err);
        res.status(500).json({ error: 'Failed to fetch car details', details: err.message });
    }
});

// SSE endpoint for real-time updates
app.get('https://dinga-world.onrender.com/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush headers to establish SSE connection

    // Listener for added cars
    const carAddedListener = (car) => {
        res.write('event: carAdded\n');
        res.write(`data: ${JSON.stringify(car)}\n\n`);
    };

    // Listener for updated cars
    const carUpdatedListener = (car) => {
        res.write('event: carUpdated\n');
        res.write(`data: ${JSON.stringify(car)}\n\n`);
    };

    // Listener for deleted cars
    const carDeletedListener = (carId) => {
        res.write('event: carDeleted\n');
        res.write(`data: ${JSON.stringify({ _id: carId })}\n\n`);
    };

    // Add event listeners
    carEventEmitter.on('carAdded', carAddedListener);
    carEventEmitter.on('carUpdated', carUpdatedListener);
    carEventEmitter.on('carDeleted', carDeletedListener);

    // Clean up when the connection is closed
    req.on('close', () => {
        carEventEmitter.off('carAdded', carAddedListener);
        carEventEmitter.off('carUpdated', carUpdatedListener);
        carEventEmitter.off('carDeleted', carDeletedListener);
        res.end();
    });
});

// PUT route to update a car by ID (with validation)
app.put('https://dinga-world.onrender.com/admin/cars/:id', upload.array('images', 15), async (req, res) => {
    const carId = req.params.id;
    const removedImages = JSON.parse(req.body.removedImages || '[]'); // Parse removed images

    // Validate the car ID
    if (!mongoose.Types.ObjectId.isValid(carId)) {
        return res.status(400).json({ error: 'Invalid car ID format' });
    }

    try {
        // Find the current car
        const currentCar = await Car.findById(carId);
        if (!currentCar) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // Prepare the updated data object
        const updatedData = {
            brand: req.body.brand,
            model: req.body.model,
            year: req.body.year,
            price: req.body.price,
            registration: req.body.registration,
            drivetrain: req.body.drivetrain,
            fuelType: req.body.fuelType,
            transmission: req.body.transmission,
            mileage: req.body.mileage,
            description: req.body.description,
            images: [...currentCar.images], // Start with existing images
        };

        // Handle adding new images
        if (req.files && req.files.length > 0) {
            updatedData.images = updatedData.images.concat(req.files.map(file => `/uploads/${file.filename}`));
        }

        // Remove images that were marked for deletion
        if (removedImages.length > 0) {
            updatedData.images = updatedData.images.filter(img => !removedImages.includes(img));
        }

        // Update the car in the database
        const updatedCar = await Car.findByIdAndUpdate(carId, updatedData, { new: true });
        carEventEmitter.emit('carUpdated', updatedCar);
        res.json(updatedCar);
    } catch (err) {
        console.error('Error updating car:', err);
        res.status(500).json({ error: 'Failed to update car', details: err.message });
    }
});


// DELETE route to remove a car by ID (with validation)
app.delete('https://dinga-world.onrender.com/admin/cars/:id', async (req, res) => {
    const carId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
        return res.status(400).json({ error: 'Invalid car ID format' });
    }

    try {
        const car = await Car.findByIdAndDelete(carId);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }

        // Emit an event to notify public clients about the deletion
        carEventEmitter.emit('carDeleted', carId);

        res.json({ success: true, message: 'Car deleted', car });
    } catch (err) {
        console.error('Error deleting car:', err);
        res.status(500).json({ error: 'Failed to delete car', details: err.message });
    }
});
// public section car form
app.post('https://dinga-world.onrender.com/public/cars/add', upload.array('images'), async (req, res) => {
    try {
        // Create a new car object
        const newCar = new Car({
            brand: req.body.brand,
            model: req.body.model,
            year: req.body.year,
            price: req.body.price,
            registration:req.body.registration,
            drivetrain: req.body.drivetrain,
            fuelType: req.body.fuelType,
            transmission: req.body.transmission,
            mileage: req.body.mileage,
            description: req.body.description,
            images: req.files.map(file => file.path),  // Save image paths
            source: 'public',  // Mark this car as coming from the public
        });
        // Save the car to the database
        await newCar.save();

        // Send success response
        res.json({ success: true });

        // Here you can add logic for real-time updates using websockets or SSE

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});