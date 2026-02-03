import { StartServer } from '@tanstack/react-start/server'
import { createRouter } from './router'

export default function handler() {
  return StartServer({ router: createRouter() })
}
