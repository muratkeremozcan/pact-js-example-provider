import type {
  GetMovieResponse,
  CreateMovieRequest,
  CreateMovieResponse
} from './@types'

// MovieRepository: this is the interface/contract that defines the methods
// for interacting with the data layer.
// It's a port in hexagonal architecture.

export interface MovieRepository {
  getMovies(): Promise<GetMovieResponse[]>
  getMovieById(id: number): Promise<GetMovieResponse>
  getMovieByName(name: string): Promise<GetMovieResponse>
  deleteMovieById(id: number): Promise<boolean>
  addMovie(data: CreateMovieRequest, id?: number): Promise<CreateMovieResponse>
}
