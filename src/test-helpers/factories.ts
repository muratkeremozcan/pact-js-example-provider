import { faker } from '@faker-js/faker'
import type { Movie, Genre, Actor } from '../@types'

// Generate mock data for an Actor
function generateActor(): Actor {
  return {
    id: faker.number.int(),
    name: faker.person.fullName()
  }
}

// Generate mock data for an existing genre
function generateGenre(): Genre {
  return {
    id: faker.number.int(),
    name: faker.music.genre()
  }
}

// Generate movie mock without IDs (for new movies)
export function generateMovieWithoutId(): Omit<Movie, 'id'> {
  const actors = Array.from(
    { length: faker.number.int({ min: 1, max: 5 }) },
    generateActor
  )
  const genres = Array.from(
    { length: faker.number.int({ min: 1, max: 3 }) },
    generateGenre
  )

  return {
    name: faker.lorem.words(3),
    year: faker.date.past().getFullYear(),
    actors,
    genres
  }
}

// Generate full mock data for an existing movie (with IDs)
export function generateMovie(): Movie {
  const actors = Array.from(
    { length: faker.number.int({ min: 1, max: 5 }) },
    generateActor
  )
  const genres = Array.from(
    { length: faker.number.int({ min: 1, max: 3 }) },
    generateGenre
  )

  return {
    id: faker.number.int(),
    name: faker.lorem.words(3),
    year: faker.date.past().getFullYear(),
    actors,
    genres
  }
}
