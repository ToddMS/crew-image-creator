import { useState } from 'react'

interface BatchDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: (mode: 'no-cover' | 'group-by-race' | 'force-single') => void
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
  const [selectedMode, setSelectedMode] = useState<'no-cover' | 'group-by-race' | 'force-single'>('no-cover')

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
              <p className="text-sm text-gray-600">{totalImages} images from {hasMixedRaces ? raceGroups.length : clubGroups.length} different {hasMixedRaces ? 'races' : 'clubs'}</p>
              <p className="text-xs text-amber-700 mt-1">
                Mixed {hasMixedRaces ? 'races' : 'clubs'} make it difficult to create a meaningful cover image that represents all content
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label
            htmlFor="no-cover"
            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
              selectedMode === 'no-cover'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              id="no-cover"
              name="download-mode"
              value="no-cover"
              checked={selectedMode === 'no-cover'}
              onChange={(e) => setSelectedMode(e.target.value as 'no-cover')}
              className="sr-only"
            />
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedMode === 'no-cover' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selectedMode === 'no-cover' && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div className="font-medium text-sm">Simple ZIP</div>
            </div>
            <div className="text-xs text-gray-600 ml-7">All images, no cover</div>
          </label>

          {hasMixedRaces && (
            <label
              htmlFor="group-by-race"
              className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                selectedMode === 'group-by-race'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                id="group-by-race"
                name="download-mode"
                value="group-by-race"
                checked={selectedMode === 'group-by-race'}
                onChange={(e) => setSelectedMode(e.target.value as 'group-by-race')}
                className="sr-only"
              />
              <div className="flex items-center mb-2">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  selectedMode === 'group-by-race' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {selectedMode === 'group-by-race' && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <div className="font-medium text-sm">Separate by Race</div>
              </div>
              <div className="text-xs text-gray-600 ml-7">{raceGroups.length} ZIPs with covers</div>
            </label>
          )}

          <label
            htmlFor="force-single"
            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
              selectedMode === 'force-single'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              id="force-single"
              name="download-mode"
              value="force-single"
              checked={selectedMode === 'force-single'}
              onChange={(e) => setSelectedMode(e.target.value as 'force-single')}
              className="sr-only"
            />
            <div className="flex items-center mb-2">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                selectedMode === 'force-single' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {selectedMode === 'force-single' && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
              <div className="font-medium text-sm">Single with Cover</div>
            </div>
            <div className="text-xs text-gray-600 ml-7">One ZIP, generic cover</div>
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