import { Prisma, type PrismaClient } from '@prisma/client'
import type {
  GetMovieResponse,
  CreateMovieRequest,
  CreateMovieResponse
} from './@types'
import type { MovieRepository } from './movie-repository'
import { CreateMovieSchema } from './@types/schema'

// ports & adapters (hexagonal) pattern refactor:
// movies.ts (now called movie-service) has been split into two parts,
// and movie-repository acts as the interface/port/contract between them:
// 1) movie-adapter: almost the same as before,
// but no longer instantiates Prisma; Prisma is injected via the constructor.
// 2) movie-service: focuses solely on business logic
// and delegates data access to movie-adapter through the repository interface.

// The key benefits are improved flexibility and testability:
// 1) Flexibility: the business logic (MovieService) is decoupled from the data access layer (PrismaMovieAdapter),
// making it easier to swap or replace adapters (e.g., switch from Prisma to an API or mock implementation)
// without changing the business logic.
// 2) Testability: this separation allows for isolated unit tests of each component,
// meaning you can test the business logic independently from the data layer,
// and mock the repository for more controlled and efficient tests.

// MovieAdapter: This is the implementation of the MovieRepository interface,
// responsible for interacting with a specific data source (like Prisma).
// It's an adapter in hexagonal architecture.

export class MovieAdapter implements MovieRepository {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /*
  General Error Handling with unknown in TypeScript:

    try {
      // Code that might throw an error
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Handle the error as an instance of the Error class
        console.error(error.message);
      } else {
        // Handle the case where the error is not an instance of Error
        console.error("An unknown error occurred:", error);
      }
    }
  */
  // Centralized error handling method
  private handleError(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error code:', error.code, 'Message:', error.message)
    } else if (error instanceof Error) {
      console.error('Error:', error.message)
    } else {
      console.error('An unknown error occurred:', error)
    }
  }

  // Get all movies
  async getMovies(): Promise<GetMovieResponse[]> {
    try {
      const movies = await this.prisma.movie.findMany()
      return movies.length > 0 ? movies : []
    } catch (error) {
      this.handleError(error)
      return []
    }
  }

  // Get a movie by its ID
  async getMovieById(id: number): Promise<GetMovieResponse> {
    try {
      return await this.prisma.movie.findUnique({ where: { id } })
    } catch (error) {
      this.handleError(error)
      return null
    }
  }

  // Get a movie by its name
  async getMovieByName(name: string): Promise<GetMovieResponse> {
    try {
      return await this.prisma.movie.findFirst({ where: { name } })
    } catch (error) {
      this.handleError(error)
      return null
    }
  }

  // Delete a movie by its ID
  async deleteMovieById(id: number): Promise<boolean> {
    try {
      await this.prisma.movie.delete({
        where: { id }
      })
      return true
    } catch (error) {
      // Handle specific error codes (e.g., movie not found)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false // Record not found
      }
      this.handleError(error)
      throw error // Re-throw other errors
    }
  }

  // Add a new movie with validation
  async addMovie(
    data: CreateMovieRequest,
    id?: number
  ): Promise<CreateMovieResponse> {
    try {
      // Zod Key feature 3: safeParse
      // Zod note: if you have a frontend, you can use the schema + safeParse there
      // in order to perform form validation before sending the data to the server
      const parseResult = CreateMovieSchema.safeParse(data)
      // handle validation errors
      if (!parseResult.success) {
        const errorMessages = parseResult.error.errors
          .map((err) => err.message)
          .join(', ')

        return { status: 400, error: errorMessages }
      }

      const existingMovie = await this.getMovieByName(data.name)
      if (existingMovie) {
        return { status: 409, error: `Movie ${data.name} already exists` }
      }

      const movie = await this.prisma.movie.create({
        data: id ? { id, ...data } : data
      })

      return {
        status: 200,
        movie
      }
    } catch (error) {
      this.handleError(error)
      return { status: 500, error: 'Internal server error' }
    }
  }
}
