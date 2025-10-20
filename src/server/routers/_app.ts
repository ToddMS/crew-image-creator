import { router } from '../../lib/trpc'
import { userRouter } from './user'
import { crewRouter } from './crew'
import { clubRouter } from './club'
import { boatTypeRouter } from './boatType'
import { templateRouter } from './template'
import { savedImageRouter } from './savedImage'

export const appRouter = router({
  user: userRouter,
  crew: crewRouter,
  club: clubRouter,
  boatType: boatTypeRouter,
  template: templateRouter,
  savedImage: savedImageRouter,
})

export type AppRouter = typeof appRouter
