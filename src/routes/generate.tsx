import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '../lib/trpc-client'
import { TemplateSelector } from '../components/TemplateSelector'

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
  const [selectedCrewId, setSelectedCrewId] = useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [colorMode, setColorMode] = useState<'club' | 'custom'>('club')
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const [primaryColor, setPrimaryColor] = useState<string>('#094E2A')
  const [secondaryColor, setSecondaryColor] = useState<string>('#F3BFD4')

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
    if (!selectedCrewId || !selectedTemplateId) {
      alert('Please select both a crew and a template')
      return
    }

    setIsGenerating(true)

    // For demo purposes, using a default user ID
    // In a real app, this would come from authentication context
    const userId = 'demo-user-id'

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
      colors,
    })
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Generate Crew Image
            </h1>
            <p className="text-gray-600 mt-2">
              Select a crew and template to generate your rowing crew image
            </p>
          </div>

          <div className="space-y-8">
            {/* Crew Selection */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Select Crew</h2>

              {crewsLoading ? (
                <div className="animate-pulse">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="h-32 bg-gray-200 rounded-lg"
                      ></div>
                    ))}
                  </div>
                </div>
              ) : crews && crews.length > 0 ? (
                <div className="max-h-80 pr-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {crews.map((crew) => (
                      <div
                        key={crew.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedCrewId === crew.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedCrewId(crew.id)}
                      >
                        <h3 className="font-medium text-gray-900 mb-2">
                          {crew.name}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>Boat: {crew.boatType.name}</p>
                          <p>Race: {crew.raceName || 'No race specified'}</p>
                          {crew.club && (
                            <div className="flex items-center gap-2">
                              <span>Club: {crew.club.name}</span>
                              <div className="flex gap-1">
                                <div
                                  className="w-3 h-3 rounded-full border border-gray-300"
                                  style={{
                                    backgroundColor: crew.club.primaryColor,
                                  }}
                                />
                                <div
                                  className="w-3 h-3 rounded-full border border-gray-300"
                                  style={{
                                    backgroundColor: crew.club.secondaryColor,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="text-xs text-gray-500">
                            {crew.crewNames?.length || 0} rower
                            {(crew.crewNames?.length || 0) !== 1 ? 's' : ''}
                          </p>
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
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Choose Colors</h2>

              <div className="space-y-6">
                {/* Color mode selection */}
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="colorMode"
                      value="club"
                      checked={colorMode === 'club'}
                      onChange={(e) =>
                        setColorMode(e.target.value as 'club' | 'custom')
                      }
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
                      onChange={(e) =>
                        setColorMode(e.target.value as 'club' | 'custom')
                      }
                      className="mr-2"
                    />
                    <span>Custom Colors</span>
                  </label>
                </div>

                {/* Club Colors Mode */}
                {colorMode === 'club' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Select a Club
                    </h3>
                    {clubsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="h-32 bg-gray-200 rounded-lg animate-pulse"
                          ></div>
                        ))}
                      </div>
                    ) : clubs && clubs.length > 0 ? (
                      <div className="max-h-80 pr-4 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {clubs.map((club) => (
                            <div
                              key={club.id}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedClubId === club.id
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                setSelectedClubId(club.id)
                                setPrimaryColor(club.primaryColor)
                                setSecondaryColor(club.secondaryColor)
                              }}
                            >
                              <div className="flex items-center gap-3 mb-3">
                                {club.logoUrl && (
                                  <img
                                    src={club.logoUrl}
                                    alt={`${club.name} logo`}
                                    className="w-8 h-8 object-contain"
                                  />
                                )}
                                <h4 className="font-medium text-gray-900">
                                  {club.name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{ backgroundColor: club.primaryColor }}
                                />
                                <span className="text-xs text-gray-600">
                                  {club.primaryColor}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{
                                    backgroundColor: club.secondaryColor,
                                  }}
                                />
                                <span className="text-xs text-gray-600">
                                  {club.secondaryColor}
                                </span>
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Current colors preview */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">Current Colors:</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className="text-sm">Primary: {primaryColor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: secondaryColor }}
                      />
                      <span className="text-sm">
                        Secondary: {secondaryColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Template Selection */}
            <section className="bg-white rounded-lg shadow p-6">
              <TemplateSelector
                selectedTemplateId={selectedTemplateId}
                onTemplateSelect={setSelectedTemplateId}
              />
            </section>

            {/* Preview & Generate */}
            {selectedCrewId && selectedTemplateId && (
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Preview & Generate
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Selected crew info */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      Selected Crew
                    </h3>
                    {selectedCrew && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">
                          {selectedCrew.name}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>Boat: {selectedCrew.boatType.name}</p>
                          <p>
                            Race: {selectedCrew.raceName || 'No race specified'}
                          </p>
                          {selectedCrew.club && (
                            <p>Club: {selectedCrew.club.name}</p>
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Rowers:
                          </p>
                          <div className="text-sm text-gray-600">
                            {selectedCrew.crewNames?.map((rowerName, index) => (
                              <span key={index}>
                                {rowerName}
                                {index <
                                (selectedCrew.crewNames?.length || 0) - 1
                                  ? ', '
                                  : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected template info */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">
                      Selected Template
                    </h3>
                    {selectedTemplate && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">
                          {selectedTemplate.name}
                        </h4>
                        <p className="text-sm text-gray-600 capitalize mb-3">
                          {selectedTemplate.templateType} style
                        </p>
                        {selectedTemplate.metadata && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Colors:</span>
                            <div className="flex gap-1">
                              {selectedTemplate.metadata.primaryColor && (
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{
                                    backgroundColor:
                                      selectedTemplate.metadata.primaryColor,
                                  }}
                                />
                              )}
                              {selectedTemplate.metadata.secondaryColor && (
                                <div
                                  className="w-4 h-4 rounded-full border border-gray-300"
                                  style={{
                                    backgroundColor:
                                      selectedTemplate.metadata.secondaryColor,
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Generate button */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleGenerateImage}
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
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
