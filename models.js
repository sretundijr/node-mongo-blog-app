const mongoose = require('mongoose');

const blogSchema = mongoose.Schema({
    title: { type: String, required: true },
    author: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true }
    },
    content: { type: String, required: true }
})

blogSchema.virtual('nameString').get(function () {
    return `${this.author.firstName} ${this.author.lastName}`.trim();
})

blogSchema.methods.apiRepr = function () {
    return {
        id: this._id,
        author: this.nameString,
        title: this.title,
        content: this.content
    };
}

const BlogPost = mongoose.model('posts', blogSchema);

module.exports = { BlogPost };