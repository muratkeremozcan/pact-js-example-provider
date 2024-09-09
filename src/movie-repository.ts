import type {
  GetMovieResponse,
  CreateMovieRequest,
  CreateMovieResponse,
  GetMovieNotFoundResponse,
  ConflictMovieResponse
} from './@types'

// MovieRepository: this is the interface/contract that defines the methods
// for interacting with the data layer.
// It's a port in hexagonal architecture.

export interface MovieRepository {
  getMovies(): Promise<GetMovieResponse[]>
  getMovieById(id: number): Promise<GetMovieResponse | GetMovieNotFoundResponse>
  getMovieByName(
    name: string
  ): Promise<GetMovieResponse | GetMovieNotFoundResponse>
  deleteMovieById(id: number): Promise<boolean> // TODO: update the return type to match DeleteMovieResponseSchema
  addMovie(
    data: CreateMovieRequest,
    id?: number
  ): Promise<CreateMovieResponse | ConflictMovieResponse>
}
