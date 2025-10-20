# Claude Instructions for crew-image-creator

## Project Overview
This is a crew image creator application being refactored from an older codebase to use TanStack Start, with a focus on code cleanup and modernization.

## Tech Stack & Framework Preferences
- **Frontend**: React 19 with TypeScript
- **Backend**: TanStack Start (full-stack React framework)
- **Database**: PostgreSQL with Prisma ORM
- **API Layer**: tRPC (type-safe APIs)
- **Router**: TanStack Router (file-based routing)
- **Data Fetching**: TanStack Query (with tRPC integration)
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **Testing**: Vitest + Testing Library
- **Validation**: Zod schemas

## Code Style & Conventions
- Use functional components with hooks
- Prefer TypeScript strict mode
- Use ES6+ features and modern JavaScript patterns
- Follow the existing TanStack conventions from the template
- Keep components small and focused
- Use meaningful variable and function names

## File Organization
- Routes go in `src/routes/` (file-based routing)
- API routes in `src/routes/api/`
- Components in `src/components/`
- tRPC routers in `src/server/routers/`
- Database setup in `src/lib/prisma.ts`
- tRPC client setup in `src/lib/trpc-client.ts`
- Utilities in `src/utils/`
- Types in `src/types/`
- Database schema in `prisma/schema.prisma`

## Development Workflow
- Always run linting/formatting after changes: `npm run check`
- Run tests before committing: `npm run test`
- Use `npm run dev` for development server

## Refactoring Guidelines
- Prioritize cleaning up and modernizing existing code
- Remove any demo/template files that aren't needed
- Migrate older patterns to modern React/TanStack approaches
- Ensure all code is TypeScript compliant
- Focus on maintainability and readability

## Commands to Remember
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run ESLint
npm run format       # Run Prettier
npm run check        # Format + lint fix

# Database commands
npx prisma dev       # Start local Prisma Postgres server
npx prisma generate  # Generate Prisma client
npx prisma migrate dev # Run database migrations
npx prisma studio    # Open Prisma Studio (database GUI)
```

## Database Schema
Current models:
- **User**: Basic user information (id, email, name)
- **CrewImage**: Image records with title, description, imageUrl, linked to users

## tRPC Usage Examples
```typescript
// In components, use the trpc hooks:
const { data: images } = trpc.crewImage.getAll.useQuery()
const createImage = trpc.crewImage.create.useMutation()

// Type-safe API calls with full autocomplete
await createImage.mutateAsync({
  title: "My Image",
  description: "Image description",
  userId: 1
})
```

## Notes
- This project is being refactored from an older application
- Focus on code cleanup and modernization
- Database runs locally via Prisma Postgres server
- All API calls are type-safe through tRPC
- Delete demo files as mentioned in README when appropriate