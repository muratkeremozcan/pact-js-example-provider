export type MovieAction = 'created' | 'updated' | 'deleted'
type Event<T extends string> = {
  topic: `movie-${T}`
  messages: Array<{
    key: string // id as string
    value: string // serialized movie object
  }>
}
export type MovieEvent = Event<MovieAction>
