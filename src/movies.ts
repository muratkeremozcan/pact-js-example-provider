import Joi from 'joi'
// the class encapsulates all business logic related to movie management
// this allows for clear separation from the HTTP layer (Encapsulation, Single Responsibility Principle)

// Define the structure of a Movie using an interface
export type MovieType = {
  id: number
  name: string
  year: number
}

export default class Movie {
  private movies: MovieType[] = []

  // Get all movies
  getMovies(): MovieType[] {
    return this.movies
  }

  // Get a movie by its ID
  getMovieById(id: number): MovieType | undefined {
    return this.movies.find((movie) => id === movie.id)
  }

  // Get a movie by its name
  getMovieByName(name: string): MovieType | undefined {
    return this.movies.find((movie) => movie.name === name)
  }

  // Insert a new movie
  insertMovie(movie: MovieType): void {
    this.movies.push(movie)
  }

  // Get the first movie in the list
  getFirstMovie(): MovieType | undefined {
    return this.movies[0]
  }

  // Delete a movie by its ID
  deleteMovieById(id: number): boolean {
    const index = this.movies.findIndex((movie) => movie.id === id)
    if (index === -1) return false

    this.movies.splice(index, 1)
    return true
  }

  // TODO: refactor later to return standardized responses
  // addMovie(data) {
  //   const schema = Joi.object({
  //     name: Joi.string().required(),
  //     year: Joi.number().integer().min(1900).max(2023).required()
  //   })

  //   const result = schema.validate(data)
  //   if (result.error)
  //     return { status: 400, message: result.error.details[0].message }

  //   if (this.getMovieByName(data.name))
  //     return { status: 409, message: `Movie ${data.name} already exists` }

  //   const lastMovie = this.movies[this.movies.length - 1]

  //   const movie = {
  //     id: lastMovie ? lastMovie.id + 1 : 1,
  //     name: data.name,
  //     year: data.year
  //   }

  //   this.insertMovie(movie)
  //   return { status: 200, data: movie }
  // }

  // Add a new movie, including validation
  addMovie(data: Omit<MovieType, 'id'>): {
    status: number
    error?: string
    movie?: MovieType
  } {
    const schema = Joi.object({
      name: Joi.string().required(),
      year: Joi.number().integer().min(1900).max(2023).required()
    })

    const result = schema.validate(data)
    if (result.error) {
      return { status: 400, error: result.error.details[0].message }
    }

    if (this.getMovieByName(data.name)) {
      return { status: 409, error: `Movie ${data.name} already exists` }
    }

    const lastMovie = this.movies[this.movies.length - 1]

    const movie: MovieType = {
      id: lastMovie ? lastMovie.id + 1 : 1,
      name: data.name,
      year: data.year
    }

    this.insertMovie(movie)
    return { status: 200, movie }
  }
}
