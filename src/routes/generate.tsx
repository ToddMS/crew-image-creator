import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
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
  const [selectedCrewId, setSelectedCrewId] = useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [colorMode, setColorMode] = useState<'club' | 'custom'>('club')
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const [primaryColor, setPrimaryColor] = useState<string>('#FFFFFF')
  const [secondaryColor, setSecondaryColor] = useState<string>('#FFFFFF')
  const [crewError, setCrewError] = useState(false)
  const [templateError, setTemplateError] = useState(false)
  const [colorError, setColorError] = useState(false)

  const { data: crews, isLoading: crewsLoading } = trpc.crew.getAll.useQuery()
  const { data: clubs, isLoading: clubsLoading } = trpc.club.getAll.useQuery()
  const { data: selectedCrew } = trpc.crew.getById.useQuery(
    { id: selectedCrewId },
    { enabled: !!selectedCrewId },
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

  const handleGenerateImage = async () => {
    console.log('🎪 DEBUG: Frontend handleGenerateImage called with:')
    console.log('  - selectedCrewId:', selectedCrewId)
    console.log('  - selectedTemplateId:', selectedTemplateId)
    console.log('  - selectedCrew:', selectedCrew?.name)
    console.log('  - selectedTemplate:', selectedTemplate?.name)

    if (!selectedCrewId || !selectedTemplateId) {
      alert('Please select both a crew and a template')
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

    generateImageMutation.mutate({
      crewId: selectedCrewId,
      templateId: selectedTemplateId,
      userId,
      clubId: selectedClubId || undefined,
      colors,
    })
  }

  const handleGenerateClick = () => {
    // Check what's missing and scroll to the first missing requirement
    if (!selectedCrewId) {
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
                <h2 className="text-xl font-semibold">Select Crew</h2>
                {crewError && (
                  <span className="text-red-600 text-sm font-medium animate-pulse">
                    Please select a crew
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
                          selectedCrewId === crew.id ? 'selected' : ''
                        }`}
                        onClick={() => {
                          // Allow deselection if clicking the same crew
                          if (selectedCrewId === crew.id) {
                            setSelectedCrewId('')
                          } else {
                            setSelectedCrewId(crew.id)
                          }
                          setCrewError(false)
                        }}
                      >
                        <h3 className="font-medium text-gray-900 mb-1 text-sm">
                          {crew.name}
                        </h3>
                        <div className="space-y-0.5 text-xs text-gray-600">
                          <p>Boat: {crew.boatType.name}</p>
                          <p className="truncate">Race: {crew.raceName || 'No race specified'}</p>
                          {crew.club && (
                            <div className="flex items-center justify-between">
                              <span className="truncate">Club: {crew.club.name}</span>
                              <div className="flex gap-1">
                                <div
                                  className="w-2.5 h-2.5 rounded-full border border-gray-300"
                                  style={{
                                    backgroundColor: crew.club.primaryColor,
                                  }}
                                />
                                <div
                                  className="w-2.5 h-2.5 rounded-full border border-gray-300"
                                  style={{
                                    backgroundColor: crew.club.secondaryColor,
                                  }}
                                />
                              </div>
                            </div>
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
                    Generating...
                  </div>
                ) : (
                  'Generate Image'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
