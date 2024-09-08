import type { Movie } from '@prisma/client'

export type CreateMovieRequest = Omit<Movie, 'id'>

export type CreateMovieResponse = {
  status: number
  error?: string
  movie?: Movie
}

export type GetMovieResponse = Movie | null
