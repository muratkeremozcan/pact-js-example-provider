// producing Kafka events is purely optional
// for them to be seen in action, the provider repo has to be started
// docker has to be started, and kafka:start script has be executed in the provider repo
// we have e2e tests in the provider that execute if kafka is up
// the real intent is to test events with pact while no kafka is running

import type { Movie } from '../@types'
import { Kafka } from 'kafkajs'
import fs from 'node:fs/promises'
import type { MovieEvent } from '../@types/movie-event-types'
import { logFilePath } from './log-file-path'

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

// console log it and write the event to a file, so we can somewhat verify them
// in the real world, you might check db, other services, or any other external side effects
const logEvent = async (event: MovieEvent, logFilePath: string) => {
  console.table(event)

  return new Promise<void>((resolve) => {
    setTimeout(async () => {
      await fs.appendFile(logFilePath, `${JSON.stringify(event)}\n`)
      resolve()
    }, 1000)
  })
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
    logEvent(event, logFilePath)
    await producer.disconnect()

    return parseEvent(event)
  } catch (err) {
    console.error(
      'Kafka broker unavailable, skipping event publication: ',
      err instanceof Error ? err.message : 'Unknown error'
    )
    // optionally rethrow the error
    // if you want to let the caller handle it further with a try-catch of their own
    // throw err

    return parseEvent(event)
  }
}

/**
 * Parses the Kafka event for Pact testing.
 *
 * Kafka requires the `messages.value` field to be stringified when sending the event,
 * but for Pact testing, we want to return the parsed object version of the event
 * to simulate the original message.
 *
 * @param {MovieEvent} event - The event that was sent to Kafka.
 * @returns {MovieEvent} - The parsed event with `messages.value` converted from a string to an object. */
const parseEvent = (event: MovieEvent) => ({
  ...event,
  messages: event.messages.map((msg) => ({
    key: msg.key,
    value: typeof msg.value === 'string' ? JSON.parse(msg.value) : msg.value
  }))
})
