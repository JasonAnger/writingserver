const mongoose= require('mongoose')
const { Schema } = mongoose;

const postSchema = Schema({
    title: String, // String is shorthand for {type: String}
    author: String,
    description: String,
    thumbnail: String,
    content: String,
    tags: [String],
    publishedAt: {type: Date, default: Date.now}
});

const Post = mongoose.model('Post', postSchema,  'posts')

module.exports = Post