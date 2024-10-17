import type { z } from 'zod'
import type {
  // Schemas for entities
  ActorSchema,
  GenreSchema,
  MovieSchema,
  // Request Schemas
  CreateMovieSchema,
  UpdateMovieSchema,
  // Response Schemas
  CreateMovieResponseSchema,
  UpdateMovieResponseSchema,
  GetMovieResponseSchema,
  GetMoviesResponseSchema,
  DeleteMovieResponseSchema,
  // Error Schemas
  ConflictMovieResponseSchema,
  MovieNotFoundResponseSchema,
  ActorNotFoundResponseSchema,
  GenreNotFoundResponseSchema
} from './schema'

// Zod Key feature 2: link the schemas to the types

// Entity Types
export type Actor = z.infer<typeof ActorSchema>
export type Genre = z.infer<typeof GenreSchema>
export type Movie = z.infer<typeof MovieSchema>

// Request Types
export type CreateMovieRequest = z.infer<typeof CreateMovieSchema>
export type UpdateMovieRequest = z.infer<typeof UpdateMovieSchema>

// Response Types
export type CreateMovieResponse = z.infer<typeof CreateMovieResponseSchema>
export type UpdateMovieResponse = z.infer<typeof UpdateMovieResponseSchema>
export type GetMovieResponse = z.infer<typeof GetMovieResponseSchema>
export type GetMoviesResponse = z.infer<typeof GetMoviesResponseSchema>
export type DeleteMovieResponse = z.infer<typeof DeleteMovieResponseSchema>

// Error Response Types
export type ConflictMovieResponse = z.infer<typeof ConflictMovieResponseSchema>
export type MovieNotFoundResponse = z.infer<typeof MovieNotFoundResponseSchema>
export type ActorNotFoundResponse = z.infer<typeof ActorNotFoundResponseSchema>
export type GenreNotFoundResponse = z.infer<typeof GenreNotFoundResponseSchema>
