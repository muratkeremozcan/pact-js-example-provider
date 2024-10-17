import { PrismaClient } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { MovieAdapter } from './movie-adapter'
import type { DeepMockProxy } from 'jest-mock-extended'
import { mockDeep } from 'jest-mock-extended'
import { generateMovie, generateMovieWithoutId } from './test-helpers/factories'
import type { Movie } from './@types'

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const actualPrisma = jest.requireActual('@prisma/client')
  return {
    ...actualPrisma,
    PrismaClient: jest.fn(() => mockDeep<PrismaClient>())
  }
})

describe('MovieAdapter', () => {
  let prismaMock: DeepMockProxy<PrismaClient>
  let movieAdapter: MovieAdapter

  const mockMovieNoId: Omit<Movie, 'id'> = generateMovieWithoutId()
  const mockMovie: Movie = generateMovie()

  beforeEach(() => {
    prismaMock = new PrismaClient() as unknown as DeepMockProxy<PrismaClient>
    movieAdapter = new MovieAdapter(prismaMock)
  })

  describe('getMovies', () => {
    it('should get all movies', async () => {
      prismaMock.movie.findMany.mockResolvedValue([mockMovie])

      const { data } = await movieAdapter.getMovies()

      expect(data).toEqual([mockMovie])
      expect(prismaMock.movie.findMany).toHaveBeenCalledWith({
        include: expect.any(Object)
      })
    })

    it('should handle errors in getMovies', async () => {
      prismaMock.movie.findMany.mockRejectedValue(
        new Error('Error fetching all movies')
      )

      const result = await movieAdapter.getMovies()
      expect(result.data).toEqual([]) // empty array on error
      expect(result.error).toBe('Failed to retrieve movies')
      expect(prismaMock.movie.findMany).toHaveBeenCalledTimes(1)
    })
  })

  describe('getMovieById', () => {
    it('should get a movie by id', async () => {
      prismaMock.movie.findUnique.mockResolvedValue(mockMovie)

      const { data } = await movieAdapter.getMovieById(mockMovie.id)

      expect(data).toEqual(mockMovie)
      expect(prismaMock.movie.findUnique).toHaveBeenCalledWith({
        where: { id: mockMovie.id },
        include: expect.any(Object) // Since include is used in the adapter
      })
    })

    it('should return 404 if movie by id not found', async () => {
      prismaMock.movie.findUnique.mockResolvedValue(null)
      const id = 999

      const { data, error, status } = await movieAdapter.getMovieById(id)

      expect(data).toBeNull()
      expect(status).toBe(404)
      expect(error).toBe(`Movie with ID ${id} not found`)
      expect(prismaMock.movie.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: expect.any(Object)
      })
    })

    it('should handle errors in getMovieById', async () => {
      prismaMock.movie.findUnique.mockRejectedValue(
        new Error('Error fetching movie by id')
      )

      const { data, error, status } = await movieAdapter.getMovieById(1)

      expect(data).toBeNull()
      expect(status).toBe(500)
      expect(error).toBe('Internal server error')
      expect(prismaMock.movie.findUnique).toHaveBeenCalledTimes(1)
    })
  })

  describe('getMovieByName', () => {
    it('should get a movie by name', async () => {
      prismaMock.movie.findFirst.mockResolvedValue(mockMovie)

      const { data } = await movieAdapter.getMovieByName(mockMovie.name)

      expect(data).toEqual(mockMovie)
      expect(prismaMock.movie.findFirst).toHaveBeenCalledWith({
        where: { name: mockMovie.name },
        include: expect.any(Object)
      })
    })

    it('should return 404 if movie by name not found', async () => {
      prismaMock.movie.findFirst.mockResolvedValue(null)
      const name = 'Non-existent Movie'

      const { data, error, status } = await movieAdapter.getMovieByName(name)

      expect(data).toBeNull()
      expect(status).toBe(404)
      expect(error).toBe(`Movie with name "${name}" not found`)
      expect(prismaMock.movie.findFirst).toHaveBeenCalledWith({
        where: { name },
        include: expect.any(Object)
      })
    })

    it('should handle errors in getMovieByName', async () => {
      prismaMock.movie.findFirst.mockRejectedValue(
        new Error('Error fetching movie by name')
      )

      const { data, error, status } =
        await movieAdapter.getMovieByName('Inception')

      expect(data).toBeNull()
      expect(status).toBe(500)
      expect(error).toBe('Internal server error')
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

    it('should return 404 if movie is not found for deletion', async () => {
      prismaMock.movie.delete.mockRejectedValue(
        new PrismaClientKnownRequestError('Movie not found', {
          code: 'P2025',
          clientVersion: '1'
        })
      )
      const id = 999

      const result = await movieAdapter.deleteMovieById(id)

      const expectedResult = {
        status: 404,
        error: `Movie with ID ${id} not found`
      }
      expect(result).toStrictEqual(expectedResult)
      expect(prismaMock.movie.delete).toHaveBeenCalledWith({ where: { id } })
    })

    it('should return 500 if an unexpected error occurs in deleteMovieById', async () => {
      // Mock an unexpected error (not a P2025 error)
      const unexpectedError = new Error('Unexpected error')
      prismaMock.movie.delete.mockRejectedValue(unexpectedError)
      const id = 999

      // Spy on the handleError method to ensure it's called
      const handleErrorSpy = jest.spyOn(movieAdapter as any, 'handleError')

      const result = await movieAdapter.deleteMovieById(id)

      expect(handleErrorSpy).toHaveBeenCalledWith(unexpectedError)
      expect(result).toEqual({
        status: 500,
        error: 'Internal server error'
      })
      expect(prismaMock.movie.delete).toHaveBeenCalledTimes(1)
    })
  })

  describe('addMovie', () => {
    const movieData = mockMovieNoId
    const id = 1

    it('should successfully add a movie', async () => {
      prismaMock.movie.findFirst.mockResolvedValue(null) // no existing movie
      prismaMock.movie.create.mockResolvedValue({ id, ...movieData })

      const result = await movieAdapter.addMovie(movieData)

      expect(result).toEqual({
        status: 200,
        data: { id, ...movieData }
      })
      expect(prismaMock.movie.create).toHaveBeenCalledWith({
        data: {
          name: movieData.name,
          year: movieData.year,
          genres: expect.any(Object),
          actors: expect.any(Object)
        },
        include: expect.any(Object)
      })
    })

    it('should return 409 if the movie already exists', async () => {
      prismaMock.movie.findFirst.mockResolvedValue({ id, ...movieData }) // existing movie

      const result = await movieAdapter.addMovie(movieData)

      expect(result).toEqual({
        status: 409,
        error: `Movie ${movieData.name} already exists`
      })
    })

    it('should return 500 if an unexpected error occurs', async () => {
      prismaMock.movie.findFirst.mockResolvedValue(null) // No existing movie
      const error = new Error('Unexpected error')
      prismaMock.movie.create.mockRejectedValue(error)

      // Spy on the handleError method to ensure it's called
      const handleErrorSpy = jest.spyOn(movieAdapter as any, 'handleError')

      const result = await movieAdapter.addMovie(movieData)

      expect(result).toEqual({
        status: 500,
        error: 'Internal server error'
      })
      expect(handleErrorSpy).toHaveBeenCalledWith(error)
    })
  })

  describe('updateMovie', () => {
    const id = 1
    const updateMovieData = {
      name: 'The Dark Knight',
      year: 2008,
      genres: [{ id: 3 }],
      actors: [{ id: 4 }]
    }
    const updatedMovie = { id, ...updateMovieData }

    it('should successfully update a movie', async () => {
      prismaMock.movie.update.mockResolvedValue(updatedMovie)

      const result = await movieAdapter.updateMovie(updateMovieData, id)

      expect(result).toEqual({
        status: 200,
        data: updatedMovie
      })

      expect(prismaMock.movie.update).toHaveBeenCalledWith({
        where: { id },
        data: expect.any(Object),
        include: expect.any(Object)
      })
    })

    it('should return 404 if the movie is not found', async () => {
      const error = new PrismaClientKnownRequestError('Movie not found', {
        code: 'P2025',
        clientVersion: '1.0.0'
      })

      prismaMock.movie.update.mockRejectedValue(error)

      const result = await movieAdapter.updateMovie(updateMovieData, id)

      expect(result).toEqual({
        status: 404,
        error: `Movie with ID ${id} not found`
      })

      expect(prismaMock.movie.update).toHaveBeenCalledWith({
        where: { id },
        data: expect.any(Object),
        include: expect.any(Object)
      })
    })

    it('should return 500 if an unexpected error occurs', async () => {
      const error = new Error('Unexpected error')
      prismaMock.movie.update.mockRejectedValue(error)

      // Spy on the handleError method
      const handleErrorSpy = jest.spyOn(movieAdapter as any, 'handleError')

      const result = await movieAdapter.updateMovie(updateMovieData, id)

      expect(result).toEqual({
        status: 500,
        error: 'Internal server error'
      })

      expect(handleErrorSpy).toHaveBeenCalledWith(error)
      expect(prismaMock.movie.update).toHaveBeenCalledWith({
        where: { id },
        data: expect.any(Object),
        include: expect.any(Object)
      })
    })
  })
})
