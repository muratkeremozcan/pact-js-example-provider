import type { Request, Response } from 'express'
import express from 'express'
import Movie from './movies'

// Initialize Express server
const server = express()
server.use(express.json())

// Initialize the Movie class instance
const movieService = new Movie()

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

server.get(
  '/movies',
  async (req: Request, res: Response): Promise<Response> => {
    const allMovies = await movieService.getMovies()
    return res.json(allMovies)
  }
)

server.get(
  '/movie/:id',
  async (req: Request, res: Response): Promise<Response> => {
    const movie = await movieService.getMovieById(parseInt(req.params.id))

    if (!movie) return res.status(404).send('Movie not found')
    else return res.send(movie)
  }
)

server.post(
  '/movies',
  async (req: Request, res: Response): Promise<Response> => {
    const { movie, status, error } = await movieService.addMovie(req.body)

    if (error) {
      return res.status(status).json({ error })
    } else if (movie) {
      return res.status(status).json(movie)
    } else {
      // In case neither movie nor error is defined, ensure something is returned
      return res.status(500).json({ error: 'Unexpected error occurred' })
    }
  }
)

server.delete(
  '/movie/:id',
  async (req: Request, res: Response): Promise<Response> => {
    const movieDeleted = await movieService.deleteMovieById(
      parseInt(req.params.id)
    )

    if (!movieDeleted) {
      return res.status(404).json({ error: `Movie ${req.params.id} not found` })
    } else {
      return res
        .status(200)
        .json({ message: `Movie ${req.params.id} has been deleted` })
    }
  }
)

// TODO: try adding this later for a CDCT test
// server.delete(
//   '/movie/name/:name',
//   async (req: Request, res: Response): Promise<Response> => {
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

export { movieService, server }
