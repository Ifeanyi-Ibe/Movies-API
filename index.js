const express = require('express');

const db = require("./models");

const Comment = require('./models/comments.model').Comment;

const app = express();

const movies = require('./routes/movies');

app.use('/api/movies', movies);


app.use(express.json());
app.use(express.urlencoded({extended: true}));

db.sequelize.sync({ force: true }).then(() => {
    console.log("Drop and re-sync db.");
  });

const port = process.env.PORT || 3000;

app.listen(port);
