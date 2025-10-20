# Claude Instructions for crew-image-creator

## Project Overview

This is a **Rowing Crew Image Generator** - a modern full-stack web application for creating custom rowing crew images with team information, branding, and multiple template styles. The application has been successfully refactored to use TanStack Start and modern React technologies.

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

## Application Features

- **Crew Management**: Create/edit/delete rowing crews with detailed information
- **Club Presets**: Manage club configurations with custom branding colors
- **Image Generation**: Generate custom crew images using various templates
- **Gallery**: View, download, and manage generated images
- **Template System**: Multiple design templates (classic, modern, minimal, elegant)

## Database Schema

Current models (fully implemented):

- **User**: User accounts (id, email, name, preferences, timestamps)
- **Club**: Club presets (id, name, primaryColor, secondaryColor, logoUrl, userId)
- **BoatType**: Standard rowing boat types (id, name, code, seats, category)
- **Crew**: Rowing crew details (id, name, crewNames[], boatTypeId, clubId, raceName, etc.)
- **Template**: Image generation templates (id, name, templateType, previewUrl, metadata)
- **SavedImage**: Generated image records (id, filename, imageUrl, crewId, templateId, userId)

## tRPC Usage Examples

```typescript
// In components, use the trpc hooks:
const { data: crews } = trpc.crew.getAll.useQuery()
const { data: clubs } = trpc.club.getAll.useQuery()
const { data: templates } = trpc.template.getAll.useQuery()

const createCrew = trpc.crew.create.useMutation()
const generateImage = trpc.savedImage.generate.useMutation()

// Type-safe API calls with full autocomplete
await createCrew.mutateAsync({
  name: 'Oxford Blue Boat',
  crewNames: ['John Smith', 'Jane Doe', ...],
  boatTypeId: 'eight-plus-id',
  clubId: 'oxford-id',
  raceName: 'The Boat Race',
  userId: 'user-id',
})

await generateImage.mutateAsync({
  crewId: 'crew-id',
  templateId: 'template-id',
  userId: 'user-id',
})
```

## Git & Version Control

This is a local git repository with remote connected to GitHub. Current synchronization setup:

```bash
# Repository is already connected to:
# https://github.com/ToddMS/crew-image-creator

# To push changes:
git add .
git commit -m "Your commit message"
git push origin master

# To pull latest changes:
git pull origin master
```

## Current Application Status

✅ **Fully Implemented Features:**

- **Crew Management**: Complete CRUD operations for rowing crews
- **Club Management**: Full club preset system with color customization
- **Image Generation**: Template-based image generation with crew data
- **Gallery**: Generated image viewing, downloading, and management
- **Navigation**: Clean responsive navigation between all features
- **Database**: Complete PostgreSQL schema with all relationships
- **API Layer**: Type-safe tRPC endpoints for all operations

✅ **Complete Database Schema:**

- **User**: User accounts and preferences
- **Club**: Club presets with branding colors (primaryColor, secondaryColor, logoUrl)
- **BoatType**: Standard rowing boat configurations (1x, 2x, 4x, 8+, etc.)
- **Crew**: Rowing crew details with member names, boat types, club associations
- **Template**: Image generation templates with different styles
- **SavedImage**: Generated image records with metadata

✅ **API Endpoints (via tRPC):**

- `user.*` - User management operations
- `club.*` - Club preset CRUD operations
- `crew.*` - Crew management with full details
- `boatType.*` - Boat type queries
- `template.*` - Template selection and metadata
- `savedImage.*` - Image generation and management

✅ **Complete Page Structure:**

- `/` - Homepage with feature overview
- `/crews` - Crew management interface with forms
- `/clubs` - Club management with color pickers
- `/generate` - Image generation with crew/template selection
- `/gallery` - Generated image gallery with download/delete

✅ **Core Components:**

- `CrewForm.tsx` - Dynamic crew creation/editing with boat type adaptation
- `TemplateSelector.tsx` - Template browsing with previews
- `ImageGallery.tsx` - Gallery with modal details and actions
- `Navigation.tsx` - Responsive navigation with active states

✅ **Technical Implementation:**

- Type-safe end-to-end development with TypeScript + tRPC
- Real-time form validation with Zod schemas
- Responsive design with Tailwind CSS
- Proper error handling and loading states
- Color picker inputs for club branding
- Dynamic boat position management based on boat types

⚠️ **Background Processes:**

- Prisma Postgres server running locally (`npx prisma dev`)
- Development server with HMR (`npm run dev`)
- All services fully operational

🎯 **Application Ready:**

- All major features implemented and working
- Full type safety across the entire stack
- Production-ready code architecture
- Comprehensive documentation in README.md
- Ready for deployment or further feature development

## Development Notes

- Application successfully refactored to modern TanStack technologies
- All legacy code patterns replaced with current best practices
- Database schema optimized for rowing-specific use cases
- Image generation currently uses placeholder service (can be replaced with real image generation)
- All tRPC integrations working correctly with proper error handling
