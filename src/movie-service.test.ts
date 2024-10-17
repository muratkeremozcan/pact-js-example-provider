import { MovieService } from './movie-service'
import type { MovieRepository } from './movie-repository'
import type { Movie } from './@types'

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
  const id = 1
  const mockMovieNoId: Omit<Movie, 'id'> = {
    name: 'Inception',
    year: 2010,
    actors: [
      { id: 1, name: 'Leonardo DiCaprio' },
      { id: 2, name: 'Joseph Gordon-Levitt' }
    ],
    genres: [
      { id: 1, name: 'Sci-Fi' },
      { id: 2, name: 'Action' }
    ]
  }
  const mockMovie: Movie = { id, ...mockMovieNoId }
  const mockMovieResponse = { status: 200, data: mockMovie, error: null }
  const mockMoviesResponse = {
    status: 200,
    data: [mockMovie],
    error: null
  }
  const notFoundResponse = { status: 404, data: null, error: null }

  beforeEach(() => {
    mockMovieRepository = {
      getMovies: jest.fn(),
      getMovieById: jest.fn(),
      getMovieByName: jest.fn(),
      deleteMovieById: jest.fn(),
      addMovie: jest.fn(),
      updateMovie: jest.fn()
    } as jest.Mocked<MovieRepository>

    movieService = new MovieService(mockMovieRepository)
  })

  it('should get all movies', async () => {
    mockMovieRepository.getMovies.mockResolvedValue(mockMoviesResponse)

    const { data } = await movieService.getMovies()

    expect(data).toEqual([mockMovie])
    expect(mockMovieRepository.getMovies).toHaveBeenCalledTimes(1)
  })

  it('should get a movie by id', async () => {
    mockMovieRepository.getMovieById.mockResolvedValue(mockMovieResponse)

    // @ts-expect-error TypeScript should chill for tests here
    const { data } = await movieService.getMovieById(mockMovie.id)

    expect(data).toEqual(mockMovie)
    expect(mockMovieRepository.getMovieById).toHaveBeenCalledWith(mockMovie.id)
  })

  it('should return null if movie by id not found', async () => {
    mockMovieRepository.getMovieById.mockResolvedValue(notFoundResponse)
    const id = 999

    // @ts-expect-error TypeScript should chill for tests here
    const { data } = await movieService.getMovieById(id)

    expect(data).toBeNull()
    expect(mockMovieRepository.getMovieById).toHaveBeenCalledWith(id)
  })

  it('should get a movie by name', async () => {
    mockMovieRepository.getMovieByName.mockResolvedValue(mockMovieResponse)

    // @ts-expect-error TypeScript should chill for tests here
    const { data } = await movieService.getMovieByName(mockMovie.name)

    expect(data).toEqual(mockMovie)
    expect(mockMovieRepository.getMovieByName).toHaveBeenCalledWith(
      mockMovie.name
    )
  })

  it('should return null if movie by name not found', async () => {
    mockMovieRepository.getMovieByName.mockResolvedValue(notFoundResponse)
    const name = 'Non-existent Movie'

    // @ts-expect-error TypeScript should chill for tests here
    const { data } = await movieService.getMovieByName(name)

    expect(data).toBeNull()
    expect(mockMovieRepository.getMovieByName).toHaveBeenCalledWith(name)
  })

  it('should add a new movie successfully', async () => {
    const newMovieData = { ...mockMovieNoId, name: 'New Movie', year: 2021 }
    const expectedResult = {
      status: 200,
      data: { id: 2, ...newMovieData }
    }

    // Mock getMovieByName to return 404 (movie does not exist)
    mockMovieRepository.getMovieByName.mockResolvedValue({
      status: 404,
      data: null,
      error: null
    })

    // Mock addMovie to return the expected result
    mockMovieRepository.addMovie.mockResolvedValue(expectedResult)

    const result = await movieService.addMovie(newMovieData)

    expect(result).toEqual(expectedResult)
    expect(mockMovieRepository.getMovieByName).toHaveBeenCalledWith('New Movie')
    expect(mockMovieRepository.addMovie).toHaveBeenCalledWith(
      newMovieData,
      undefined
    )
  })

  it('should not add a movie if it already exists', async () => {
    const existingMovieData = {
      ...mockMovieNoId,
      name: 'Inception',
      year: 2010
    }

    // Mock getMovieByName to return the existing movie
    mockMovieRepository.getMovieByName.mockResolvedValue(mockMovieResponse)

    const result = await movieService.addMovie(existingMovieData)

    expect(result).toEqual({
      status: 409,
      error: 'Movie "Inception" already exists'
    })
    expect(mockMovieRepository.getMovieByName).toHaveBeenCalledWith('Inception')
    expect(mockMovieRepository.addMovie).not.toHaveBeenCalled()
  })

  it('should update a movie successfully', async () => {
    const updateData = {
      ...mockMovieNoId,
      name: 'Inception Updated',
      year: 2011
    }
    const expectedResult = {
      status: 200,
      data: { id, ...updateData }
    }

    // Mock getMovieById to return the existing movie (movie exists)
    mockMovieRepository.getMovieById.mockResolvedValue(mockMovieResponse)

    // Mock updateMovie to return the expected result
    mockMovieRepository.updateMovie.mockResolvedValue(expectedResult)

    const result = await movieService.updateMovie(updateData, id)

    expect(result).toEqual(expectedResult)
    expect(mockMovieRepository.getMovieById).toHaveBeenCalledWith(id)
    expect(mockMovieRepository.updateMovie).toHaveBeenCalledWith(updateData, id)
  })

  it('should return 404 if the movie to update does not exist', async () => {
    const updateData = {
      ...mockMovieNoId,
      name: 'Non-existent Movie',
      year: 2021
    }

    // Mock getMovieById to return 404 (movie does not exist)
    mockMovieRepository.getMovieById.mockResolvedValue(notFoundResponse)

    const result = await movieService.updateMovie(updateData, id)

    expect(result).toEqual({
      status: 404,
      error: `Movie with ID ${id} not found`
    })
    expect(mockMovieRepository.getMovieById).toHaveBeenCalledWith(id)
    expect(mockMovieRepository.updateMovie).not.toHaveBeenCalled()
  })

  it('should return validation errors if input is invalid for updateMovie', async () => {
    const invalidUpdateData = { ...mockMovieNoId, name: '', year: 1800 } // Invalid data

    const result = await movieService.updateMovie(invalidUpdateData, id)

    expect(result).toEqual({
      status: 400,
      error:
        'String must contain at least 1 character(s), Number must be greater than or equal to 1900'
    })
    expect(mockMovieRepository.getMovieById).not.toHaveBeenCalled()
    expect(mockMovieRepository.updateMovie).not.toHaveBeenCalled()
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
      ...mockMovieNoId,
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
