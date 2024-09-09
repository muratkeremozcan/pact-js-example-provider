import express, { json } from 'express'
import { PrismaClient } from '@prisma/client'
import { MovieAdapter } from './movie-adapter'
import { MovieService } from './movie-service'

// Initialize Express server
const server = express()
server.use(json())

// Initialize PrismaClient
const prisma = new PrismaClient()
// Create the MovieAdapter and inject it into MovieService
const movieAdapter = new MovieAdapter(prisma)
const movieService = new MovieService(movieAdapter)

// Routes are focused on handling HTTP requests and responses,
// delegating business logic to the Movies class (Separation of Concerns)

server.get('/', (req, res) =>
  res.status(200).json({ message: 'Server is running' })
)

server.get('/movies', async (req, res) => {
  const allMovies = await movieService.getMovies()
  return res.json(allMovies)
})

server.get('/movie/:id', async (req, res) => {
  const movie = await movieService.getMovieById(parseInt(req.params.id!))

  if (!movie) return res.status(404).send('Movie not found')
  else return res.send(movie)
})

server.post('/movies', async (req, res) => {
  const result = await movieService.addMovie(req.body)

  if ('error' in result) {
    return res.status(result.status).json({ error: result.error })
  } else if ('movie' in result) {
    return res.status(result.status).json(result.movie)
  } else {
    return res.status(500).json({ error: 'Unexpected error occurred' })
  }
})

server.delete('/movie/:id', async (req, res) => {
  const movieDeleted = await movieService.deleteMovieById(
    parseInt(req.params.id!)
  )

  if (!movieDeleted) {
    return res.status(404).json({ error: `Movie ${req.params.id} not found` })
  } else {
    return res
      .status(200)
      .json({ message: `Movie ${req.params.id} has been deleted` })
  }
})

// TODO: try adding this later for a CDCT test
// server.delete(
//   '/movie/name/:name',
//   async (req, res) => {
//     const movieDeleted = await movieService.deleteMovieByName(req.params.name)

//     if (!movieDeleted) {
//       return res
//         .status(404)
//         .json({ error: `Movie with name "${req.params.name}" not found` })
//     } else {
//       return res.status(200).json({
//         message: `Movie with name "${req.params.name}" has been deleted`
//       })
//     }
//   }
// )

export { server }
