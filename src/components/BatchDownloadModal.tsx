import { useState } from 'react'

interface BatchDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: (mode: 'all-together' | 'by-race' | 'by-club' | 'by-club-race' | 'covers-only' | 'images-only') => void
  analysisData: {
    totalImages: number
    raceGroups: Array<{ raceName: string; count: number }>
    clubGroups: Array<{ clubName: string; count: number }>
    hasMixedRaces: boolean
    hasMixedClubs: boolean
  }
}

export function BatchDownloadModal({
  isOpen,
  onClose,
  onProceed,
  analysisData
}: BatchDownloadModalProps) {
  const [selectedMode, setSelectedMode] = useState<'all-together' | 'by-race' | 'by-club' | 'by-club-race' | 'covers-only' | 'images-only'>('by-club-race')

  if (!isOpen) return null

  const { totalImages, raceGroups, clubGroups, hasMixedRaces, hasMixedClubs } = analysisData

  const handleProceed = () => {
    onProceed(selectedMode)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Wider, shorter modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Choose Download Option</h2>
              <p className="text-sm text-gray-600">
                {totalImages} images from {hasMixedRaces && hasMixedClubs ? `${raceGroups.length} races and ${clubGroups.length} clubs` : hasMixedRaces ? `${raceGroups.length} different races` : `${clubGroups.length} different clubs`}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Mixed {hasMixedRaces && hasMixedClubs ? 'races and clubs' : hasMixedRaces ? 'races' : 'clubs'} make it difficult to create a meaningful cover image that represents all content
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {/* Recommended: By Club + Race */}
          <label
            htmlFor="by-club-race"
            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
              selectedMode === 'by-club-race'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              id="by-club-race"
              name="download-mode"
              value="by-club-race"
              checked={selectedMode === 'by-club-race'}
              onChange={(e) => setSelectedMode(e.target.value as 'by-club-race')}
              className="sr-only"
            />
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedMode === 'by-club-race' ? 'border-green-500 bg-green-500' : 'border-gray-300'
              }`}>
                {selectedMode === 'by-club-race' && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div className="font-medium text-sm">By Club + Race</div>
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Recommended</span>
            </div>
            <div className="text-xs text-gray-600 ml-7">e.g. head-of-river-LRC.zip, bumps-CUBC.zip</div>
          </label>

          {/* By Club Only */}
          {hasMixedClubs && (
            <label
              htmlFor="by-club"
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                selectedMode === 'by-club'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                id="by-club"
                name="download-mode"
                value="by-club"
                checked={selectedMode === 'by-club'}
                onChange={(e) => setSelectedMode(e.target.value as 'by-club')}
                className="sr-only"
              />
              <div className="flex items-center mb-2">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  selectedMode === 'by-club' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {selectedMode === 'by-club' && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <div className="font-medium text-sm">By Club</div>
              </div>
              <div className="text-xs text-gray-600 ml-7">{clubGroups.length} ZIPs: lrc-crews.zip, cubc-crews.zip</div>
            </label>
          )}

          {/* By Race Only */}
          {hasMixedRaces && (
            <label
              htmlFor="by-race"
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                selectedMode === 'by-race'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                id="by-race"
                name="download-mode"
                value="by-race"
                checked={selectedMode === 'by-race'}
                onChange={(e) => setSelectedMode(e.target.value as 'by-race')}
                className="sr-only"
              />
              <div className="flex items-center mb-2">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  selectedMode === 'by-race' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {selectedMode === 'by-race' && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <div className="font-medium text-sm">By Race</div>
              </div>
              <div className="text-xs text-gray-600 ml-7">{raceGroups.length} ZIPs: head-of-river.zip, bumps.zip</div>
            </label>
          )}

          {/* All Together */}
          <label
            htmlFor="all-together"
            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
              selectedMode === 'all-together'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              id="all-together"
              name="download-mode"
              value="all-together"
              checked={selectedMode === 'all-together'}
              onChange={(e) => setSelectedMode(e.target.value as 'all-together')}
              className="sr-only"
            />
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedMode === 'all-together' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selectedMode === 'all-together' && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div className="font-medium text-sm">All Together</div>
            </div>
            <div className="text-xs text-gray-600 ml-7">Single ZIP with all images + cover</div>
          </label>

          {/* Images Only */}
          <label
            htmlFor="images-only"
            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
              selectedMode === 'images-only'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              id="images-only"
              name="download-mode"
              value="images-only"
              checked={selectedMode === 'images-only'}
              onChange={(e) => setSelectedMode(e.target.value as 'images-only')}
              className="sr-only"
            />
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedMode === 'images-only' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
              }`}>
                {selectedMode === 'images-only' && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div className="font-medium text-sm">Crew Images Only</div>
            </div>
            <div className="text-xs text-gray-600 ml-7">Lineup cards only, no covers</div>
          </label>

          {/* Covers Only */}
          <label
            htmlFor="covers-only"
            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
              selectedMode === 'covers-only'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              id="covers-only"
              name="download-mode"
              value="covers-only"
              checked={selectedMode === 'covers-only'}
              onChange={(e) => setSelectedMode(e.target.value as 'covers-only')}
              className="sr-only"
            />
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedMode === 'covers-only' ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
              }`}>
                {selectedMode === 'covers-only' && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div className="font-medium text-sm">Covers Only</div>
            </div>
            <div className="text-xs text-gray-600 ml-7">Announcement covers only</div>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  )
}