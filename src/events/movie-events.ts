import type { Movie } from '@prisma/client'
import { Kafka } from 'kafkajs'
import fs from 'node:fs'

export const logFilePath = './cypress/movie-events.log'

const kafka = new Kafka({
  clientId: 'movie-provider',
  brokers: ['localhost:29092'],
  // reduce retries and delays
  // so that those who don't start docker still have their crud fast
  retry: {
    retries: 2, // default 5
    initialRetryTime: 100, // delay initial (default 300 ms)
    maxRetryTime: 300 // delay between retries (default 30 secs)
  }
})
const producer = kafka.producer()

type MovieAction = 'created' | 'updated' | 'deleted'
type Event<T extends string> = {
  topic: `movie-${T}`
  messages: Array<{
    key: string // id as string
    value: string // serialized movie object
  }>
}
type MovieEvent = Event<MovieAction>

// console log it and write the event to a file, so we can somewhat verify them
// in the real world, you might check db, other services, or any other external side effects
const logEvent = (event: MovieEvent) => {
  console.table(event)
  fs.appendFileSync(logFilePath, `${JSON.stringify(event)}\n`)
}

export const produceMovieEvent = async (
  movie: Movie,
  action: 'created' | 'updated' | 'deleted'
) => {
  const event: MovieEvent = {
    topic: `movie-${action}`,
    messages: [{ key: movie.id.toString(), value: JSON.stringify(movie) }]
  }

  try {
    await producer.connect()
    await producer.send(event)
    logEvent(event)
    await producer.disconnect()
  } catch (err) {
    console.error(
      'Kafka broker unavailable, skipping event publication: ',
      err instanceof Error ? err.message : 'Unknown error'
    )
    // optionally rethrow the error
    // if you want to let the caller handle it further with a try-catch of their own
    // throw err
  }
}
