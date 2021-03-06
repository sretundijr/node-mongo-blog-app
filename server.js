const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { BlogPost } = require('./models');

const app = express();

app.use(bodyParser.json());

app.get('/posts', (req, res) => {
    BlogPost
        .find()
        .exec()
        .then(posts => {
            res.json({
                posts: posts.map(post => post.apiRepr())
            })
        })
})

app.get('/posts/:id', (req, res) => {
    BlogPost
        .findById(req.params.id)
        .exec()
        .then(post => res.json(post.apiRepr()))
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' })
        });
})

app.post('/posts', (req, res) => {
    const requiredFields = ['title', 'content', 'author'];
    console.log(req.body)
    requiredFields.find(function (field) {
        if (!(field in req.body)) {
            const message = `Missing ${field} request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    })

    BlogPost
        .create({
            title: req.body.title,
            author: req.body.author,
            content: req.body.content
        })
        .then(
        post => res.status(201).json(post.apiRepr())
        )
        .catch(err => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        })
})

app.put('/posts/:id', (req, res) => {
    if (!(req.params.id === req.body.id)) {
        const message = `Request path id ${req.params.id} does not match ${req.body.id}`;
        console.error(message);
        res.status(400).json({ message: message });
    }

    const update = {};
    const updatableFields = ['title', 'content', 'author'];

    updatableFields.forEach((field) => {
        if (field in req.body) {
            update[field] = req.body[field];
        }
    })

    BlogPost
        .findByIdAndUpdate(req.params.id, { $set: update })
        .exec()
        .then(post => res.status(200).json(post.apiRepr()))
        .catch(err => res.status(500).json('Internal server error'));
})

app.delete('/posts/:id', (req, res) => {
    BlogPost
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(post => res.status(204).end())
        .catch(err => res.status(500).json({ message: 'Internal server error' }))
})

app.use('*', (req, res) => {
    res.status(404).json({ message: 'Not found' });
})

let server;

function runServer(databaseUrl = DATABASE_URL, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, (err) => {
            if (err) {
                return reject(err);
            }
            server = app.listen(port, () => {
                console.log(`Your app is listening on ${port}`);
                resolve();
            })
                .on(`error`, (err) => {
                    mongoose.disconnect();
                    reject(err);
                })
        })
    })
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('closing server');
            server.close((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            })
        })
    })
}

if (require.main === module) {
    runServer().catch((err) => {
        console.error(err);
    })
}

module.exports = { app, runServer, closeServer };