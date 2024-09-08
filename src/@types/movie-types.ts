import type { z } from 'zod'
import type {
  CreateMovieResponseSchema,
  CreateMovieSchema,
  GetMovieResponseUnionSchema
} from './schema'
// import type { Movie } from '@prisma/client'

// Zod Key feature: link the schemas to the types

export type CreateMovieRequest = z.infer<typeof CreateMovieSchema>
// export type CreateMovieRequest = Omit<Movie, 'id'>

export type CreateMovieResponse = z.infer<typeof CreateMovieResponseSchema>
// export type CreateMovieResponse = {
//   status: number
//   error?: string
//   movie?: Movie
// }

export type GetMovieResponse = z.infer<typeof GetMovieResponseUnionSchema>
// export type GetMovieResponse = Movie | null
