import type { MovieRepository } from './movie-repository'
import type {
  GetMovieResponse,
  CreateMovieRequest,
  CreateMovieResponse
} from './@types'

// In the context of the MovieService, what you care about is the contract/interface
// (i.e., the methods defined by the MovieRepository interface).
// The service doesn't care if it's using Prisma, a REST API, or an in-memory database
// it only cares that the object implements MovieRepository.

export class MovieService {
  constructor(private readonly movieRepository: MovieRepository) {
    this.movieRepository = movieRepository
  }

  async getMovies(): Promise<GetMovieResponse[]> {
    return this.movieRepository.getMovies()
  }

  async getMovieById(id: number): Promise<GetMovieResponse> {
    return this.movieRepository.getMovieById(id)
  }

  async getMovieByName(name: string): Promise<GetMovieResponse> {
    return this.movieRepository.getMovieByName(name)
  }

  async deleteMovieById(id: number): Promise<boolean> {
    return this.movieRepository.deleteMovieById(id)
  }

  async addMovie(
    data: CreateMovieRequest,
    id?: number
  ): Promise<CreateMovieResponse> {
    return this.movieRepository.addMovie(data, id)
  }
}
