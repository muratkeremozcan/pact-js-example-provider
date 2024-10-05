import { PrismaClient } from '@prisma/client'
import cors from 'cors'
import express, { json } from 'express'
import { validateId } from './middleware/validate-movie-id'
import { MovieAdapter } from './movie-adapter'
import { MovieService } from './movie-service'
import { formatResponse } from './utils/format-response'
import type {
  CreateMovieResponse,
  DeleteMovieResponse,
  GetMovieResponse,
  UpdateMovieResponse
} from './@types'

// Initialize Express server
const server = express()
server.use(
  cors({
    origin: 'http://localhost:3000' // allow only your React app, you can add other urls here for deployments
  })
)
server.use(json())

// Initialize PrismaClient
const prisma = new PrismaClient()
// Create the MovieAdapter and inject it into MovieService
const movieAdapter = new MovieAdapter(prisma)
const movieService = new MovieService(movieAdapter)

// Routes are focused on handling HTTP requests and responses,
// delegating business logic to the Movies class (Separation of Concerns)

server.get('/', (_, res) =>
  res.status(200).json({ message: 'Server is running' })
)

server.get('/movies', async (req, res) => {
  const name = req.query.name

  if (typeof name === 'string') {
    const movie = await movieService.getMovieByName(name as string)
    return formatResponse(res, movie as GetMovieResponse)
  } else if (name) {
    return res.status(400).json({ error: 'Invalid movie name provided' })
  } else {
    const allMovies = await movieService.getMovies()
    return formatResponse(res, allMovies as GetMovieResponse)
  }
})

server.get('/movies/:id', validateId, async (req, res) => {
  const result = await movieService.getMovieById(Number(req.params.id))
  return formatResponse(res, result as GetMovieResponse)
})

server.post('/movies', async (req, res) => {
  const result = await movieService.addMovie(req.body)

  return formatResponse(res, result as CreateMovieResponse)
})

server.put('/movies/:id', validateId, async (req, res) => {
  const result = await movieService.updateMovie(req.body, Number(req.params.id))

  return formatResponse(res, result as UpdateMovieResponse)
})

server.delete('/movies/:id', validateId, async (req, res) => {
  const result = await movieService.deleteMovieById(Number(req.params.id))

  return formatResponse(res, result as DeleteMovieResponse)
})

export { server }
