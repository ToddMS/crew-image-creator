import { Auth } from '@auth/core'
import { authConfig } from '~/lib/auth'

export async function GET({ request }: { request: Request }) {
  return await Auth(request, authConfig)
}

export async function POST({ request }: { request: Request }) {
  return await Auth(request, authConfig)
}