import { useState } from 'react'
import { trpc } from '../lib/trpc-client'

interface ImageGalleryProps {
  userId?: string
  className?: string
}

export function ImageGallery({ userId, className = '' }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Get all saved images, optionally filtered by user
  const { data: savedImages, isLoading, error, refetch } = userId
    ? trpc.savedImage.getByUserId.useQuery({ userId })
    : trpc.savedImage.getAll.useQuery()

  const deleteImageMutation = trpc.savedImage.delete.useMutation({
    onSuccess: () => {
      refetch()
      setIsDeleting(null)
    },
    onError: (error) => {
      alert(`Failed to delete image: ${error.message}`)
      setIsDeleting(null)
    },
  })

  const handleDeleteImage = (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      setIsDeleting(imageId)
      deleteImageMutation.mutate({ id: imageId })
    }
  }

  const handleDownloadImage = (imageUrl: string, filename: string) => {
    // For placeholder images, we'll just open in new tab
    // In a real implementation, you'd handle actual file downloads
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/3] bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          Error loading gallery: {error.message}
        </div>
      </div>
    )
  }

  if (!savedImages || savedImages.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-6xl mb-4">🖼️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-500 mb-4">
            Generate your first crew image to see it here
          </p>
          <a
            href="/generate"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Generate Image
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Image Gallery ({savedImages.length})
        </h2>
        <div className="text-sm text-gray-500">
          Click on an image to view details
        </div>
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {savedImages.map((savedImage) => (
          <div
            key={savedImage.id}
            className="group relative bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedImage(savedImage.id)}
          >
            {/* Image */}
            <div className="aspect-[4/3] rounded-t-lg overflow-hidden bg-gray-100">
              <img
                src={savedImage.imageUrl}
                alt={`${savedImage.crew?.name || 'Crew'} - ${savedImage.template?.name || 'Template'}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=Image+Not+Found`
                }}
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownloadImage(savedImage.imageUrl, savedImage.filename)
                    }}
                    className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteImage(savedImage.id)
                    }}
                    disabled={isDeleting === savedImage.id}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {isDeleting === savedImage.id ? (
                      <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Image info */}
            <div className="p-3">
              <h3 className="font-medium text-gray-900 mb-1 truncate">
                {savedImage.crew?.name || 'Unknown Crew'}
              </h3>
              <div className="space-y-1 text-xs text-gray-500">
                <p>Template: {savedImage.template?.name || 'Unknown'}</p>
                <p>Boat: {savedImage.crew?.boatType?.name || 'Unknown'}</p>
                {savedImage.crew?.club && (
                  <div className="flex items-center gap-1">
                    <span>{savedImage.crew.club.name}</span>
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 rounded-full border border-gray-300"
                        style={{ backgroundColor: savedImage.crew.club.primaryColor }}
                      />
                      <div
                        className="w-2 h-2 rounded-full border border-gray-300"
                        style={{ backgroundColor: savedImage.crew.club.secondaryColor }}
                      />
                    </div>
                  </div>
                )}
                <p>
                  {new Date(savedImage.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image details modal */}
      {selectedImage && (
        <ImageDetailsModal
          imageId={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDeleteImage}
          onDownload={handleDownloadImage}
        />
      )}
    </div>
  )
}

interface ImageDetailsModalProps {
  imageId: string
  onClose: () => void
  onDelete: (id: string) => void
  onDownload: (url: string, filename: string) => void
}

function ImageDetailsModal({ imageId, onClose, onDelete, onDownload }: ImageDetailsModalProps) {
  const { data: savedImage, isLoading } = trpc.savedImage.getById.useQuery({ id: imageId })

  if (isLoading || !savedImage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-pulse">
            <div className="w-96 h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Image Details</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image */}
            <div>
              <img
                src={savedImage.imageUrl}
                alt={`${savedImage.crew?.name} - ${savedImage.template?.name}`}
                className="w-full rounded-lg shadow-sm"
              />
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Crew Information</h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {savedImage.crew?.name || 'Unknown'}</p>
                  <p><span className="font-medium">Boat:</span> {savedImage.crew?.boatType?.name} ({savedImage.crew?.boatType?.code})</p>
                  <p><span className="font-medium">Race:</span> {savedImage.crew?.raceName || 'Not specified'}</p>
                  {savedImage.crew?.club && (
                    <div>
                      <span className="font-medium">Club:</span> {savedImage.crew.club.name}
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: savedImage.crew.club.primaryColor }}
                        />
                        <div
                          className="w-4 h-4 rounded border border-gray-300"
                          style={{ backgroundColor: savedImage.crew.club.secondaryColor }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Template Information</h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {savedImage.template?.name}</p>
                  <p><span className="font-medium">Type:</span> {savedImage.template?.templateType}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">File Information</h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                  <p><span className="font-medium">Filename:</span> {savedImage.filename}</p>
                  <p><span className="font-medium">Created:</span> {new Date(savedImage.createdAt).toLocaleString()}</p>
                  {savedImage.metadata && (
                    <>
                      {savedImage.metadata.width && savedImage.metadata.height && (
                        <p><span className="font-medium">Dimensions:</span> {savedImage.metadata.width} × {savedImage.metadata.height}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => onDownload(savedImage.imageUrl, savedImage.filename)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => {
                    onDelete(savedImage.id)
                    onClose()
                  }}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}