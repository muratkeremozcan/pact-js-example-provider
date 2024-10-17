import type { MovieRepository } from './movie-repository'
import type {
  GetMovieResponse,
  CreateMovieRequest,
  CreateMovieResponse,
  MovieNotFoundResponse,
  ConflictMovieResponse,
  DeleteMovieResponse,
  UpdateMovieRequest,
  UpdateMovieResponse,
  GetMoviesResponse
} from './@types'
import type { ZodSchema } from 'zod'
import { CreateMovieSchema, UpdateMovieSchema } from './@types/schema'

// In the context of the MovieService, what you care about is the contract/interface
// (i.e., the methods defined by the MovieRepository interface).
// The service doesn't care if it's using Prisma, a REST API, or an in-memory database
// it only cares that the object implements MovieRepository.

export class MovieService {
  constructor(private readonly movieRepository: MovieRepository) {
    this.movieRepository = movieRepository
  }

  async getMovies(): Promise<GetMoviesResponse> {
    return this.movieRepository.getMovies()
  }

  async getMovieById(
    id: number
  ): Promise<GetMovieResponse | MovieNotFoundResponse> {
    return this.movieRepository.getMovieById(id)
  }

  async getMovieByName(
    name: string
  ): Promise<GetMovieResponse | MovieNotFoundResponse> {
    return this.movieRepository.getMovieByName(name)
  }

  async deleteMovieById(
    id: number
  ): Promise<DeleteMovieResponse | MovieNotFoundResponse> {
    return this.movieRepository.deleteMovieById(id)
  }

  async addMovie(
    data: CreateMovieRequest,
    id?: number
  ): Promise<CreateMovieResponse | ConflictMovieResponse> {
    // Zod Key feature 3: safeParse
    // Zod note: if you have a frontend, you can use the schema + safeParse there
    // in order to perform form validation before sending the data to the server
    const validationResult = validateSchema(CreateMovieSchema, data)
    if (!validationResult.success) {
      return { status: 400, error: validationResult.error }
    }

    // Business logic: Check if the movie already exists
    const existingMovieResponse = await this.movieRepository.getMovieByName(
      data.name
    )
    if (
      'data' in existingMovieResponse &&
      existingMovieResponse.status === 200 &&
      existingMovieResponse.data
    ) {
      return {
        status: 409,
        error: `Movie "${data.name}" already exists`
      }
    }

    // Proceed to add the movie via the repository
    return this.movieRepository.addMovie(data, id)
  }

  async updateMovie(
    data: UpdateMovieRequest,
    id: number
  ): Promise<
    UpdateMovieResponse | MovieNotFoundResponse | ConflictMovieResponse
  > {
    const validationResult = validateSchema(UpdateMovieSchema, data)
    if (!validationResult.success) {
      return { status: 400, error: validationResult.error }
    }

    // Business logic: Check if the movie exists
    const existingMovieResponse = await this.movieRepository.getMovieById(id)
    if (existingMovieResponse.status === 404) {
      return {
        status: 404,
        error: `Movie with ID ${id} not found`
      }
    }

    // Proceed to update the movie via the repository
    return this.movieRepository.updateMovie(data, id)
  }
}

// helper function for schema validation
function validateSchema<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    const errorMessages = result.error.errors
      .map((err) => err.message)
      .join(', ')
    return { success: false, error: errorMessages }
  }
}
