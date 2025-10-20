import { router } from '../../lib/trpc'
import { userRouter } from './user'
import { crewImageRouter } from './crewImage'

export const appRouter = router({
  user: userRouter,
  crewImage: crewImageRouter,
})

export type AppRouter = typeof appRouter