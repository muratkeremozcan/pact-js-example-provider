import type { Movie } from '@prisma/client'

// MovieRepository: this is the interface/contract that defines the methods
// for interacting with the data layer.
// It's a port in hexagonal architecture.

export interface MovieRepository {
  getMovies(): Promise<Movie[]>
  getMovieById(id: number): Promise<Movie | null>
  getMovieByName(name: string): Promise<Movie | null>
  deleteMovieById(id: number): Promise<boolean>
  addMovie(
    data: Omit<Movie, 'id'>,
    id?: number
  ): Promise<{
    status: number
    error?: string
    movie?: Movie
  }>
}
