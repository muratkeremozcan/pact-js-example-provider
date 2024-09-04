import type { Movie as MovieType } from '@prisma/client'

// MovieRepository: this is the interface/contract that defines the methods
// for interacting with the data layer.
// It's a port in hexagonal architecture.

export interface MovieRepository {
  getMovies(): Promise<MovieType[]>
  getMovieById(id: number): Promise<MovieType | null>
  getMovieByName(name: string): Promise<MovieType | null>
  deleteMovieById(id: number): Promise<boolean>
  addMovie(
    data: Omit<MovieType, 'id'>,
    id?: number
  ): Promise<{
    status: number
    error?: string
    movie?: MovieType
  }>
}
