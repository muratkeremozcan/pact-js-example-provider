import type { Movie as MovieType } from '@prisma/client'
import { Prisma, PrismaClient } from '@prisma/client'
import Joi from 'joi'
// the class encapsulates all business logic related to movie management
// this allows for clear separation from the HTTP layer (Encapsulation, Single Responsibility Principle)

const prisma = new PrismaClient()

export default class Movie {
  private movies: MovieType[] = []

  // Centralized error handling
  private handleError(error: unknown): void {
    if (error instanceof Error) {
      console.error('Error:', error.message)
    } else {
      console.error('An unknown error occurred:', error)
    }
  }

  // Get all movies
  async getMovies(): Promise<MovieType[]> {
    try {
      const movies = await prisma.movie.findMany()
      return movies.length > 0 ? movies : []
    } catch (error) {
      this.handleError(error)
      return []
    }
  }

  // Get a movie by its ID
  async getMovieById(id: number): Promise<MovieType | null> {
    try {
      return await prisma.movie.findUnique({ where: { id } })
    } catch (error) {
      this.handleError(error)
      return null
    }
  }

  // Get a movie by its name
  async getMovieByName(name: string): Promise<MovieType | null> {
    try {
      return await prisma.movie.findFirst({ where: { name } })
    } catch (error) {
      this.handleError(error)
      return null
    }
  }

  // Get the first movie in the list
  async getFirstMovie(): Promise<MovieType | null> {
    try {
      return await prisma.movie.findFirst()
    } catch (error) {
      this.handleError(error)
      return null
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

  // Delete a movie by its ID
  async deleteMovieById(id: number): Promise<boolean> {
    try {
      await prisma.movie.delete({
        where: { id }
      })
      return true
    } catch (error) {
      // Handle the case where the movie doesn't exist
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false // This means the record was not found
      }
      throw error // Rethrow other errors
    }
  }
  // TODO: try adding this later for a CDCT test
  // delete a movie by name
  // async deleteMovieByName(name: string): Promise<boolean> {
  //   const movie = await prisma.movie.findFirst({
  //     where: { name }
  //   })
  //   if (!movie) return false

  //   await prisma.movie.delete({
  //     where: { id: movie.id }
  //   })
  //   return true
  // }

  // TODO: refactor later to return standardized responses
  // addMovie(data) {
  //   const schema = Joi.object({
  //     name: Joi.string().required(),
  //     year: Joi.number().integer().min(1900).max(2023).required()
  //   })

  //   const result = schema.validate(data)
  //   if (result.error)
  //     return { status: 400, message: result.error.details[0].message }

  //   if (this.getMovieByName(data.name))
  //     return { status: 409, message: `Movie ${data.name} already exists` }

  //   const lastMovie = this.movies[this.movies.length - 1]

  //   const movie = {
  //     id: lastMovie ? lastMovie.id + 1 : 1,
  //     name: data.name,
  //     year: data.year
  //   }

  //   this.insertMovie(movie)
  //   return { status: 200, data: movie }
  // }

  // Add a new movie, including validation
  async addMovie(
    data: Omit<MovieType, 'id'>,
    id?: number
  ): Promise<{
    status: number
    error?: string
    movie?: MovieType
  }> {
    try {
      const schema = Joi.object({
        name: Joi.string().required(),
        year: Joi.number().integer().min(1900).max(2023).required()
      })

      const result = schema.validate(data)
      if (result.error) {
        return { status: 400, error: result.error.details[0].message }
      }

      const existingMovie = await this.getMovieByName(data.name)
      if (existingMovie) {
        return { status: 409, error: `Movie ${data.name} already exists` }
      }

      // Include the optional `id` in the creation data if provided
      const movie = await prisma.movie.create({
        data: id ? { id, ...data } : data
      })

      return {
        status: 200,
        movie: {
          id: movie.id, // Make sure id is included
          name: movie.name,
          year: movie.year
        }
      }
    } catch (error) {
      this.handleError(error)
      return { status: 500, error: 'Internal server error' }
    }
  }
}
