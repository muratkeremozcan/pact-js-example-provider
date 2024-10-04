import { Prisma, PrismaClient } from '@prisma/client'
import type { Movie } from '@prisma/client'
import { MovieAdapter } from './movie-adapter'
import type { DeepMockProxy } from 'jest-mock-extended'
import { mockDeep } from 'jest-mock-extended'

// In this test suite, we are testing the Adapter,
// which is responsible for interacting with the data source (Prisma).

// Since this is an adapter in the hexagonal architecture (ports & adapters),
// its primary role is to handle data persistence and retrieval,
// and the tests here ensure that it behaves correctly in terms of data handling and error management.
//
// By mocking PrismaClient, we isolate the tests to focus solely on the adapter's logic and its interaction with Prisma's API.
// This allows us to test how the adapter handles different scenarios,
// like successfully retrieving or creating data, and how it manages errors (e.g., database connection issues).
//
// These tests do not touch the real database, making them unit tests that ensure correctness
// of the adapter's interaction with the mocked data layer.

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockDeep<PrismaClient>()),
  Prisma: {
    PrismaClientKnownRequestError: class extends Error {
      code: string
      clientVersion: string

      constructor(
        message: string,
        { code, clientVersion }: { code: string; clientVersion: string }
      ) {
        super(message)
        this.code = code
        this.clientVersion = clientVersion
      }
    }
  }
}))

describe('MovieAdapter', () => {
  let prismaMock: DeepMockProxy<PrismaClient>
  let movieAdapter: MovieAdapter

  const mockMovie: Movie = { id: 1, name: 'Inception', year: 2020 }

  beforeEach(() => {
    prismaMock = new PrismaClient() as DeepMockProxy<PrismaClient>
    movieAdapter = new MovieAdapter(prismaMock)
  })

  describe('getMovies', () => {
    it('should get all movies', async () => {
      prismaMock.movie.findMany.mockResolvedValue([mockMovie])

      const result = await movieAdapter.getMovies()

      expect(result).toEqual([mockMovie])
      expect(prismaMock.movie.findMany).toHaveBeenCalledTimes(1)
    })

    it('should handle errors in getMovies', async () => {
      prismaMock.movie.findMany.mockRejectedValue(
        new Error('Error fetching all movies')
      )

      const result = await movieAdapter.getMovies()
      expect(result).toEqual([]) // empty array on error
      expect(prismaMock.movie.findMany).toHaveBeenCalledTimes(1)
    })
  })

  describe('getMovieById', () => {
    it('should get a movie by id', async () => {
      prismaMock.movie.findUnique.mockResolvedValue(mockMovie)

      const result = await movieAdapter.getMovieById(mockMovie.id)

      expect(result).toEqual(mockMovie)
      expect(prismaMock.movie.findUnique).toHaveBeenCalledWith({
        where: { id: mockMovie.id }
      })
    })

    it('should return null if movie by id not found', async () => {
      prismaMock.movie.findUnique.mockResolvedValue(null)
      const id = 999

      const result = await movieAdapter.getMovieById(id)

      expect(result).toBeNull()
      expect(prismaMock.movie.findUnique).toHaveBeenCalledWith({
        where: { id }
      })
    })

    it('should handle errors in getMovieById', async () => {
      prismaMock.movie.findUnique.mockRejectedValue(
        new Error('Error fetching movie by id')
      )

      const result = await movieAdapter.getMovieById(1)

      expect(result).toBeNull() // Expect null on error
      expect(prismaMock.movie.findUnique).toHaveBeenCalledTimes(1)
    })
  })

  describe('getMovieByName', () => {
    it('should get a movie by name', async () => {
      prismaMock.movie.findFirst.mockResolvedValue(mockMovie)

      const result = await movieAdapter.getMovieByName(mockMovie.name)

      expect(result).toEqual(mockMovie)
      expect(prismaMock.movie.findFirst).toHaveBeenCalledWith({
        where: { name: mockMovie.name }
      })
    })

    it('should return null if movie by name not found', async () => {
      prismaMock.movie.findFirst.mockResolvedValue(null)
      const name = 'Non-existent Movie'

      const result = await movieAdapter.getMovieByName(name)

      expect(result).toBeNull()
      expect(prismaMock.movie.findFirst).toHaveBeenCalledWith({
        where: { name }
      })
    })

    it('should handle errors in getMovieByName', async () => {
      prismaMock.movie.findFirst.mockRejectedValue(
        new Error('Error fetching movie by name')
      )

      const result = await movieAdapter.getMovieByName('Inception')

      expect(result).toBeNull() // Expect null on error
      expect(prismaMock.movie.findFirst).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteMovieById', () => {
    it('should delete a movie by id', async () => {
      prismaMock.movie.delete.mockResolvedValue(mockMovie)

      const result = await movieAdapter.deleteMovieById(mockMovie.id)

      const expectedResult = {
        status: 200,
        message: `Movie ${mockMovie.id} has been deleted`
      }
      expect(result).toStrictEqual(expectedResult)
      expect(prismaMock.movie.delete).toHaveBeenCalledWith({
        where: { id: mockMovie.id }
      })
    })

    it('should delete a movie and return false if the movie is not found', async () => {
      prismaMock.movie.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Movie not found', {
          code: 'P2025',
          clientVersion: '1'
        })
      )
      const id = 999

      const result = await movieAdapter.deleteMovieById(id)

      const expectedResult = {
        status: 404,
        message: `Movie with ID ${id} not found`
      }
      expect(result).toStrictEqual(expectedResult)
      expect(prismaMock.movie.delete).toHaveBeenCalledWith({ where: { id } })
    })

    it('should call handleError and rethrow unexpected errors in deleteMovieById', async () => {
      // Mock an unexpected error (not a P2025 error)
      const unexpectedError = new Error('Unexpected error')
      prismaMock.movie.delete.mockRejectedValue(unexpectedError)
      const id = 999

      // Spy on the handleError method to ensure it's called
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleErrorSpy = jest.spyOn(movieAdapter as any, 'handleError')

      // Expect the method to throw the error
      await expect(movieAdapter.deleteMovieById(id)).rejects.toThrow(
        'Unexpected error'
      )
      expect(handleErrorSpy).toHaveBeenCalledWith(unexpectedError)
      expect(prismaMock.movie.delete).toHaveBeenCalledTimes(1)
    })
  })

  describe('addMovie', () => {
    const movieData = { name: 'Inception', year: 2020 }
    const id = 1

    it('should successfully add a movie without specifying id', async () => {
      prismaMock.movie.findFirst.mockResolvedValue(null) // no existing movie
      prismaMock.movie.create.mockResolvedValue({ id, ...movieData })

      const result = await movieAdapter.addMovie(movieData)

      expect(result).toEqual(
        expect.objectContaining({
          status: 200,
          movie: { id, ...movieData }
        })
      )
      expect(prismaMock.movie.create).toHaveBeenCalledWith({ data: movieData })
    })

    it('should successfully add a movie specifying id', async () => {
      prismaMock.movie.findFirst.mockResolvedValue(null) // no existing movie
      prismaMock.movie.create.mockResolvedValue({ id, ...movieData })

      const result = await movieAdapter.addMovie(movieData, id)

      expect(result).toEqual(
        expect.objectContaining({
          status: 200,
          movie: { id, ...movieData }
        })
      )
      expect(prismaMock.movie.create).toHaveBeenCalledWith({
        data: { id, ...movieData }
      })
    })

    it('should return 400 if validation fails', async () => {
      const invalidMovieData = { name: '', year: 1899 } // Invalid year, empty name

      const result = await movieAdapter.addMovie(invalidMovieData)
      expect(result).toEqual(
        expect.objectContaining({
          status: 400,
          error:
            'String must contain at least 1 character(s), Number must be greater than or equal to 1900'
        })
      )
    })

    it('should return 409 if the movie already exists', async () => {
      prismaMock.movie.findFirst.mockResolvedValue({ id, ...movieData }) // existing movie

      const result = await movieAdapter.addMovie(movieData)

      expect(result).toEqual(
        expect.objectContaining({
          status: 409,
          error: 'Movie Inception already exists'
        })
      )
    })

    it('should return 500 if an unexpected error occurs', async () => {
      prismaMock.movie.findFirst.mockResolvedValue(null) // No existing movie
      const error = 'Unexpected error'
      prismaMock.movie.create.mockRejectedValue(new Error(error))

      // Spy on the handleError method to ensure it's called
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleErrorSpy = jest.spyOn(movieAdapter as any, 'handleError')

      const result = await movieAdapter.addMovie(movieData)
      expect(result).toEqual(
        expect.objectContaining({ status: 500, error: 'Internal server error' })
      )
      expect(handleErrorSpy).toHaveBeenCalledWith(new Error(error))
    })
  })

  describe('updateMovie', () => {
    const id = 1
    const existingMovie = { name: 'Inception', year: 2020, id }
    const updateMovieData = { name: 'The Dark Knight', year: 2008 }
    const updatedMovie = { id, ...updateMovieData }

    it('should successfully update a movie', async () => {
      prismaMock.movie.findUnique.mockResolvedValue(existingMovie)
      prismaMock.movie.update.mockResolvedValue(updatedMovie)

      const result = await movieAdapter.updateMovie(updateMovieData, id)
      expect(result).toEqual({
        status: 200,
        movie: updatedMovie
      })

      expect(prismaMock.movie.findUnique).toHaveBeenCalledWith({
        where: { id }
      })
      expect(prismaMock.movie.update).toHaveBeenCalledWith({
        where: { id },
        data: updateMovieData
      })
    })

    it('should return 404 if the movie is not found', async () => {
      prismaMock.movie.findUnique.mockResolvedValue(null)

      const result = await movieAdapter.updateMovie(updateMovieData, id)

      expect(result).toEqual({
        status: 404,
        error: `Movie with ID ${id} not found`
      })

      expect(prismaMock.movie.findUnique).toHaveBeenCalledWith({
        where: { id }
      })
      expect(prismaMock.movie.update).not.toHaveBeenCalled()
    })

    it('should return 400 if validation fails', async () => {
      prismaMock.movie.findUnique.mockResolvedValue(existingMovie)
      const invalidMovieData = { name: '', year: 1899 } // Invalid year, empty name

      const result = await movieAdapter.updateMovie(invalidMovieData, id)
      expect(result).toEqual(
        expect.objectContaining({
          status: 400,
          error:
            'String must contain at least 1 character(s), Number must be greater than or equal to 1900'
        })
      )
    })

    it('should return 500 if an unexpected error occurs', async () => {
      // Mock the movie to be found in the database
      prismaMock.movie.findUnique.mockResolvedValue(existingMovie)
      // Mock an unexpected error during the update
      const error = new Error('Unexpected error')
      prismaMock.movie.update.mockRejectedValue(error)

      // Spy on the handleError method to ensure it's called
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleErrorSpy = jest.spyOn(movieAdapter as any, 'handleError')

      const result = await movieAdapter.updateMovie(updateMovieData, id)

      // Assertions
      expect(result).toEqual({
        status: 500,
        error: 'Internal server error'
      })
      expect(handleErrorSpy).toHaveBeenCalledWith(error)
    })
  })
})
