const express = require('express');

const router = express.Router();

var unescape = require('unescape-js');


const lib = require('../utilities/helpers');

const db = require("../models");
const Comment = db.comments;
const Op = db.Sequelize.Op;

router.use(express.json());
router.use(express.urlencoded({extended: true}));

const fetch = require('node-fetch');
  
const moviesUrl = 'https://swapi.dev/api/films';

function getMovies() {
    return fetch(moviesUrl);
}

router.get('/:id/comments', async (req, res) => {
    const id = parseInt(req.params.id);
    const comments = await Comment.findAll({ where: {'movie_id': id } });

    comments.sort((a,b) => b.id - a.id);

    const payload = [];
    for(let x = 0; x < comments.length; x++) {
        
        const object = {
          "comment": comments[x].message,
          "ip address": comments[x].ip_address,
          "date/time": comments[x].createdAt
        }

        payload.push(object);
    }
    res.send(payload);
})

router.post('/:id/comments', (req, res) => {
    // Validate request
  if (!req.body.message) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  const movieId = parseInt(req.params.id);
  const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;

  // Create a Comment
  const comment = {
    message: req.body.message,
    movie_id: movieId,
    ip_address: ipAddress
  };

  // Save Comment in the database
  Comment.create(comment)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Comment."
      });
    });
})


router.get('/', async function(req, res) {
    try {
        let movies = await getMovies()
        let films = await movies.json()
        let retrieved = []

        for(let x = 0; x < films.results.length; x++) {
          
          let count = await Comment.count({ where: {'movie_id': x + 1} });

        let temp = {
            name: films.results[x].title,
            comment_count: count,
            summary: unescape(films.results[x].opening_crawl)         
        }
        retrieved.push(temp);
     }
     res.send(retrieved);
    }catch(error) {
        res.send(error.message);
    }
})

router.get('/:id', async function(req, res) {
  const id = parseInt(req.params.id);

  try {
      const movies = await getMovies()
      const films = await movies.json()
      
      const result = films.results[id + 1];  
      if(result == null || result == undefined) {
        res.status(404).send({
          message: "Movie not found!"
        });
        return;
      }
      res.send(result);
  }catch(error) {
      res.status(500).send("An error occurred while retrieving the movie.");
  }
})

router.get('/:id/characters', async function(req, res) {
    const id = parseInt(req.params.id);
    const sortOrder = req.query.sortBy;
    const gender = req.query.gender;

 try {
    let movie = await getMovies()
    let movies = await movie.json()
    let characters = movies.results[id - 1].characters;

    const actors = [];

    for(let x = 0; x < characters.length; x++) {
        let artistes = await fetch(characters[x]);
        let artiste = await artistes.json();
        actors.push(artiste);
    }

    if(sortOrder == "namesAscending") {
        actors.sort((a, b) => {
            return lib.compareObjectsAscending(a, b, 'name')
          })
    } else if(sortOrder == "namesDescending") {
        actors.sort((a, b) => {
            return lib.compareObjectsDescending(a, b, 'name')
          })
    } else if(sortOrder == "heightAscending") {
        actors.sort((a, b) => a.height - b.height)
    } else if(sortOrder == "heightDescending") {
        actors.sort((a, b) => b.height - a.height)
    }

    let filtered = [];

    if(gender == "male") {
        filtered = actors.filter(actor => actor.gender == "male");
    } else if(gender == "female") {
        filtered = actors.filter(actor => actor.gender == "female");
    }

    const actorsMeta = lib.getMetadata(actors);
    const filteredMeta = lib.getMetadata(filtered);

    const payload = actors.map(actor => { return actor.name});
    const filteredPayload = filtered.map(actor => { return actor.name});

    const characterList = { metaData: actorsMeta, characters: payload };

    const filteredResponse = { metaData: filteredMeta, characters: filteredPayload};

    if(gender == undefined) {
        res.send(characterList);
    } else { res.send(filteredResponse); }
 } catch (error) {
     res.send(error.message);
 }
})

module.exports = router;