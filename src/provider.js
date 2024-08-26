const express = require('express')
const Movies = require('./movies')

const server = express()
// without express.json() middleware, you would need to manually parse using JSON.parse(req.body)
server.use(express.json())

const movies = new Movies()

// Load default data into the Movies class
const importData = () => {
  const data = require('../data/movies.json')
  data.forEach((movie) => movies.insertMovie(movie))
}
// why set movies.id for each item? It's already in the data
// keeping this around in case future information gives clarification
// const importData = () => {
//   const data = require('../data/movies.json')
//   data.reduce((acc, movie) => {
//     movies.id = acc
//     movies.insertMovie(movie)
//     return acc + 1
//   }, 1)
// }

// Routes are focused on handling HTTP requests and responses,
// delegating business logic to the Movies class (Separation of Concerns)

server.get('/movies', (req, res) => {
  return res.send(movies.getMovies())
})

server.get('/movie/:id', (req, res) => {
  const movie = movies.getMovieById(req.params.id)

  if (!movie) return res.status(404).send('Movie not found')
  else return res.send(movie)
})

server.post('/movies', (req, res) => {
  const { movie, status, error } = movies.addMovie(req.body)

  if (error) {
    return res.status(status).json({ error })
  } else if (movie) {
    return res.status(status).json(movie)
  } else {
    // In case neither movie nor error is defined, ensure something is returned
    return res.status(500).json({ error: 'Unexpected error occurred' })
  }
})

server.delete('/movie/:id', (req, res) => {
  const movieDeleted = movies.deleteMovieById(req.params.id)

  if (!movieDeleted) {
    return res.status(404).json({ error: `Movie ${req.params.id} not found` })
  } else {
    return res
      .status(200)
      .json({ message: `Movie ${req.params.id} has been deleted` })
  }
})

module.exports = {
  server,
  importData,
  movies
}
