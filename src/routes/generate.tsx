import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { trpc } from '../lib/trpc-client'
import { TemplateSelector } from '../components/TemplateSelector'
import { SearchBar } from '../components/SearchBar'
import { useAuth } from '../lib/auth-context'
import '../components/SearchBar.css'
import '../components/Button.css'
import './generate.css'

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
    overflow-y: scroll !important;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 12px;
    margin-left: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 6px;
    margin: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 6px;
    border: 2px solid #f1f5f9;
    min-height: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: #f1f5f9;
  }
`

export const Route = createFileRoute('/generate')({
  component: GenerateImagePage,
})

function GenerateImagePage() {
  const navigate = useNavigate()
  const router = useRouter()
  const { user } = useAuth()
  const [selectedCrewIds, setSelectedCrewIds] = useState<Array<string>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [crewError, setCrewError] = useState(false)
  const [templateError, setTemplateError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCrews, setFilteredCrews] = useState<Array<any>>([])
  const [selectedClub, setSelectedClub] = useState<string>('')
  const [selectedBoatClass, setSelectedBoatClass] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('recent')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const { data: crews, isLoading: crewsLoading } = trpc.crew.getAll.useQuery()
  const { data: selectedCrews } = trpc.crew.getByIds.useQuery(
    { ids: selectedCrewIds },
    { enabled: selectedCrewIds.length > 0 },
  )
  const { data: selectedTemplate } = trpc.template.getById.useQuery(
    { id: selectedTemplateId },
    { enabled: !!selectedTemplateId },
  )

  const generateImageMutation = trpc.savedImage.generate.useMutation({
    onSuccess: () => {
      setIsGenerating(false)
      // Navigate to gallery instead of showing toast
      navigate({ to: '/gallery' })
    },
    onError: (error) => {
      setIsGenerating(false)
      alert(`Failed to generate image: ${error.message}`)
    },
  })

  const generateBatchMutation = trpc.savedImage.generateBatch.useMutation({
    onSuccess: (data) => {
      setIsGenerating(false)
      setGenerationProgress({ current: 0, total: 0 })

      if (data.successful > 0) {
        const successMsg = `Successfully generated ${data.successful} image${data.successful === 1 ? '' : 's'}`
        const errorMsg = data.failed > 0 ? `, ${data.failed} failed` : ''
        alert(`${successMsg}${errorMsg}`)
        navigate({ to: '/gallery' })
      } else {
        alert(`Failed to generate any images. ${data.errors.length} error${data.errors.length === 1 ? '' : 's'} occurred.`)
      }
    },
    onError: (error) => {
      setIsGenerating(false)
      setGenerationProgress({ current: 0, total: 0 })
      alert(`Failed to generate batch images: ${error.message}`)
    },
  })

  // Auto-select crew from navigation state if provided
  useEffect(() => {
    const routerState = router.state
    const navigationState = routerState?.location?.state as any

    if (navigationState?.selectedCrewIds && Array.isArray(navigationState.selectedCrewIds)) {
      console.log('🎯 Auto-selecting crews from navigation state:', navigationState.selectedCrewIds)
      setSelectedCrewIds(navigationState.selectedCrewIds)
    }
  }, [router.state])

  // Filter function for SearchBar
  const filterFunction = (crew: any, query: string) => {
    const crewName = crew.name?.toLowerCase() || ''
    const clubName = crew.club?.name.toLowerCase() || ''
    const raceName = crew.raceName?.toLowerCase() || ''
    const raceCategory = crew.raceCategory?.toLowerCase() || ''
    const boatTypeCode = crew.boatType.code.toLowerCase() || ''
    const boatTypeName = crew.boatType.name.toLowerCase() || ''
    const crewNames = crew.crewNames?.join(' ').toLowerCase() || ''

    return crewName.includes(query) ||
           clubName.includes(query) ||
           raceName.includes(query) ||
           raceCategory.includes(query) ||
           boatTypeCode.includes(query) ||
           boatTypeName.includes(query) ||
           crewNames.includes(query)
  }

  // Get unique values for filters
  const uniqueClubs = Array.from(new Set(crews?.map(crew => crew.club?.name).filter(Boolean))).map(club => ({
    value: club!,
    label: club!
  }))

  const uniqueBoatClasses = (() => {
    const boatClassOrder = ['8+', '4+', '4x', '4-', '2x', '2-', '1x']
    const availableClasses = Array.from(new Set(crews?.map(crew => crew.boatType.code).filter(Boolean)))

    // Sort according to specified order
    const sortedClasses = boatClassOrder.filter(boatClass => availableClasses.includes(boatClass))

    return sortedClasses.map(boatClass => ({
      value: boatClass,
      label: boatClass
    }))
  })()

  const handleGenerateImage = async () => {
    console.log('🎪 DEBUG: Frontend handleGenerateImage called with:')
    console.log('  - selectedCrewIds:', selectedCrewIds)
    console.log('  - selectedTemplateId:', selectedTemplateId)
    console.log('  - selectedCrews:', selectedCrews?.map(c => c.name))
    console.log('  - selectedTemplate:', selectedTemplate?.name)

    if (!selectedCrewIds.length || !selectedTemplateId) {
      alert('Please select at least one crew and a template')
      return
    }

    setIsGenerating(true)

    // Use authenticated user ID or fall back to undefined (backend handles demo user)
    const userId = user?.id

    // Use batch generation if multiple crews selected, otherwise single generation
    if (selectedCrewIds.length === 1) {
      generateImageMutation.mutate({
        crewId: selectedCrewIds[0],
        templateId: selectedTemplateId,
        userId,
      })
    } else {
      setGenerationProgress({ current: 0, total: selectedCrewIds.length })
      generateBatchMutation.mutate({
        crewIds: selectedCrewIds,
        templateId: selectedTemplateId,
        userId,
      })
    }
  }

  const handleGenerateClick = () => {
    // Check what's missing and scroll to the first missing requirement
    if (!selectedCrewIds.length) {
      setCrewError(true)
      document.querySelector('[data-section="crew"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      setTimeout(() => setCrewError(false), 3000) // Clear error after 3 seconds
      return
    }

    if (!selectedTemplateId) {
      setTemplateError(true)
      document.querySelector('[data-section="template"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      setTimeout(() => setTemplateError(false), 3000) // Clear error after 3 seconds
      return
    }

    // All requirements met, clear any remaining errors and proceed with generation
    setCrewError(false)
    setTemplateError(false)
    handleGenerateImage()
  }

  // Use filteredCrews from SearchBar instead of manual filtering

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">

          <div className="space-y-6">
            {/* Search Section */}
            <SearchBar
                items={crews || []}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onItemsFiltered={setFilteredCrews}
                placeholder="Search crews by name, club, race, boat type..."
                filterFunction={filterFunction}
                sortOptions={[
                  { value: 'recent', label: 'Recently Created', sortFn: (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() },
                  { value: 'club', label: 'Club Name', sortFn: (a, b) => (a.club?.name || '').localeCompare(b.club?.name || '') },
                  { value: 'race', label: 'Race Name', sortFn: (a, b) => (a.raceName || '').localeCompare(b.raceName || '') },
                  { value: 'boat_class', label: 'Boat Class', sortFn: (a, b) => a.boatType.code.localeCompare(b.boatType.code) }
                ]}
                selectedSort={sortBy}
                onSortChange={setSortBy}
                advancedFilters={[
                  {
                    name: 'club',
                    label: 'Club',
                    options: [{ value: '', label: 'All Clubs' }, ...uniqueClubs],
                    selectedValue: selectedClub,
                    onValueChange: setSelectedClub,
                    filterFn: (crew, value) => !value || crew.club?.name === value
                  },
                  {
                    name: 'boatClass',
                    label: 'Boat Class',
                    options: [{ value: '', label: 'All Boat Classes' }, ...uniqueBoatClasses],
                    selectedValue: selectedBoatClass,
                    onValueChange: setSelectedBoatClass,
                    filterFn: (crew, value) => !value || crew.boatType.code === value
                  }
                ]}
                showAdvancedFilters={showAdvancedFilters}
                onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
                resultsCount={filteredCrews.length}
                className="mb-6"
              />

            {/* Crew Selection */}
            <section className="bg-white rounded-lg shadow p-6" data-section="crew">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold">Select Crews</h2>
                  {selectedCrewIds.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {selectedCrewIds.length} crew{selectedCrewIds.length === 1 ? '' : 's'} selected
                      </span>
                      <button
                        onClick={() => {
                          setSelectedCrewIds([])
                        }}
                        className="text-xs text-red-600 hover:text-red-700 px-2 py-1 rounded border border-red-200 hover:border-red-300"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
                {crewError && (
                  <span className="text-red-600 text-sm font-medium animate-pulse">
                    Please select at least one crew
                  </span>
                )}
              </div>

              {crewsLoading ? (
                <div className="animate-pulse">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="h-20 bg-gray-200 rounded-md"
                      ></div>
                    ))}
                  </div>
                </div>
              ) : crews && crews.length > 0 && filteredCrews && filteredCrews.length > 0 ? (
                <div className="max-h-60 pr-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCrews?.map((crew) => (
                      <div
                        key={crew.id}
                        className={`generate-crew-card ${
                          selectedCrewIds.includes(crew.id) ? 'selected' : ''
                        }`}
                        onClick={() => {
                          const isSelected = selectedCrewIds.includes(crew.id)

                          if (isSelected) {
                            setSelectedCrewIds(prev => prev.filter(id => id !== crew.id))
                          } else {
                            setSelectedCrewIds(prev => [...prev, crew.id])
                          }
                          setCrewError(false)
                        }}
                      >
                        {/* Badge top right */}
                        <span className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                          {crew.boatType.code}
                        </span>

                        {/* Club logo/colors bottom right */}
                        {crew.club && (
                          <div className="absolute bottom-2 right-2">
                            {crew.club.logoUrl ? (
                              <img
                                src={crew.club.logoUrl}
                                alt={`${crew.club.name} logo`}
                                className="w-6 h-6 object-contain"
                              />
                            ) : (
                              <div className="flex gap-1">
                                <div
                                  className="w-3 h-3 rounded border border-gray-300"
                                  style={{ backgroundColor: crew.club.primaryColor }}
                                  title={crew.club.primaryColor}
                                />
                                <div
                                  className="w-3 h-3 rounded border border-gray-300"
                                  style={{ backgroundColor: crew.club.secondaryColor }}
                                  title={crew.club.secondaryColor}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Crew name spanning full width */}
                        <h3 className="font-medium text-gray-900 mb-2 text-base pr-12 -ml-1 -mt-1">
                          {crew.boatType.code === '1x' && crew.crewNames && crew.crewNames.length > 0
                            ? crew.crewNames[0]
                            : crew.name}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600 -ml-1">
                          <p className="truncate">Race: {crew.raceName || 'No race specified'}</p>
                          {crew.raceCategory && (
                            <p className="truncate">Category: {crew.raceCategory}</p>
                          )}
                          {crew.club && (
                            <p className="truncate">Club: {crew.club.name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : crews && crews.length > 0 && (!filteredCrews || filteredCrews.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No crews match your search criteria.</p>
                  <p className="text-sm mt-2">Try adjusting your search or filters.</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No crews found. Create a crew first to generate images.</p>
                  <a
                    href="/crews"
                    className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                  >
                    Go to Crews →
                  </a>
                </div>
              )}
            </section>


            {/* Template Selection */}
            <section className="bg-white rounded-lg shadow p-6" data-section="template">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Choose a Template</h3>
                {templateError && (
                  <span className="text-red-600 text-sm font-medium animate-pulse">
                    Please select a template
                  </span>
                )}
              </div>
              <TemplateSelector
                selectedTemplateId={selectedTemplateId}
                onTemplateSelect={(templateId) => {
                  setSelectedTemplateId(templateId)
                  setTemplateError(false)
                }}
                hideTitle={true}
              />
            </section>

            {/* Generate Button - Always visible */}
            <div className="flex justify-center mt-6">
              <button
                onClick={handleGenerateClick}
                disabled={isGenerating}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  isGenerating
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    {generationProgress.total > 1
                      ? `Generating ${generationProgress.current}/${generationProgress.total} images...`
                      : selectedCrewIds.length > 1
                        ? `Generating ${selectedCrewIds.length} images...`
                        : 'Generating...'
                    }
                  </div>
                ) : (
                  selectedCrewIds.length > 1
                    ? `Generate ${selectedCrewIds.length} Images`
                    : selectedCrewIds.length === 1
                      ? 'Generate Image'
                      : 'Generate Images'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
