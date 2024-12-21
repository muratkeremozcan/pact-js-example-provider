import { test, expect } from '../support/fixtures'
import { generateMovieWithoutId } from '../../src/test-helpers/factories'

test.describe('CRUD movie', () => {
  const movie = generateMovieWithoutId()
  const updatedMovie = generateMovieWithoutId()
  let token: string

  test.beforeAll('should get a token with helper', async ({ apiRequest }) => {
    const {
      body: { token: fetchedToken }
    } = await apiRequest<{ token: string }>({
      method: 'GET',
      url: '/auth/fake-token'
    })
    token = fetchedToken
  })

  test('should crud', async ({
    addMovie,
    getAllMovies,
    getMovieById,
    getMovieByName,
    updateMovie,
    deleteMovie
  }) => {
    // Add a movie
    const { body: createResponse, status: createStatus } = await addMovie(
      token,
      movie
    )
    expect(createStatus).toBe(200)
    expect(createResponse).toMatchObject({
      status: 200,
      data: {
        name: movie.name,
        year: movie.year,
        rating: movie.rating,
        director: movie.director
      }
    })

    const movieId = createResponse.data.id

    // Get all movies and verify the new movie exists
    const { body: allMoviesResponse, status: getAllStatus } =
      await getAllMovies(token)
    expect(getAllStatus).toBe(200)
    expect(allMoviesResponse).toMatchObject({
      status: 200,
      data: expect.arrayContaining([
        expect.objectContaining({ id: movieId, name: movie.name })
      ])
    })

    // Get the movie by ID
    const { body: getByIdResponse, status: getByIdStatus } = await getMovieById(
      token,
      movieId
    )
    expect(getByIdStatus).toBe(200)
    expect(getByIdResponse).toMatchObject({
      status: 200,
      data: {
        id: movieId,
        name: movie.name,
        year: movie.year,
        rating: movie.rating,
        director: movie.director
      }
    })

    // Get the movie by name
    const { body: getByNameResponse, status: getByNameStatus } =
      await getMovieByName(token, movie.name)
    expect(getByNameStatus).toBe(200)
    expect(getByNameResponse).toMatchObject({
      status: 200,
      data: {
        id: movieId,
        name: movie.name,
        year: movie.year,
        rating: movie.rating,
        director: movie.director
      }
    })

    // Update the movie
    const { body: updateResponse, status: updateStatus } = await updateMovie(
      token,
      movieId,
      updatedMovie
    )
    expect(updateStatus).toBe(200)
    expect(updateResponse).toMatchObject({
      status: 200,
      data: {
        id: movieId,
        name: updatedMovie.name,
        year: updatedMovie.year,
        rating: updatedMovie.rating,
        director: updatedMovie.director
      }
    })

    // Delete the movie
    const { status: deleteStatus } = await deleteMovie(token, movieId)
    expect(deleteStatus).toBe(200)

    // Verify the movie no longer exists
    const { body: allMoviesAfterDelete } = await getAllMovies(token)
    expect(allMoviesAfterDelete).toMatchObject({
      status: 200,
      data: expect.not.arrayContaining([
        expect.objectContaining({ id: movieId })
      ])
    })

    // Attempt to delete the non-existing movie
    const { status: deleteNonExistentStatus, body: deleteNonExistentBody } =
      await deleteMovie(token, movieId)
    expect(deleteNonExistentStatus).toBe(404)
    expect(deleteNonExistentBody).toMatchObject({
      error: `Movie with ID ${movieId} not found`
    })
  })
})
