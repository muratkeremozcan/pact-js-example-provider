import { Prisma, type PrismaClient } from '@prisma/client'
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
import type { MovieRepository } from './movie-repository'

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

// Define a type for movies with relations
type MovieWithRelations = Prisma.MovieGetPayload<{
  include: {
    actors: { include: { actor: true } }
    genres: { include: { genre: true } }
  }
}>

export class MovieAdapter implements MovieRepository {
  private readonly prisma: PrismaClient

  // Extracted 'include' object to avoid repetition
  private readonly movieInclude = {
    actors: {
      include: {
        actor: true
      }
    },
    genres: {
      include: {
        genre: true
      }
    }
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

  /**
   * Transforms a Prisma Movie object into a simplified movie representation.
   * This helper function is used to format movie data for API responses.
   *
   * @param movie - The Prisma Movie object with included relations
   * @returns A simplified movie object with nested actor and genre information
   */
  private transformMovie(movie: MovieWithRelations) {
    return {
      id: movie.id,
      name: movie.name,
      year: movie.year,
      actors: movie.actors.map(({ actor }) => ({
        id: actor.id,
        name: actor.name
      })),
      genres: movie.genres.map(({ genre }) => ({
        id: genre.id,
        name: genre.name
      }))
    }
  }

  /**
   * Helper method to generate relation data for genres and actors.
   *
   * @param items - An array of objects containing the `id` of genres or actors to connect.
   * @param relationKey - The key name ('genre' or 'actor') to specify which relation is being connected.
   * @returns A Prisma relation input for connecting the items.
   */
  private generateRelationData<T extends 'genre' | 'actor'>(
    items: Array<{ id: number }>,
    relationKey: T
  ): {
    create: Array<{ [K in T]: { connect: { id: number } } }>
  } {
    return {
      create: items.map((item) => ({
        [relationKey]: { connect: { id: item.id } }
      })) as Array<{ [K in T]: { connect: { id: number } } }>
    }
  }

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  // Get all movies
  async getMovies(): Promise<GetMoviesResponse> {
    try {
      // Use findMany with include to retrieve all movies along with their related data
      // This is necessary because:
      // 1. We want to fetch multiple movies (hence findMany)
      // 2. We need to include related entities (actors, genres) for each movie
      // 3. The include option allows us to specify which related data to fetch in a single query,
      //    reducing the number of database roundtrips and improving performance
      // 4. This approach ensures we have all the necessary data to transform into our API response format
      const movies = await this.prisma.movie.findMany({
        include: this.movieInclude
      })

      const transformedMovies = movies.map(this.transformMovie)

      return {
        status: 200,
        data: transformedMovies,
        error: null
      }
    } catch (error) {
      this.handleError(error)

      return {
        status: 500,
        data: [],
        error: 'Failed to retrieve movies'
      }
    }
  }

  // Get a movie by its ID
  async getMovieById(
    id: number
  ): Promise<GetMovieResponse | MovieNotFoundResponse> {
    try {
      const movie = await this.prisma.movie.findUnique({
        where: { id },
        include: this.movieInclude
      })

      if (movie) {
        const transformedMovie = this.transformMovie(movie)

        return {
          status: 200,
          data: transformedMovie,
          error: null
        }
      }

      return {
        status: 404,
        data: null,
        error: `Movie with ID ${id} not found`
      }
    } catch (error) {
      this.handleError(error)
      return {
        status: 500,
        data: null,
        error: 'Internal server error'
      }
    }
  }

  // Get a movie by its name
  async getMovieByName(name: string): Promise<GetMovieResponse> {
    try {
      const movie = await this.prisma.movie.findFirst({
        where: { name },
        include: this.movieInclude
      })

      if (movie) {
        const transformedMovie = this.transformMovie(movie)
        return {
          status: 200,
          data: transformedMovie,
          error: null
        }
      } else {
        // Return a structured response if no movie is found
        return {
          status: 404,
          data: null,
          error: `Movie with name "${name}" not found`
        }
      }
    } catch (error) {
      this.handleError(error)
      return {
        status: 500,
        data: null,
        error: 'Internal server error'
      }
    }
  }

  // Delete a movie by its ID
  async deleteMovieById(
    id: number
  ): Promise<DeleteMovieResponse | MovieNotFoundResponse> {
    try {
      await this.prisma.movie.delete({
        where: { id }
        // include: this.movieInclude // not necessary since we do not return the deleted movie
      })
      return {
        status: 200,
        message: `Movie ${id} has been deleted`
      }
    } catch (error) {
      // Handle specific error codes (e.g., movie not found)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return {
          status: 404,
          error: `Movie with ID ${id} not found`
        }
      }
      this.handleError(error)
      // Instead of re-throwing the error, return a consistent error response
      return {
        status: 500,
        error: 'Internal server error'
      }
    }
  }

  // Add a new movie with validation
  async addMovie(
    data: CreateMovieRequest
  ): Promise<CreateMovieResponse | ConflictMovieResponse> {
    try {
      // Check if the movie already exists
      const existingMovie = await this.prisma.movie.findFirst({
        where: { name: data.name },
        include: this.movieInclude
      })

      if (existingMovie) {
        return { status: 409, error: `Movie ${data.name} already exists` }
      }

      // Ensure all actors exist, create if missing (or handle as needed)
      const actorIds = data.actors.map((actor) => actor.id)
      const existingActors = await this.prisma.actor.findMany({
        where: { id: { in: actorIds } }
      })

      if (existingActors.length !== actorIds.length) {
        const missingActorIds = actorIds.filter(
          (id) => !existingActors.some((actor) => actor.id === id)
        )
        // You can either throw an error or create the missing actors
        // Option 1: Return an error
        return {
          status: 400,
          error: `Actors with IDs ${missingActorIds.join(', ')} do not exist.`
        }

        // Option 2: Create missing actors (comment out if not needed)
        // await this.prisma.actor.createMany({ data: missingActorIds.map(id => ({ id, name: '' })) });
      }

      // Ensure all genres exist, create if missing (or handle as needed)
      const genreIds = data.genres.map((genre) => genre.id)
      const existingGenres = await this.prisma.genre.findMany({
        where: { id: { in: genreIds } }
      })

      if (existingGenres.length !== genreIds.length) {
        const missingGenreIds = genreIds.filter(
          (id) => !existingGenres.some((genre) => genre.id === id)
        )
        return {
          status: 400,
          error: `Genres with IDs ${missingGenreIds.join(', ')} do not exist.`
        }
      }

      // Create the new movie
      const movie = await this.prisma.movie.create({
        data: {
          name: data.name,
          year: data.year,
          genres: this.generateRelationData(data.genres, 'genre'),
          actors: this.generateRelationData(data.actors, 'actor')
        },
        include: this.movieInclude
      })

      return {
        status: 200,
        data: this.transformMovie(movie)
      }
    } catch (error) {
      this.handleError(error)
      return { status: 500, error: 'Internal server error' }
    }
  }

  // Update an existing movie
  async updateMovie(
    data: Partial<UpdateMovieRequest>,
    id: number
  ): Promise<
    UpdateMovieResponse | MovieNotFoundResponse | ConflictMovieResponse
  > {
    try {
      const updateData: Prisma.MovieUpdateInput = {
        ...(data.name && { name: data.name }),
        ...(data.year && { year: data.year }),
        ...(data.genres && {
          genres: {
            deleteMany: {}, // Remove existing relationships
            ...this.generateRelationData(data.genres, 'genre') // Add new relationships
          }
        }),
        ...(data.actors && {
          actors: {
            deleteMany: {}, // Remove existing relationships
            ...this.generateRelationData(data.actors, 'actor') // Add new relationships
          }
        })
      }

      if (data.actors !== undefined) {
        updateData.actors = {
          deleteMany: {},
          create: data.actors.map((actor) => ({
            actor: { connect: { id: actor.id } }
          }))
        }
      }

      const updatedMovie = await this.prisma.movie.update({
        where: { id },
        data: updateData,
        include: this.movieInclude
      })

      return {
        status: 200,
        data: this.transformMovie(updatedMovie)
      }
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return {
          status: 404,
          error: `Movie with ID ${id} not found`
        }
      }
      this.handleError(error)
      return { status: 500, error: 'Internal server error' }
    }
  }
}
