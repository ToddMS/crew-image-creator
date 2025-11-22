# CLAUDE.md - RowGram Development Guide

> **⚡ Modern TanStack Start Project Setup**
>
> This is a production-ready rowing crew image generator built with the latest TanStack ecosystem for maximum type safety, performance, and developer experience.

## 🚀 Quick Start Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build           # Production build
npm run preview         # Preview production build

# Quality Assurance
npm run lint            # ESLint checking
npm run format          # Prettier formatting
npm run typecheck       # TypeScript checking
npm run test            # Run test suite

# Database
npx prisma generate     # Generate Prisma client
npx prisma dev          # Start local Postgres + run migrations
npx prisma studio       # Database admin UI
npx prisma migrate dev  # Create & apply migrations

# Production Deployment
npm run deploy          # Deploy to production
```

## 🏗️ Architecture Overview

### Core Stack
- **Framework**: TanStack Start (Full-stack React with SSR)
- **Database**: PostgreSQL + Prisma ORM
- **API**: tRPC for end-to-end type safety
- **UI**: React 19 + Tailwind CSS v4
- **State**: TanStack Query + TanStack Router
- **Auth**: NextAuth.js integration
- **Testing**: Vitest + Testing Library

### Project Structure
```
src/
├── app/                     # App configuration & root providers
│   ├── router.tsx          # Router configuration
│   └── providers.tsx       # Context providers setup
├── components/             # Reusable UI components
│   ├── ui/                 # Base design system components
│   └── forms/              # Form-specific components
├── features/              # Domain-specific feature modules
│   ├── crews/             # Crew management
│   ├── clubs/             # Club presets
│   ├── gallery/           # Image gallery
│   └── auth/              # Authentication
├── lib/                   # Shared utilities & integrations
│   ├── db.ts              # Prisma client
│   ├── trpc.ts            # tRPC client setup
│   └── utils.ts           # Helper functions
├── server/                # Backend API & server functions
│   ├── routers/           # tRPC routers
│   └── middleware/        # Server middleware
├── styles/                # Organized styling
│   ├── globals.css        # Base styles
│   └── components.css     # Component-specific styles
└── types/                 # TypeScript definitions
```

## 📋 Development Guidelines

### Code Style & Conventions
- **TypeScript**: Strict mode enabled, prefer explicit types
- **Components**: Functional components with hooks only
- **File Naming**: kebab-case for files, PascalCase for components
- **Import Order**: External → Internal → Relative imports
- **Error Handling**: Proper error boundaries and loading states

### Git Workflow
```bash
# Feature development
git checkout -b feature/crew-management
git add .
git commit -m "feat: add crew management functionality"
git push origin feature/crew-management

# Production deployment
git checkout main
git pull origin main
git push origin main  # Triggers deployment
```

## 🔧 Configuration Files

### Environment Variables
Create `.env.local` for development:
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/rowgram"

# Auth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

For production, use `.env.production`:
```env
DATABASE_URL="your-production-db-url"
NEXTAUTH_URL="https://yourdomain.com"
```

## 🎯 Feature Development Patterns

### Adding a New Feature
1. Create feature directory in `src/features/`
2. Implement tRPC router in `src/server/routers/`
3. Create UI components in feature directory
4. Add routes in `src/routes/`
5. Write tests and documentation

### tRPC API Pattern
```typescript
// server/routers/crew.ts
export const crewRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createCrewSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.crew.create({
        data: { ...input, userId: ctx.user.id },
      })
    }),

  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.crew.findMany({
        where: { userId: ctx.user.id },
        include: { boatType: true, club: true },
      })
    }),
})
```

### Component Pattern
```typescript
// components/CrewForm.tsx
interface CrewFormProps {
  crew?: Crew
  onSuccess: () => void
}

export function CrewForm({ crew, onSuccess }: CrewFormProps) {
  const createCrew = trpc.crew.create.useMutation()

  const handleSubmit = async (data: CrewFormData) => {
    try {
      await createCrew.mutateAsync(data)
      onSuccess()
    } catch (error) {
      // Handle error
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form implementation */}
    </form>
  )
}
```

## 🚀 Production Deployment

### Hosting Options
- **Recommended**: Vercel (Zero-config deployment)
- **Alternative**: Netlify, Railway, Docker

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm run test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Performance optimized
- [ ] Error monitoring configured

### Performance Optimization
- Route-based code splitting (automatic)
- Image optimization with Next/Image
- Database query optimization
- Caching strategies with TanStack Query
- Bundle analysis with `npm run analyze`

## 📊 Database Schema

### Core Models
- **User**: Authentication & user data
- **Club**: Club presets with branding
- **Crew**: Rowing crew information
- **BoatType**: Boat configurations (1x, 2x, 4x, 8+, etc.)
- **Template**: Image generation templates
- **SavedImage**: Generated image records

### Relationships
```prisma
// Key relationships
User -> Crews (one-to-many)
User -> Clubs (one-to-many)
Crew -> Club (many-to-one, optional)
Crew -> BoatType (many-to-one)
Crew -> SavedImages (one-to-many)
```

## 🛡️ Security & Best Practices

### Authentication
- Session-based auth with NextAuth.js
- Protected routes with middleware
- CSRF protection enabled
- Secure cookie configuration

### Data Validation
- Input validation with Zod schemas
- Server-side validation for all endpoints
- Sanitization of user inputs
- Rate limiting on API routes

### Error Handling
- Global error boundary
- Graceful fallbacks for failed requests
- User-friendly error messages
- Error logging and monitoring

## 🔍 Debugging & Monitoring

### Development Tools
- TanStack Query Devtools (data fetching)
- TanStack Router Devtools (routing)
- Prisma Studio (database)
- React DevTools
- Network debugging

### Production Monitoring
- Error tracking (Sentry recommended)
- Performance monitoring
- Database query monitoring
- User analytics

## 📚 Key Dependencies

### Core Framework
- `@tanstack/react-start`: Full-stack React framework
- `@tanstack/react-router`: Type-safe routing
- `@tanstack/react-query`: Data fetching & caching
- `@trpc/server` + `@trpc/client`: End-to-end type safety

### Database & Auth
- `prisma`: Database ORM
- `@auth/prisma-adapter`: Auth integration
- `@prisma/client`: Database client

### UI & Styling
- `react` + `react-dom`: React 19
- `tailwindcss`: Utility-first CSS
- `lucide-react`: Icon library

### Development
- `typescript`: Type checking
- `eslint` + `prettier`: Code quality
- `vitest`: Testing framework

## 🎨 Design System

### Colors
- Primary: Blue (#3B82F6)
- Secondary: Slate (#64748B)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)

### Typography
- Font: Inter (system font fallback)
- Headings: font-semibold to font-bold
- Body: font-normal
- Captions: font-medium

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow code style guidelines
4. Add tests for new functionality
5. Ensure all checks pass
6. Submit pull request

## 📞 Support

- **Issues**: GitHub Issues
- **Questions**: GitHub Discussions
- **Documentation**: `/docs` directory

---

> **🎯 Goal**: Create professional rowing crew images with modern web technologies
>
> **🏁 Status**: Production-ready with comprehensive feature set