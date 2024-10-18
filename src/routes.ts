import type { Movie } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import type {
  CreateMovieResponse,
  DeleteMovieResponse,
  GetMovieResponse,
  UpdateMovieResponse
} from './@types'
import { authMiddleware } from './middleware/auth-middleware'
import { validateId } from './middleware/validate-movie-id'
import { MovieAdapter } from './movie-adapter'
import { MovieService } from './movie-service'
import { formatResponse } from './utils/format-response'
import { produceMovieEvent } from './events/movie-events'

export const moviesRoute = Router()

// apply auth middleware to all routes under this prefix
moviesRoute.use(authMiddleware)

// Initialize PrismaClient
const prisma = new PrismaClient()
// Create the MovieAdapter and inject it into MovieService
const movieAdapter = new MovieAdapter(prisma)
const movieService = new MovieService(movieAdapter)

// Routes are focused on handling HTTP requests and responses,
// delegating business logic to the Movies class (Separation of Concerns)

moviesRoute.get('/', async (req, res) => {
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

moviesRoute.post('/', async (req, res) => {
  const result = await movieService.addMovie(req.body)

  console.log('Received body:', req.body)

  if ('data' in result) {
    const movie = result.data
    await produceMovieEvent(movie, 'created')
  }

  return formatResponse(res, result as CreateMovieResponse)
})

moviesRoute.get('/:id', validateId, async (req, res) => {
  const result = await movieService.getMovieById(Number(req.params.id))
  return formatResponse(res, result as GetMovieResponse)
})

moviesRoute.put('/:id', validateId, async (req, res) => {
  const result = await movieService.updateMovie(req.body, Number(req.params.id))

  if ('data' in result) {
    const movie = result.data
    await produceMovieEvent(movie, 'updated')
  }

  return formatResponse(res, result as UpdateMovieResponse)
})

moviesRoute.delete('/:id', validateId, async (req, res) => {
  // check if the movie exists before attempting to delete it
  const movieResponse = await movieService.getMovieById(Number(req.params.id))

  // proceed only if the movie exists
  if ('data' in movieResponse && movieResponse.data) {
    const movie = movieResponse.data as Movie
    const result = await movieService.deleteMovieById(Number(req.params.id))

    if ('message' in result) {
      await produceMovieEvent(movie, 'deleted')
    }

    return formatResponse(res, result as DeleteMovieResponse)
  } else {
    // If the movie was not found, return a 404 or an appropriate error response
    return formatResponse(res, {
      status: 404,
      error: `Movie with ID ${Number(req.params.id)} not found`
    })
  }
})
