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