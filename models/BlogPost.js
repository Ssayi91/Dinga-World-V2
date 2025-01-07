
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, default: 'Admin'},
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Published', 'Draft'], default: 'Draft' },
    thumbnail: String,  // URL path to the thumbnail image
});

module.exports = mongoose.model('BlogPost', blogSchema);
