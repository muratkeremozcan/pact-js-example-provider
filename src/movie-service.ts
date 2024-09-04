import type { MovieRepository } from './movie-repository'
import type { Movie } from '@prisma/client'

// In the context of the MovieService, what you care about is the contract/interface
// (i.e., the methods defined by the MovieRepository interface).
// The service doesn't care if it's using Prisma, a REST API, or an in-memory database
// it only cares that the object implements MovieRepository.

export class MovieService {
  constructor(private readonly movieRepository: MovieRepository) {
    this.movieRepository = movieRepository
  }

  async getMovies(): Promise<Movie[]> {
    return this.movieRepository.getMovies()
  }

  async getMovieById(id: number): Promise<Movie | null> {
    return this.movieRepository.getMovieById(id)
  }

  async getMovieByName(name: string): Promise<Movie | null> {
    return this.movieRepository.getMovieByName(name)
  }

  async deleteMovieById(id: number): Promise<boolean> {
    return this.movieRepository.deleteMovieById(id)
  }

  async addMovie(
    data: Omit<Movie, 'id'>,
    id?: number
  ): Promise<{
    status: number
    error?: string
    movie?: Movie
  }> {
    return this.movieRepository.addMovie(data, id)
  }
}
