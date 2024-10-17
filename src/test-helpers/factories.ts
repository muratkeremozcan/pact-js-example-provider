import { faker } from '@faker-js/faker'
import type { Movie, Director, Genre } from '../@types'

// Generate mock data for an existing director (with an ID)
function generateDirectorOrActor(): Director {
  return {
    id: faker.number.int(),
    name: faker.person.fullName()
  }
}

// Generate mock data for an existing genre (with an ID)
function generateGenre(): Genre {
  return {
    id: faker.number.int(),
    name: faker.music.genre()
  }
}

// Generate movie mock without IDs (for new movies)
export function generateMovieWithoutId(): Omit<Movie, 'id'> {
  const numActors = faker.number.int({ min: 1, max: 5 })
  const numGenres = faker.number.int({ min: 1, max: 3 })

  return {
    name: faker.lorem.words(3),
    year: faker.date.past().getFullYear(),
    director: faker.helpers.arrayElement([generateDirectorOrActor(), null]),
    actors: Array.from({ length: numActors }, generateDirectorOrActor),
    genres: Array.from({ length: numGenres }, generateGenre)
  }
}

// Generate full mock data for an existing movie (with IDs)
export function generateMovie(): Movie {
  const numActors = faker.number.int({ min: 1, max: 5 })
  const numGenres = faker.number.int({ min: 1, max: 3 })

  return {
    id: faker.number.int(),
    name: faker.lorem.words(3),
    year: faker.date.past().getFullYear(),
    director: faker.helpers.arrayElement([generateDirectorOrActor(), null]),
    actors: Array.from({ length: numActors }, generateDirectorOrActor),
    genres: Array.from({ length: numGenres }, generateGenre)
  }
}
