const Joi = require('joi')

// the class encapsulates all business logic related to movie management
// this allows for clear separation from the HTTP layer (Encapsulation, Single Responsibility Principle)

class Movie {
  constructor() {
    this.movies = []
  }

  getMovies() {
    return this.movies
  }

  getMovieById(id) {
    return this.movies.find((movie) => parseInt(id) === movie.id)
  }

  getMovieByName(name) {
    return this.movies.find((movie) => movie.name === name)
  }

  insertMovie(movie) {
    this.movies.push(movie)
  }

  getFirstMovie() {
    return this.movies[0]
  }

  deleteMovieById(id) {
    const index = this.movies.findIndex((movie) => movie.id === parseInt(id))
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
  addMovie(data) {
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

    const movie = {
      id: lastMovie ? lastMovie.id + 1 : 1,
      name: data.name,
      year: data.year
    }

    this.insertMovie(movie)
    return { status: 200, movie }
  }
}

module.exports = Movie
