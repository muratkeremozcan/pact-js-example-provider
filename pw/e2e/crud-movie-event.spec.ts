import { test, expect } from '../support/fixtures'
import { runCommand } from '../support/utils/run-command'
import { generateMovieWithoutId } from '../../src/test-helpers/factories'
import { parseKafkaEvent } from '../support/parse-kafka-event'
import { recurseWithExpect } from '../support/utils/recurse-with-expect'

test.describe('CRUD movie', () => {
  const movie = generateMovieWithoutId()
  const updatedMovie = generateMovieWithoutId()
  const movieProps = {
    name: expect.any(String),
    year: expect.any(Number),
    rating: expect.any(Number),
    director: expect.any(String)
  }
  let token: string

  test.beforeAll('should get a token with helper', async ({ apiRequest }) => {
    const responseCode = runCommand(
      `curl -s -o /dev/null -w "%{http_code}" ${process.env.KAFKA_UI_URL}`
    )
    if (responseCode !== '200') {
      test.skip()
    }

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

    // Wait for 'movie-created' Kafka event using recurseWithExpect
    await recurseWithExpect(
      async () => {
        const topic = 'movie-created'
        const event = await parseKafkaEvent(movieId, topic)

        // Perform assertions on the event content
        expect(event).toEqual([
          {
            topic,
            key: String(movieId),
            movie: {
              id: movieId,
              ...movieProps
            }
          }
        ])
      },
      { timeout: 10000, interval: 500 }
    )

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
        ...movieProps
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

    await recurseWithExpect(
      async () => {
        const topic = 'movie-updated'
        const event = await parseKafkaEvent(movieId, topic)

        // Perform assertions on the event content
        expect(event).toEqual([
          {
            topic,
            key: String(movieId),
            movie: {
              id: movieId,
              ...movieProps
            }
          }
        ])
      },
      { timeout: 10000, interval: 500 }
    )

    // Delete the movie
    const { status: deleteStatus } = await deleteMovie(token, movieId)
    expect(deleteStatus).toBe(200)

    await recurseWithExpect(
      async () => {
        const topic = 'movie-deleted'
        const event = await parseKafkaEvent(movieId, topic)

        // Perform assertions on the event content
        expect(event).toEqual([
          {
            topic,
            key: String(movieId),
            movie: {
              id: movieId,
              ...movieProps
            }
          }
        ])
      },
      { timeout: 10000, interval: 500 }
    )

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
