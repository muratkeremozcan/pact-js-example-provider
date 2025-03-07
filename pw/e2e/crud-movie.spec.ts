import { test, expect } from '../support/fixtures'
import { generateMovieWithoutId } from '../../src/test-helpers/factories'
import type { Movie } from '@prisma/client'

test.describe('CRUD movie', () => {
  const movie = generateMovieWithoutId()
  const updatedMovie = generateMovieWithoutId()

  const movieProps: Omit<Movie, 'id'> = {
    name: movie.name,
    year: movie.year,
    rating: movie.rating,
    director: movie.director
  }

  test('should crud', async ({
    addMovie,
    getAllMovies,
    getMovieById,
    getMovieByName,
    updateMovie,
    deleteMovie,
    authToken
  }) => {
    // Add a movie
    const { body: createResponse, status: createStatus } = await addMovie(
      authToken,
      movie
    )
    const movieId = createResponse.data.id

    expect(createStatus).toBe(200)
    expect(createResponse).toMatchObject({
      status: 200,
      data: { ...movieProps, id: movieId }
    })

    // Get all movies and verify that the movie exists
    const { body: getAllResponse, status: getAllStatus } =
      await getAllMovies(authToken)
    expect(getAllStatus).toBe(200)
    expect(getAllResponse).toMatchObject({
      status: 200,
      data: expect.arrayContaining([
        expect.objectContaining({ id: movieId, name: movie.name })
      ])
    })

    // Get the movie by ID
    const { body: getByIdResponse, status: getByIdStatus } = await getMovieById(
      authToken,
      movieId
    )

    expect(getByIdStatus).toBe(200)
    expect(getByIdResponse).toMatchObject({
      status: 200,
      data: { ...movieProps, id: movieId }
    })

    // Get the movie by name
    const { body: getByNameResponse, status: getByNameStatus } =
      await getMovieByName(authToken, movie.name)

    expect(getByNameStatus).toBe(200)
    expect(getByNameResponse).toMatchObject({
      status: 200,
      data: { ...movieProps, id: movieId }
    })

    // Update the movie
    const { body: updateResponse, status: updateStatus } = await updateMovie(
      authToken,
      movieId,
      updatedMovie
    )
    expect(updateStatus).toBe(200)
    expect(updateResponse).toMatchObject({
      status: 200,
      data: {
        name: updatedMovie.name,
        year: updatedMovie.year,
        rating: updatedMovie.rating,
        director: updatedMovie.director,
        id: movieId
      }
    })

    // Delete the movie
    const {
      status: deleteStatus,
      body: { message }
    } = await deleteMovie(authToken, movieId)
    expect(deleteStatus).toBe(200)
    expect(message).toBe(`Movie ${movieId} has been deleted`)

    // Verify the movie no longer exists
    const { body: allMoviesAfterDelete } = await getAllMovies(authToken)
    expect(allMoviesAfterDelete).toMatchObject({
      status: 200,
      data: expect.not.arrayContaining([
        expect.objectContaining({ id: movieId })
      ])
    })

    // Attempt to delete the non-existing movie
    const { status: deleteNonExistentStatus, body: deleteNonExistentBody } =
      await deleteMovie(authToken, movieId)
    expect(deleteNonExistentStatus).toBe(404)
    expect(deleteNonExistentBody).toMatchObject({
      error: `Movie with ID ${movieId} not found`
    })
  })
})
