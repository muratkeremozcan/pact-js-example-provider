import { test as base } from '@playwright/test'
import { apiRequest as apiRequestFunction } from '../fixture-helpers/plain-functions'

type ApiRequestParams = {
  method: 'POST' | 'GET' | 'PUT' | 'DELETE'
  url: string
  baseUrl?: string
  body?: Record<string, unknown> | null
  headers?: Record<string, string>
}

export type ApiRequestResponse<T = unknown> = {
  status: number
  body: T
}

export const test = base.extend<{
  apiRequest: <T = unknown>(
    params: ApiRequestParams
  ) => Promise<ApiRequestResponse<T>>
}>({
  apiRequest: async ({ request }, use) => {
    const apiRequest = async <T = unknown>({
      method,
      url,
      baseUrl,
      body = null,
      headers
    }: ApiRequestParams): Promise<ApiRequestResponse<T>> => {
      const response = await apiRequestFunction({
        request,
        method,
        url,
        baseUrl,
        body,
        headers
      })

      return {
        status: response.status,
        body: response.body as T
      }
    }

    await use(apiRequest)
  }
})
