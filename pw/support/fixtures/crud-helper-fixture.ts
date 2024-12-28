import type { Movie } from '@prisma/client'
import { test as baseApiRequestFixture } from './api-request-fixture'
import type { ApiRequestResponse } from './api-request-fixture'
import type {
  DeleteMovieResponse,
  CreateMovieResponse,
  GetMovieResponse,
  UpdateMovieResponse
} from '../../../src/@types'

// Common headers function
const commonHeaders = (token: string) => ({
  Authorization: token
})

export const test = baseApiRequestFixture.extend<{
  addMovie: (
    token: string,
    body: Omit<Movie, 'id'>,
    baseUrl?: string
  ) => Promise<ApiRequestResponse<CreateMovieResponse>>
  getAllMovies: (
    token: string,
    baseUrl?: string
  ) => Promise<ApiRequestResponse<GetMovieResponse>>
  getMovieById: (
    token: string,
    id: number,
    baseUrl?: string
  ) => Promise<ApiRequestResponse<GetMovieResponse>>
  getMovieByName: (
    token: string,
    name: string,
    baseUrl?: string
  ) => Promise<ApiRequestResponse<GetMovieResponse>>
  updateMovie: (
    token: string,
    id: number,
    body: Partial<Movie>,
    baseUrl?: string
  ) => Promise<ApiRequestResponse<UpdateMovieResponse>>
  deleteMovie: (
    token: string,
    id: number,
    baseUrl?: string
  ) => Promise<ApiRequestResponse<DeleteMovieResponse>>
}>({
  addMovie: async ({ apiRequest }, use) => {
    const addMovie = async (
      token: string,
      body: Omit<Movie, 'id'>,
      baseUrl?: string
    ) => {
      return apiRequest<CreateMovieResponse>({
        method: 'POST',
        url: '/movies',
        baseUrl,
        body,
        headers: commonHeaders(token)
      })
    }

    await use(addMovie)
  },

  getAllMovies: async ({ apiRequest }, use) => {
    const getAllMovies = async (token: string, baseUrl?: string) => {
      return apiRequest<GetMovieResponse>({
        method: 'GET',
        url: '/movies',
        baseUrl,
        headers: commonHeaders(token)
      })
    }

    await use(getAllMovies)
  },

  getMovieById: async ({ apiRequest }, use) => {
    const getMovieById = async (
      token: string,
      id: number,
      baseUrl?: string
    ) => {
      return apiRequest<GetMovieResponse>({
        method: 'GET',
        url: `/movies/${id}`,
        baseUrl,
        headers: commonHeaders(token)
      })
    }

    await use(getMovieById)
  },

  getMovieByName: async ({ apiRequest }, use) => {
    const getMovieByName = async (
      token: string,
      name: string,
      baseUrl?: string
    ) => {
      // Construct the query parameters manually
      const queryParams = new URLSearchParams({ name }).toString()
      const url = `/movies?${queryParams}` // Append the query string to the endpoint

      return apiRequest<GetMovieResponse>({
        method: 'GET',
        url, // Pass the constructed URL
        baseUrl,
        headers: commonHeaders(token)
      })
    }

    await use(getMovieByName)
  },

  updateMovie: async ({ apiRequest }, use) => {
    const updateMovie = async (
      token: string,
      id: number,
      body: Partial<Movie>,
      baseUrl?: string
    ) => {
      return apiRequest<UpdateMovieResponse>({
        method: 'PUT',
        url: `/movies/${id}`,
        baseUrl,
        body,
        headers: commonHeaders(token)
      })
    }

    await use(updateMovie)
  },

  deleteMovie: async ({ apiRequest }, use) => {
    const deleteMovie = async (token: string, id: number, baseUrl?: string) => {
      return apiRequest<DeleteMovieResponse>({
        method: 'DELETE',
        url: `/movies/${id}`,
        baseUrl,
        headers: commonHeaders(token)
      })
    }

    await use(deleteMovie)
  }
})
