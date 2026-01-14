import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { trpc } from '../lib/trpc-client'
import { TemplateSelector } from '../components/TemplateSelector'
import { useAuth } from '../lib/auth-context'
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
  const { user } = useAuth()
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [colorMode, setColorMode] = useState<'club' | 'custom'>('club')
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const [primaryColor, setPrimaryColor] = useState<string>('#FFFFFF')
  const [secondaryColor, setSecondaryColor] = useState<string>('#FFFFFF')
  const [crewError, setCrewError] = useState(false)
  const [templateError, setTemplateError] = useState(false)
  const [colorError, setColorError] = useState(false)

  const { data: crews, isLoading: crewsLoading } = trpc.crew.getAll.useQuery()
  const { data: clubs, isLoading: clubsLoading } = trpc.club.getAll.useQuery()
  const { data: selectedCrews } = trpc.crew.getByIds.useQuery(
    { ids: selectedCrewIds },
    { enabled: selectedCrewIds.length > 0 },
  )
  const { data: selectedTemplate } = trpc.template.getById.useQuery(
    { id: selectedTemplateId },
    { enabled: !!selectedTemplateId },
  )
  const { data: selectedClub } = trpc.club.getById.useQuery(
    { id: selectedClubId },
    { enabled: !!selectedClubId },
  )

  const generateImageMutation = trpc.savedImage.generate.useMutation({
    onSuccess: (data) => {
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

  // Auto-select Auriol Kensington club and crews with different boat sizes for testing
  useEffect(() => {
    if (clubs && crews && !selectedClubId && selectedCrewIds.length === 0) {
      // Find Auriol Kensington club
      const auriolClub = clubs.find(club =>
        club.name.toLowerCase().includes('auriol') &&
        club.name.toLowerCase().includes('kensington')
      )

      if (auriolClub) {
        setSelectedClubId(auriolClub.id)
      }

      // Select crews with different boat sizes: 8+, 4x, 4-, 4+, 2-, 2x, 1x
      const targetBoatTypes = ['8+', '4x', '4-', '4+', '2-', '2x', '1x']
      const selectedCrewsByBoatType: string[] = []

      // Find one crew for each boat type
      targetBoatTypes.forEach(boatType => {
        const crew = crews.find(c =>
          c.boatType?.code === boatType &&
          !selectedCrewsByBoatType.includes(c.id)
        )
        if (crew) {
          selectedCrewsByBoatType.push(crew.id)
        }
      })

      if (selectedCrewsByBoatType.length > 0) {
        setSelectedCrewIds(selectedCrewsByBoatType)
      }
    }
  }, [clubs, crews, selectedClubId, selectedCrewIds.length])

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

    // Determine colors to use
    let colors = undefined
    if (colorMode === 'custom') {
      colors = {
        primaryColor,
        secondaryColor,
      }
    } else if (selectedClub) {
      colors = {
        primaryColor: selectedClub.primaryColor,
        secondaryColor: selectedClub.secondaryColor,
      }
    }

    // Use batch generation if multiple crews selected, otherwise single generation
    if (selectedCrewIds.length === 1) {
      generateImageMutation.mutate({
        crewId: selectedCrewIds[0],
        templateId: selectedTemplateId,
        userId,
        clubId: selectedClubId || undefined,
        colors,
      })
    } else {
      setGenerationProgress({ current: 0, total: selectedCrewIds.length })
      generateBatchMutation.mutate({
        crewIds: selectedCrewIds,
        templateId: selectedTemplateId,
        userId,
        clubId: selectedClubId || undefined,
        colors,
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

    // Check color requirements
    const hasClubColors = colorMode === 'club' && selectedClubId
    const hasCustomColors = colorMode === 'custom' && primaryColor && secondaryColor

    if (!hasClubColors && !hasCustomColors) {
      setColorError(true)
      document.querySelector('[data-section="colors"]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
      setTimeout(() => setColorError(false), 3000) // Clear error after 3 seconds
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
    setColorError(false)
    setTemplateError(false)
    handleGenerateImage()
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">

          <div className="space-y-8">
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
                          setSelectedClubId('')
                          setPrimaryColor('#FFFFFF')
                          setSecondaryColor('#FFFFFF')
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
              ) : crews && crews.length > 0 ? (
                <div className="max-h-64 pr-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {crews.map((crew) => (
                      <div
                        key={crew.id}
                        className={`generate-crew-card ${
                          selectedCrewIds.includes(crew.id) ? 'selected' : ''
                        }`}
                        onClick={() => {
                          const isSelected = selectedCrewIds.includes(crew.id)

                          if (isSelected) {
                            // Remove from selection
                            setSelectedCrewIds(prev => prev.filter(id => id !== crew.id))

                            // If this was the only crew selected and had club colors, clear them
                            if (selectedCrewIds.length === 1 && crew.club?.id === selectedClubId) {
                              setSelectedClubId('')
                              setPrimaryColor('#FFFFFF')
                              setSecondaryColor('#FFFFFF')
                            }
                          } else {
                            // Add to selection
                            setSelectedCrewIds(prev => [...prev, crew.id])

                            // Auto-select club colors if this is the first crew and it has an associated club
                            if (selectedCrewIds.length === 0 && crew.club) {
                              setColorMode('club')
                              setSelectedClubId(crew.club.id)
                              setPrimaryColor(crew.club.primaryColor)
                              setSecondaryColor(crew.club.secondaryColor)
                            }
                          }
                          setCrewError(false)
                        }}
                      >
                        <h3 className="font-medium text-gray-900 mb-1 text-sm">
                          {crew.boatType.code === '1x' && crew.crewNames && crew.crewNames.length > 0
                            ? crew.crewNames[0]
                            : crew.name}
                        </h3>
                        <div className="space-y-0.5 text-xs text-gray-600">
                          <p>Boat: {crew.boatType.name}</p>
                          <p className="truncate">Race: {crew.raceName || 'No race specified'}</p>
                          {crew.club && (
                            <p className="truncate">Club: {crew.club.name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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

            {/* Color Selection */}
            <section className="bg-white rounded-lg shadow p-6" data-section="colors">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Choose Colors</h2>
                <div className="flex items-center gap-6">
                  {colorError && (
                    <span className="text-red-600 text-sm font-medium animate-pulse">
                      Please select a club or set custom colors
                    </span>
                  )}
                  {/* Color mode selection */}
                  <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="colorMode"
                      value="club"
                      checked={colorMode === 'club'}
                      onChange={(e) => {
                        setColorMode(e.target.value as 'club' | 'custom')
                        setColorError(false)
                      }}
                      className="mr-2"
                    />
                    <span>Use Club Colors</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="colorMode"
                      value="custom"
                      checked={colorMode === 'custom'}
                      onChange={(e) => {
                        setColorMode(e.target.value as 'club' | 'custom')
                        setColorError(false)
                      }}
                      className="mr-2"
                    />
                    <span>Custom Colors</span>
                  </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">

                {/* Club Colors Mode */}
                {colorMode === 'club' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Select a Club
                    </h3>
                    {clubsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="h-20 bg-gray-200 rounded-md animate-pulse"
                          ></div>
                        ))}
                      </div>
                    ) : clubs && clubs.length > 0 ? (
                      <div className="max-h-64 pr-4 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {clubs.map((club) => (
                            <div
                              key={club.id}
                              className={`generate-club-card ${
                                selectedClubId === club.id ? 'selected' : ''
                              }`}
                              onClick={() => {
                                // Allow deselection if clicking the same club
                                if (selectedClubId === club.id) {
                                  setSelectedClubId('')
                                  // Reset colors to default when deselecting
                                  setPrimaryColor('#FFFFFF')
                                  setSecondaryColor('#FFFFFF')
                                } else {
                                  setSelectedClubId(club.id)
                                  setPrimaryColor(club.primaryColor)
                                  setSecondaryColor(club.secondaryColor)
                                }
                                setColorError(false)
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {club.logoUrl && (
                                  <img
                                    src={club.logoUrl}
                                    alt={`${club.name} logo`}
                                    className="w-6 h-6 object-contain flex-shrink-0"
                                  />
                                )}
                                <h4 className="font-medium text-gray-900 text-sm leading-tight min-h-[2.5rem] flex items-center justify-center text-center overflow-hidden">
                                  <span
                                    className="overflow-hidden text-center"
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      wordBreak: 'break-word'
                                    }}
                                  >
                                    {club.name}
                                  </span>
                                </h4>
                              </div>
                              <div className="flex items-center gap-1 justify-between">
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300"
                                    style={{ backgroundColor: club.primaryColor }}
                                  />
                                  <span className="text-xs text-gray-600 truncate">
                                    {club.primaryColor}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-4 h-4 rounded border border-gray-300"
                                    style={{
                                      backgroundColor: club.secondaryColor,
                                    }}
                                  />
                                  <span className="text-xs text-gray-600 truncate">
                                    {club.secondaryColor}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>
                          No clubs found. Create clubs first to use club colors.
                        </p>
                        <a
                          href="/clubs"
                          className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                        >
                          Go to Clubs →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Colors Mode */}
                {colorMode === 'custom' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Primary Color
                      </label>
                      <div className="flex gap-3 items-center">
                        <div className="relative">
                          <div
                            className="w-14 h-14 rounded-lg border-2 border-white shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                            style={{ backgroundColor: primaryColor }}
                          ></div>
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => {
                              setPrimaryColor(e.target.value)
                              setColorError(false)
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="absolute inset-0 rounded-lg border border-gray-200 pointer-events-none"></div>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => {
                              setPrimaryColor(e.target.value)
                              setColorError(false)
                            }}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-800 mb-3">
                        Secondary Color
                      </label>
                      <div className="flex gap-3 items-center">
                        <div className="relative">
                          <div
                            className="w-14 h-14 rounded-lg border-2 border-white shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                            style={{ backgroundColor: secondaryColor }}
                          ></div>
                          <input
                            type="color"
                            value={secondaryColor}
                            onChange={(e) => {
                              setSecondaryColor(e.target.value)
                              setColorError(false)
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="absolute inset-0 rounded-lg border border-gray-200 pointer-events-none"></div>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={secondaryColor}
                            onChange={(e) => {
                              setSecondaryColor(e.target.value)
                              setColorError(false)
                            }}
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
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
