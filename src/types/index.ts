import type {BoatType, Club, Crew, SavedImage, Template, User} from '@prisma/client';

export type {
  Crew,
  Club,
  BoatType,
  Template,
  SavedImage,
  User,
}

export interface CrewWithRelations extends Crew {
  boatType: BoatType
  club: Club | null
  savedImages: Array<SavedImage>
}

export interface SavedImageWithRelations extends SavedImage {
  crew: CrewWithRelations
  template: Template
  user: User
}

export interface ClubWithCrew extends Club {
  crews: Array<Crew>
}

export interface CrewFormData {
  name: string
  clubName?: string
  clubId?: string
  raceName?: string
  boatName?: string
  coachName?: string
  crewNames: Array<string>
  boatTypeId: string
}

export interface ClubFormData {
  name: string
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
}

export interface ImageGenerationOptions {
  crewId: string
  templateId: string
  customization?: {
    backgroundColor?: string
    textColor?: string
    accentColor?: string
    fontSize?: number
  }
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: Array<T>
  pagination: PaginationInfo
}

export type SortOrder = 'asc' | 'desc'

export interface SortOptions {
  field: string
  order: SortOrder
}

export interface FilterOptions {
  [key: string]: any
}

export interface SearchOptions {
  query?: string
  filters?: FilterOptions
  sort?: SortOptions
  pagination?: {
    page: number
    limit: number
  }
}