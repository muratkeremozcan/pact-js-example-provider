import express, { json } from 'express'
import type { Response } from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { MovieAdapter } from './movie-adapter'
import { MovieService } from './movie-service'
import type {
  UpdateMovieResponse,
  CreateMovieResponse,
  MovieNotFoundResponse,
  ConflictMovieResponse,
  GetMovieResponse,
  DeleteMovieResponse
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

type MovieResponse =
  | DeleteMovieResponse
  | GetMovieResponse
  | UpdateMovieResponse
  | CreateMovieResponse
  | MovieNotFoundResponse
  | ConflictMovieResponse

function handleResponse(res: Response, result: MovieResponse): Response {
  if ('error' in result && result.error) {
    return res.status(result.status).json({ error: result.error })
  } else if ('data' in result) {
    if (result.data === null) {
      return res.status(404).json({ error: 'No movies found' })
    }
    return res
      .status(result.status)
      .json({ status: result.status, data: result.data })
  } else if ('message' in result) {
    // Handle delete movie case with a success message
    return res
      .status(result.status)
      .json({ status: result.status, message: result.message })
  } else {
    return res.status(500).json({ error: 'Unexpected error occurred' })
  }
}

function validateId(res: Response, id: number): boolean | Response {
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid movie ID provided' })
    return false // prevent further execution
  } else return true // id is valid
}

// Routes are focused on handling HTTP requests and responses,
// delegating business logic to the Movies class (Separation of Concerns)

server.get('/', (req, res) =>
  res.status(200).json({ message: 'Server is running' })
)

server.get('/movies', async (req, res) => {
  const name = req.query.name

  if (typeof name === 'string') {
    const movie = await movieService.getMovieByName(name as string)
    console.log({ movie })
    return handleResponse(res, movie)
  } else if (name) {
    return res.status(400).json({ error: 'Invalid movie name provided' })
  } else {
    const allMovies = await movieService.getMovies()
    return handleResponse(res, allMovies)
  }
})

server.get('/movies/:id', async (req, res) => {
  const movieId = parseInt(req.params.id!)
  validateId(res, movieId)

  const movie = await movieService.getMovieById(movieId)
  return handleResponse(res, movie)
})

server.post('/movies', async (req, res) => {
  const result = await movieService.addMovie(req.body)

  return handleResponse(res, result)
})

server.put('/movies/:id', async (req, res) => {
  const movieId = parseInt(req.params.id!)
  const result = await movieService.updateMovie(req.body, movieId)

  return handleResponse(res, result)
})

server.delete('/movies/:id', async (req, res) => {
  const movieId = parseInt(req.params.id!)
  validateId(res, movieId)

  const result = await movieService.deleteMovieById(movieId)

  return handleResponse(res, result)
})

export { server }
