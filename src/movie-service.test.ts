import { MovieService } from './movie-service'
import type { MovieRepository } from './movie-repository'
import type { Movie } from '@prisma/client'

// because we use ports & adapters / hex pattern,
// the data layer (MovieRepository) is a dependency we can mock
// this ensures we're testing only the business logic and not the database.

// In this test suite, we are focusing on the Service, which encapsulates the business logic.
// Since we are following the ports & adapters (hexagonal) architecture,
// the service depends on a port/interface/contract, defined by the Repository.

// We mock the data layer (Repository) to isolate and test only the business logic in the service.
// By mocking the data layer (Repository), we ensure that the tests focus purely on how the service behaves:
// handling input, interacting with the repository, and returning the appropriate output or errors.
// This approach allows us to write unit tests that are fast, isolated, and independent of any external systems like databases.

describe('MovieService', () => {
  let movieService: MovieService
  let mockMovieRepository: jest.Mocked<MovieRepository>

  const mockMovie: Movie = { id: 1, name: 'Inception', year: 2020 }

  beforeEach(() => {
    mockMovieRepository = {
      getMovies: jest.fn(),
      getMovieById: jest.fn(),
      getMovieByName: jest.fn(),
      deleteMovieById: jest.fn(),
      addMovie: jest.fn()
    }

    movieService = new MovieService(mockMovieRepository)
  })

  it('should get all movies', async () => {
    mockMovieRepository.getMovies.mockResolvedValue([mockMovie])

    const movies = await movieService.getMovies()

    expect(movies).toEqual([mockMovie])
    expect(mockMovieRepository.getMovies).toHaveBeenCalledTimes(1)
  })

  it('should get a movie by id', async () => {
    mockMovieRepository.getMovieById.mockResolvedValue(mockMovie)

    const result = await movieService.getMovieById(mockMovie.id)

    expect(result).toEqual(mockMovie)
    expect(mockMovieRepository.getMovieById).toHaveBeenCalledWith(mockMovie.id)
  })

  it('should return null if movie by id not found', async () => {
    mockMovieRepository.getMovieById.mockResolvedValue(null)
    const id = 999

    const result = await movieService.getMovieById(id)

    expect(result).toBeNull()
    expect(mockMovieRepository.getMovieById).toHaveBeenCalledWith(id)
  })

  it('should get a movie by name', async () => {
    mockMovieRepository.getMovieByName.mockResolvedValue(mockMovie)

    const result = await movieService.getMovieByName(mockMovie.name)

    expect(result).toEqual(mockMovie)
    expect(mockMovieRepository.getMovieByName).toHaveBeenCalledWith(
      mockMovie.name
    )
  })

  it('should return null if movie by name not found', async () => {
    mockMovieRepository.getMovieByName.mockResolvedValue(null)
    const name = 'Non-existent Movie'

    const result = await movieService.getMovieByName(name)

    expect(result).toBeNull()
    expect(mockMovieRepository.getMovieByName).toHaveBeenCalledWith(name)
  })

  it('should add a new movie', async () => {
    const expectedResult = {
      status: 200,
      movie: mockMovie,
      error: undefined
    }
    mockMovieRepository.addMovie.mockResolvedValue(expectedResult)

    const result = await movieService.addMovie(mockMovie)

    expect(result).toEqual(expectedResult)
    expect(mockMovieRepository.addMovie).toHaveBeenCalledWith(
      { id: 1, name: 'Inception', year: 2020 },
      undefined
    )
  })

  it('should delete a movie by id', async () => {
    const expectedResult = {
      status: 200,
      message: 'Movie deleted'
    }
    mockMovieRepository.deleteMovieById.mockResolvedValue(expectedResult)

    const result = await movieService.deleteMovieById(1)

    expect(result).toBe(expectedResult)
    expect(mockMovieRepository.deleteMovieById).toHaveBeenCalledWith(1)
  })

  it('should try to delete and not find a movie', async () => {
    const expectedResult = {
      status: 404,
      message: 'Movie not found'
    }
    mockMovieRepository.deleteMovieById.mockResolvedValue(expectedResult)
    const id = 999

    const result = await movieService.deleteMovieById(id)

    expect(result).toEqual(expectedResult)
    expect(mockMovieRepository.deleteMovieById).toHaveBeenCalledWith(id)
  })
})
