require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const CarModel = require('./models/car');
const BlogPost = require('./models/BlogPost');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const EventEmitter = require('events');
const { checkAccess } = require("./middleware/roles");
const { v4: uuidv4 } = require('uuid'); // UUID for uniqueness
const fs = require('fs'); // File system to store the last used registration
const car = require('./models/car');
const session = require('express-session');


// Counter file path to track the last registration number used
const counterFilePath = './counter.json';

// Initialize Express app
const app = express();



const PORT = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || "default_secret_key";
const carEventEmitter = new EventEmitter();

const saltRounds = 10;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB URI from environment variables or fallback to local
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carDB';

if (!process.env.MONGO_URI) {
    console.warn('Warning: Using local MongoDB URI (no environment variable defined).');
}

// MongoDB connection
mongoose
    .connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1); // Exit if connection fails
    });

// Multer setup for image uploads
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

// Ensure that this function is only declared once in your file
async function isRegistrationUnique(registration, currentId = null) {
    const existingCar = await CarModel.findOne({ registration });
    return !existingCar || existingCar._id.toString() === currentId; // Ignore current car's registration if editing
}

// POST route for adding or editing a car (admin)
app.post('/admin/cars', upload.array('images', 15), async (req, res) => {
    try {
        const { id, brand, model, year, price, registration, drivetrain, fuelType, transmission, mileage, description, source } = req.body;

        if (!brand || !model || !year || !price) {
            return res.status(400).json({ error: 'Brand, model, year, and price are required.' });
        }

        const isImported = source === 'import'; // Check if the car is imported

        // Initialize images array
        let images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        if (id) {
            // Edit existing car
            const carToEdit = await CarModel.findById(id);
            if (!carToEdit) {
                return res.status(404).json({ error: 'Car not found.' });
            }

            // If no new images, keep existing ones
            if (images.length === 0) {
                images = carToEdit.images;
            }

            // Validate registration only for cars that are not imported or in transit
            if (!isImported && !carToEdit.isInTransit) {
                const isUnique = await isRegistrationUnique(registration, id); // Pass id to ignore the current car's registration
                if (!isUnique) {
                    return res.status(400).json({ error: 'Registration number must be unique.' });
                }
            }

            // Update car details
            carToEdit.brand = brand;
            carToEdit.model = model;
            carToEdit.year = year;
            carToEdit.price = price;

             // Skip updating registration if the car is imported
             if (!isImported && !carToEdit.isInTransit) {
                carToEdit.registration = registration;
            }

            carToEdit.drivetrain = drivetrain;
            carToEdit.fuelType = fuelType;
            carToEdit.transmission = transmission;
            carToEdit.mileage = mileage;
            carToEdit.description = description;
            carToEdit.images = images;

            const updatedCar = await carToEdit.save();

            // Emit real-time event for updates
            carEventEmitter.emit('carUpdated', updatedCar);

            return res.status(200).json({ message: 'Car updated successfully', car: updatedCar });
        } else {
            // Add a new car
            if (!isImported) {
                const isUnique = await isRegistrationUnique(registration);
                if (!isUnique) {
                    return res.status(400).json({ error: 'Registration number must be unique.' });
                }
            }

            const newCar = new CarModel({
                brand,
                model,
                year,
                price,
                registration: isImported ? null : registration, // Set registration to null if imported
                drivetrain,
                fuelType,
                transmission,
                mileage,
                description,
                images,
                isInTransit: isImported, // Mark as imported if source is "import"
            });

            const car = await newCar.save();

            // Emit real-time event for new car
            carEventEmitter.emit('carAdded', car);

            return res.status(201).json({ message: 'Car added successfully', car });
        }
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: 'Failed to save car', details: err.message });
    }
});




// POST route to add a car from the public side 
// public side form
app.post('/public/cars/add', upload.array('images', 15), async (req, res) => {
    try {
        const { brand, model, year, price, registration, drivetrain, fuelType, transmission, mileage, description } = req.body;

        // Validate required fields
        if (!brand || !model || !year || !price) {
            return res.status(400).json({ error: 'Brand, model, year, and price are required.' });
        }

        // Process uploaded images
        const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        // Create a new car instance
        const newCar = new CarModel({
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
            images,
            source: 'public' // Mark this as uploaded from the public side
        });

        // Save the car to the database
        const car = await newCar.save();
        console.log('Car added successfully from public side:', car);

        // Emit event if needed
        carEventEmitter.emit('carAdded', car);

        // Send a success response
        res.status(201).json(car);
    } catch (err) {
        console.error('Error adding car from public side:', err);
        res.status(500).json({ error: 'Failed to add car', details: err.message });
    }
});


// GET route to fetch all cars with sorting and filtering
app.get('/search', async (req, res) => {
    const { brand, model, year, priceRange, isInTransit } = req.query;

    // Build query object
    const query = {};

    // Make each field search case-insensitive
    if (brand) {
        query.brand = { $regex: new RegExp(brand, 'i') }; // 'i' for case-insensitivity
    }
    if (model) {
        query.model = { $regex: new RegExp(model, 'i') }; // 'i' for case-insensitivity
    }
    if (year) {
        query.year = year;
    }
    if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split('-').map(Number);
        query.price = { $gte: minPrice, $lte: maxPrice };
    }
    if (isInTransit !== undefined) {
        query.isInTransit = isInTransit === 'true'; // boolean check
    }

    try {
        const cars = await car.find(query);
        res.json(cars); // Send the found cars as a response
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ message: 'Error fetching search results' });
    }
});


// Route for fetching imported cars
app.get('/admin/cars/imported', async (req, res) => {
    try {
        const importedCars = await CarModel.find({ isInTransit: true });
        res.status(200).json(importedCars);
    } catch (error) {
        console.error('Error in /admin/cars/imported:', error.message);
        res.status(500).json({ error: 'Failed to fetch imported cars' });
    }
});

// Route for fetching a car by ID
app.get('/admin/cars/:id', async (req, res) => {
    try {
        const carId = req.params.id;

        // Validate if carId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(carId)) {
            return res.status(400).json({ error: 'Invalid car ID format' });
        }

        const car = await CarModel.findById(carId);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        res.status(200).json(car);
    } catch (error) {
        console.error('Error in /admin/cars/:id:', error.message);
        res.status(500).json({ error: 'Failed to fetch car by ID' });
    }
});
// Route to get all cars for the admin page
app.get('/admin/cars', async (req, res) => {
    try {
        const cars = await car.find();
        res.json(cars); // Send the cars as a JSON response
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ message: 'Error fetching cars' });
    }
});

// SSE endpoint for real-time updates
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const carAddedListener = (car) => {
        res.write('event: carAdded\n');
        res.write(`data: ${JSON.stringify(car)}\n\n`);
    };
    const carUpdatedListener = (car) => {
        res.write('event: carUpdated\n');
        res.write(`data: ${JSON.stringify(car)}\n\n`);
    };
    const carDeletedListener = (carId) => {
        res.write('event: carDeleted\n');
        res.write(`data: ${JSON.stringify({ _id: carId })}\n\n`);
    };

    carEventEmitter.on('carAdded', carAddedListener);
    carEventEmitter.on('carUpdated', carUpdatedListener);
    carEventEmitter.on('carDeleted', carDeletedListener);

    req.on('close', () => {
        carEventEmitter.off('carAdded', carAddedListener);
        carEventEmitter.off('carUpdated', carUpdatedListener);
        carEventEmitter.off('carDeleted', carDeletedListener);
        res.end();
    });
});



// PUT route to update a car by ID
app.put('/admin/cars/:id', upload.array('images', 15), async (req, res) => {
    const carId = req.params.id;
    const removedImages = req.body.removedImages ? JSON.parse(req.body.removedImages) : [];
    
    if (!mongoose.Types.ObjectId.isValid(carId)) {
        return res.status(400).json({ error: 'Invalid car ID format' });
    }

    try {
        const currentCar = await CarModel.findById(carId);
        if (!currentCar) {
            return res.status(404).json({ error: 'Car not found' });
        }

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
            images: [...currentCar.images],
        };

        if (req.files && req.files.length > 0) {
            updatedData.images = updatedData.images.concat(req.files.map(file => `/uploads/${file.filename}`));
        }

        if (removedImages.length > 0) {
            updatedData.images = updatedData.images.filter(img => !removedImages.includes(img));
        }

        const updatedCar = await CarModel.findByIdAndUpdate(carId, updatedData, { new: true });
        carEventEmitter.emit('carUpdated', updatedCar);

        // Send back the updated car
        res.json(updatedCar);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update car', details: err.message });
    }
});


// DELETE route to remove a car
app.delete('/admin/cars/:id', async (req, res) => {
    const carId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(carId)) {
        return res.status(400).json({ error: 'Invalid car ID format' });
    }
    try {
        const deletedCar = await CarModel.findByIdAndDelete(carId);
        if (!deletedCar) {
            return res.status(404).json({ error: 'Car not found' });
        }
        carEventEmitter.emit('carDeleted', carId);
        res.json({ message: 'Car deleted successfully', deletedCar });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete car', details: err.message });
    }
});


// Import car route - allowing submission without registration
app.post('/admin/cars/import-cars', upload.array('images'), async (req, res) => {
    const { brand, model, year, price, drivetrain, fuelType, transmission, mileage, description, source } = req.body;
    const images = req.files.map(file => file.path); // Store image paths

    // Generate unique registration number and UUID
    const { registration: generatedRegistration, uuid: uniqueImportId } = await generateImportCode();

    const carData = {
        brand,
        model,
        year,
        price,
        drivetrain,
        fuelType,
        transmission,
        mileage,
        description,
        images,
        registration: generatedRegistration,  // Use the generated registration code
        uuid: uniqueImportId,  // Use UUID for internal reference
        isInTransit: true, // Mark as imported
        isUpdated: false,
    };

    const car = new CarModel(carData);

    try {
        await car.save();
        res.status(200).json({ message: "Car imported successfully" });
    } catch (error) {
        console.error('Error saving car:', error);
        
        if (error.code === 11000) {
            res.status(400).json({ message: 'Duplicate registration detected.' });
        } else {
            res.status(500).json({ message: 'Error saving car. Please try again.' });
        }
    }
});

// Function to generate a sequential registration number
async function generateRegistrationNumber() {
    let counter = 0;

    // Read the counter from the file or initialize to 1000000
    if (fs.existsSync(counterFilePath)) {
        const data = fs.readFileSync(counterFilePath);
        const counterData = JSON.parse(data);
        counter = counterData.lastUsed || 1000000; // Start at 1000000 if no counter exists
    }

    // Increment the counter for the new registration number
    counter++;

    // Save the updated counter back to the file
    fs.writeFileSync(counterFilePath, JSON.stringify({ lastUsed: counter }));

    // Return the registration number as a string (7 digits)
    return `IMPORT ${counter.toString().padStart(3, '0')}`;  // Adjusted to show IMPORT 001, IMPORT 002, etc.
}

// Function to generate both the sequential registration number and the UUID
async function generateImportCode() {
    const registration = await generateRegistrationNumber(); // Sequential registration number
    const uuid = uuidv4(); // UUID for internal reference
    return { registration, uuid };
}
// GET route to fetch all cars (public side)
app.get('/public/cars', async (req, res) => {
    try {
        const cars = await CarModel.find(); // Fetch all cars in the database
        res.json(cars);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch car list', details: err.message });
    }
});

// GET route to fetch imported cars only (public side)
app.get('/admin/cars/imported', async (req, res) => {
    try {
        console.log('Request received for imported cars');
        const importedCars = await CarModel.find({ isInTransit: true });
        console.log('Fetched cars:', importedCars);
        res.status(200).json(importedCars);
    } catch (error) {
        console.error('Error in /admin/cars/imported:', error.message);
        res.status(500).json({ error: 'Failed to fetch imported cars' });
    }
});


// SSE for all cars (public side)
app.get('/public/cars/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const carAddedListener = (car) => {
        res.write('event: carAdded\n');
        res.write(`data: ${JSON.stringify(car)}\n\n`);
    };

    const carUpdatedListener = (car) => {
        res.write('event: carUpdated\n');
        res.write(`data: ${JSON.stringify(car)}\n\n`);
    };

    const carDeletedListener = (carId) => {
        res.write('event: carDeleted\n');
        res.write(`data: ${JSON.stringify({ _id: carId })}\n\n`);
    };

    carEventEmitter.on('carAdded', carAddedListener);
    carEventEmitter.on('carUpdated', carUpdatedListener);
    carEventEmitter.on('carDeleted', carDeletedListener);

    req.on('close', () => {
        carEventEmitter.off('carAdded', carAddedListener);
        carEventEmitter.off('carUpdated', carUpdatedListener);
        carEventEmitter.off('carDeleted', carDeletedListener);
        res.end();
    });
});


// SSE for imported cars (public side)
app.get('/public/import-cars/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const carAddedListener = (car) => {
        if (car.source === 'import') {
            res.write('event: carAdded\n');
            res.write(`data: ${JSON.stringify(car)}\n\n`);
        }
    };

    const carUpdatedListener = (car) => {
        if (car.source === 'import') {
            res.write('event: carUpdated\n');
            res.write(`data: ${JSON.stringify(car)}\n\n`);
        }
    };

    const carDeletedListener = (carId) => {
        res.write('event: carDeleted\n');
        res.write(`data: ${JSON.stringify({ _id: carId })}\n\n`);
    };

    // Listen for imported car changes
    carEventEmitter.on('carAdded', carAddedListener);
    carEventEmitter.on('carUpdated', carUpdatedListener);
    carEventEmitter.on('carDeleted', carDeletedListener);

    req.on('close', () => {
        carEventEmitter.off('carAdded', carAddedListener);
        carEventEmitter.off('carUpdated', carUpdatedListener);
        carEventEmitter.off('carDeleted', carDeletedListener);
        res.end();
    });
});

// blog section
// Handle creating a new blog post with thumbnail upload
app.post('/admin/blogs', upload.single('thumbnail'), async (req, res) => {
    const { postTitle, postContent, postStatus } = req.body;
    const thumbnail = req.file ? `/uploads/${req.file.filename}` : null; // Get filename if uploaded
    try {
        const newBlogPost = new BlogPost({ 
            title: postTitle, 
            content: postContent, 
            status: postStatus, 
            thumbnail 
        });
        await newBlogPost.save(); // Save the new blog post
        res.status(201).json(newBlogPost); // Send the created blog post as response
    } catch (error) {
        console.error('Error saving blog:', error);
        res.status(500).json('Failed to create blog post');
    }
});



// Get all published blogs for the admin side
app.get('/admin/blogs', async (req, res) => {
    try {
        const blogs = await BlogPost.find().sort({ date: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// Get only published blog posts for the public side
app.get('/blogs', async (req, res) => {
    try {
        const blogs = await BlogPost.find({ status: 'Published' }).sort({ date: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch published blogs' });
    }
});

// Update a blog post
app.put('/admin/blogs/:id', upload.single('thumbnail'), async (req, res) => {
    const { title, content, status, author } = req.body;
    const thumbnail = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
        const blog = await BlogPost.findById(req.params.id);
        if (!blog) return res.status(404).send('Blog not found');

        blog.title = title;
        blog.content = content;
        blog.status = status;
        blog.author = author;
        if (thumbnail) blog.thumbnail = thumbnail;

        await blog.save();
        res.json(blog);
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).send('Error updating blog');
    }
});

// Delete a blog (admin only)
app.delete('/admin/blogs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await BlogPost.findByIdAndDelete(id);
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete blog' });
    }
});

// admin dashbboard
// Route to get total car count
app.get('/admin/total-cars', async (req, res) => {
    try {
        const carCount = await CarModel.countDocuments(); // Assuming CarModel is your Mongoose model
        res.json({ count: carCount });
    } catch (error) {
        console.error('Error fetching car count:', error);
        res.status(500).json({ error: 'Failed to fetch car count' });
    }
});

// Route to get total blog post count
app.get('/admin/total-blogs', async (req, res) => {
    try {
        const blogCount = await BlogModel.countDocuments(); // Assuming BlogModel is your Mongoose model
        res.json({ count: blogCount });
    } catch (error) {
        console.error('Error fetching blog count: error');
        res.status(500).json({ error: 'Failed to fetch blog count' });
    }
});


// Set up session management
app.use(session({
    secret: 'motorgram202501', // Change this to a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using https
}));

// Hardcoded password (use environment variables or a database in a production environment)
const ADMIN_PASSWORD = 'Admin123'; // Replace with your actual password

// Serve static files from the 'admin' folder
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve the login page
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'admin-login.html'));
});

// Handle login form submission
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    
    // Check the password
    if (password === ADMIN_PASSWORD) {
        // Create a session for the user
        req.session.isAdmin = true;
        res.status(200).send('Login successful');
    } else {
        res.status(401).send('Incorrect password');
    }
});

// Middleware to check if the user is authenticated
function isAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next(); // Allow access to the requested page
    } else {
        res.redirect('/admin/login'); // Redirect to login page if not authenticated
    }
}

// Protect the admin dashboard and other pages
app.get('/admin/dashboard', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

app.get('/admin/blog-management', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'blog-management.html'));
});

app.get('/admin/manage-cars', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'manage-cars.html'));
});

app.get('/admin/user-management', isAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'user-management.html'));
});

// Handle logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.redirect('/admin/login');
    });
});

// admin section and users

// Temporary in-memory user data
let users = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roles: ['Manage Cars', 'Blog Management']
    },
    {
        id: 2,
        username: 'user1',
        email: 'user1@example.com',
        roles: ['Manage Cars']
    }
];

// Route to fetch all users
app.get('/api/users', (req, res) => {
    res.json(users);
});

// Route to add a new user
app.post('/api/users', (req, res) => {
    const { username, email, password, permissions } = req.body;

    // Validation
    if (!username || !email || !password) {
        return res.status(400).send('All fields are required.');
    }

    const newUser = {
        id: users.length + 1,
        username,
        email,
        roles: permissions || []
    };

    users.push(newUser);
    res.status(201).send('User added successfully.');
});

// Route to delete a user
app.delete('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    users = users.filter(user => user.id !== userId);
    res.status(200).send('User deleted successfully.');
});

// Route to update a user
app.put('/api/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const { username, email, permissions } = req.body;

    const user = users.find(user => user.id === userId);
    if (user) {
        user.username = username || user.username;
        user.email = email || user.email;
        user.roles = permissions || user.roles;
        res.status(200).send('User updated successfully.');
    } else {
        res.status(404).send('User not found.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
