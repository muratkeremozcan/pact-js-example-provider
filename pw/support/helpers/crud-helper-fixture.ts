// pw/support/helpers/crud-helper-fixtures.ts

import { test as baseApiRequestFixture } from './api-request-fixture'
import type { Movie } from '@prisma/client'
import type { ApiRequestResponse } from './api-request-fixture'

// Common headers function
const commonHeaders = (token: string) => ({
  Authorization: token
})

// Define the ServerResponse type
export type ServerResponse<T> = {
  status: number
  data: T
}

export const test = baseApiRequestFixture.extend<{
  addMovie: (
    token: string,
    body: Omit<Movie, 'id'>
  ) => Promise<ApiRequestResponse<ServerResponse<Movie>>>
  getAllMovies: (
    token: string
  ) => Promise<ApiRequestResponse<ServerResponse<Movie[]>>>
  getMovieById: (
    token: string,
    id: number
  ) => Promise<ApiRequestResponse<ServerResponse<Movie>>>
  getMovieByName: (
    token: string,
    name: string
  ) => Promise<ApiRequestResponse<ServerResponse<Movie[]>>>
  updateMovie: (
    token: string,
    id: number,
    body: Partial<Movie>
  ) => Promise<ApiRequestResponse<ServerResponse<Movie>>>
  deleteMovie: (
    token: string,
    id: number
  ) => Promise<ApiRequestResponse<ServerResponse<void>>>
}>({
  addMovie: async ({ apiRequest }, use) => {
    const addMovie = async (token: string, body: Omit<Movie, 'id'>) => {
      return apiRequest<ServerResponse<Movie>>({
        method: 'POST',
        url: '/movies',
        body,
        headers: commonHeaders(token)
      })
    }

    await use(addMovie)
  },

  getAllMovies: async ({ apiRequest }, use) => {
    const getAllMovies = async (token: string) => {
      return apiRequest<ServerResponse<Movie[]>>({
        method: 'GET',
        url: '/movies',
        headers: commonHeaders(token)
      })
    }

    await use(getAllMovies)
  },

  getMovieById: async ({ apiRequest }, use) => {
    const getMovieById = async (token: string, id: number) => {
      return apiRequest<ServerResponse<Movie>>({
        method: 'GET',
        url: `/movies/${id}`,
        headers: commonHeaders(token)
      })
    }

    await use(getMovieById)
  },

  getMovieByName: async ({ apiRequest }, use) => {
    const getMovieByName = async (token: string, name: string) => {
      // Construct the query parameters manually
      const queryParams = new URLSearchParams({ name }).toString()
      const url = `/movies?${queryParams}` // Append the query string to the endpoint

      return apiRequest<ServerResponse<Movie[]>>({
        method: 'GET',
        url, // Pass the constructed URL
        headers: commonHeaders(token)
      })
    }

    await use(getMovieByName)
  },

  updateMovie: async ({ apiRequest }, use) => {
    const updateMovie = async (
      token: string,
      id: number,
      body: Partial<Movie>
    ) => {
      return apiRequest<ServerResponse<Movie>>({
        method: 'PUT',
        url: `/movies/${id}`,
        body,
        headers: commonHeaders(token)
      })
    }

    await use(updateMovie)
  },

  deleteMovie: async ({ apiRequest }, use) => {
    const deleteMovie = async (token: string, id: number) => {
      return apiRequest<ServerResponse<void>>({
        method: 'DELETE',
        url: `/movies/${id}`,
        headers: commonHeaders(token)
      })
    }

    await use(deleteMovie)
  }
})
