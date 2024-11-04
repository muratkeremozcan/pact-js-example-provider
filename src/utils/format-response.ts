import type { Response } from 'express'
import type {
  ConflictMovieResponse,
  CreateMovieResponse,
  DeleteMovieResponse,
  GetMovieResponse,
  MovieNotFoundResponse,
  UpdateMovieResponse
} from '../@types'

type MovieResponse =
  | DeleteMovieResponse
  | GetMovieResponse
  | UpdateMovieResponse
  | CreateMovieResponse
  | MovieNotFoundResponse
  | ConflictMovieResponse

export function formatResponse(res: Response, result: MovieResponse): Response {
  if ('error' in result && result.error) {
    const statusCode = result.status || 400 // Default to 400 if status is not set
    return res
      .status(statusCode)
      .json({ status: statusCode, error: result.error })
  } else if ('data' in result) {
    if (result.data === null) {
      const statusCode = result.status || 404 // Default to 404 if no data
      return res
        .status(statusCode)
        .json({ status: statusCode, error: 'No movies found' })
    }
    const statusCode = result.status || 200 // Default to 200 OK
    return res
      .status(statusCode)
      .json({ status: statusCode, data: result.data })
  } else if ('message' in result) {
    const statusCode = result.status || 200 // Default to 200 OK
    return res
      .status(statusCode)
      .json({ status: statusCode, message: result.message })
  } else {
    return res.status(500).json({ error: 'Unexpected error occurred' })
  }
}
