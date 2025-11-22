import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { trpc } from '../lib/trpc-client'
import './gallery.css'

export const Route = createFileRoute('/gallery')({
  component: GalleryPage,
})

interface SavedImage {
  id: string
  imageUrl: string
  filename: string
  createdAt: string
  crew?: {
    id: string
    name: string
    boatType: {
      name: string
      code: string
    }
    club?: {
      name: string
      primaryColor: string
      secondaryColor: string
    }
    raceName?: string
  }
  template?: {
    name: string
    templateType: string
  }
  metadata?: {
    width?: number
    height?: number
    colors?: {
      primaryColor?: string
      secondaryColor?: string
    }
    generatedAt?: string
  }
}

function GalleryPage() {
  // Mock user for now - in production this would come from auth context
  const user = { name: 'Demo User' }

  const [filteredImages, setFilteredImages] = useState<Array<SavedImage>>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [fullscreenImage, setFullscreenImage] = useState<SavedImage | null>(
    null,
  )
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: savedImages = [],
    isLoading: loading,
    error,
    refetch: loadImages,
  } = trpc.savedImage.getAll.useQuery()

  const deleteImageMutation = trpc.savedImage.delete.useMutation({
    onSuccess: () => {
      loadImages()
    },
    onError: (error) => {
      alert(`Failed to delete image: ${error.message}`)
    },
  })

  const applyFilter = useCallback(() => {
    let filtered = [...savedImages]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (image) =>
          image.crew?.name.toLowerCase().includes(query) ||
          image.template?.name?.toLowerCase().includes(query) ||
          image.crew?.id.toLowerCase().includes(query),
      )
    }

    // Sort by most recent first
    filtered = filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    setFilteredImages(filtered)
  }, [savedImages, searchQuery])

  useEffect(() => {
    applyFilter()
  }, [applyFilter])

  const handleDownload = async (image: SavedImage) => {
    try {
      const response = await fetch(image.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = image.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const handleImageSelect = (imageId: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId)
    } else {
      newSelected.add(imageId)
    }
    setSelectedImages(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(filteredImages.map((img) => img.id)))
    }
  }

  const handleBatchDownload = async () => {
    const selectedImagesList = savedImages.filter((img) =>
      selectedImages.has(img.id),
    )
    for (const image of selectedImagesList) {
      await handleDownload(image)
      await new Promise((resolve) => setTimeout(resolve, 500)) // Small delay between downloads
    }
    setSelectedImages(new Set())
  }

  const handleDeleteImage = async (image: SavedImage) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${image.crew?.name || 'this image'}"?\n\nThis action cannot be undone.`,
    )

    if (!isConfirmed) {
      return
    }

    try {
      await deleteImageMutation.mutateAsync({ id: image.id })
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedImages.size === 0) return
    const selectedImagesList = savedImages.filter((img) =>
      selectedImages.has(img.id),
    )
    if (selectedImagesList.length > 0) {
      const confirmMessage = `Are you sure you want to delete ${selectedImagesList.length} images? This action cannot be undone.`
      if (window.confirm(confirmMessage)) {
        try {
          for (const image of selectedImagesList) {
            await deleteImageMutation.mutateAsync({ id: image.id })
          }
          setSelectedImages(new Set())
        } catch (error) {
          console.error('Error deleting images:', error)
        }
      }
    }
  }

  // Handle ESC key to close fullscreen modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fullscreenImage) {
        setFullscreenImage(null)
      }
    }

    if (fullscreenImage) {
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [fullscreenImage])

  if (!user) {
    return (
      <div className="gallery-container">
        <div className="container">
          <div className="empty-state">
            <h2>Image Gallery</h2>
            <p>Sign in to view and manage your generated crew images</p>
            <button className="btn btn-primary">Sign In to View Gallery</button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="gallery-container">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h3>Loading your image gallery...</h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gallery-container">
      <div className="container">
        {/* Gallery Controls */}
        <div className="gallery-controls">
          <div className="gallery-search">
            <input
              type="text"
              placeholder="Search by crew name, template, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="gallery-actions">
            {selectedImages.size > 0 && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={handleBatchDownload}
                >
                  Download Selected ({selectedImages.size})
                </button>
                <button className="btn btn-danger" onClick={handleBatchDelete}>
                  Delete Selected ({selectedImages.size})
                </button>
              </>
            )}

            <button className="btn btn-secondary" onClick={handleSelectAll}>
              {selectedImages.size === filteredImages.length
                ? 'Deselect All'
                : 'Select All'}
            </button>

            <a href="/generate" className="btn btn-primary">
              Generate New Image
            </a>
          </div>
        </div>

        {/* Gallery Content */}
        {filteredImages.length === 0 ? (
          <div className="empty-state">
            <h2>No Images Yet</h2>
            <p>
              Start creating beautiful crew images by generating your first
              image
            </p>
            <a href="/generate" className="btn btn-primary">
              🎨 Generate Your First Image
            </a>
          </div>
        ) : (
          <div className="gallery-grid">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={`image-card ${selectedImages.has(image.id) ? 'selected' : ''}`}
                onClick={() => handleImageSelect(image.id)}
              >
                {/* Image Selection Checkbox */}
                <div className="image-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(image.id)}
                    onChange={() => handleImageSelect(image.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="image-preview">
                  <img
                    src={image.imageUrl}
                    alt={`${image.crew?.name || 'Crew Image'}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `https://via.placeholder.com/400x300/f3f4f6/6b7280?text=Image+Not+Found`
                    }}
                  />
                </div>

                <div className="image-info">
                  <div className="image-title">
                    {image.crew?.name || 'Unknown Crew'}
                  </div>
                  <div className="image-subtitle">
                    {image.template?.name || 'Unknown Template'} •{' '}
                    {image.crew?.boatType?.code || 'Unknown Boat'}
                  </div>
                  {image.crew?.club && (
                    <div className="club-colors">
                      <span className="club-name">{image.crew.club.name}</span>
                      <div className="color-swatches">
                        <div
                          className="color-swatch"
                          style={{
                            backgroundColor: image.crew.club.primaryColor,
                          }}
                        />
                        <div
                          className="color-swatch"
                          style={{
                            backgroundColor: image.crew.club.secondaryColor,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div className="image-date">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </div>
                  <div className="image-actions">
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(image)
                      }}
                    >
                      Download
                    </button>
                    <button
                      className="btn btn-primary btn-small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFullscreenImage(image)
                      }}
                    >
                      Preview
                    </button>
                    <button
                      className="btn btn-danger btn-small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteImage(image)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fullscreen Modal */}
        {fullscreenImage && (
          <div
            className="modal-overlay"
            onClick={() => setFullscreenImage(null)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">
                  {fullscreenImage.crew?.name || 'Image Preview'}
                </div>
                <button
                  className="modal-close"
                  onClick={() => setFullscreenImage(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <img
                  src={fullscreenImage.imageUrl}
                  alt={`${fullscreenImage.crew?.name} - ${fullscreenImage.template?.name}`}
                  className="fullscreen-image"
                />

                <div className="modal-details">
                  <div className="detail-section">
                    <h4>Crew Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">
                          {fullscreenImage.crew?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Boat:</span>
                        <span className="detail-value">
                          {fullscreenImage.crew?.boatType?.name} (
                          {fullscreenImage.crew?.boatType?.code})
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Race:</span>
                        <span className="detail-value">
                          {fullscreenImage.crew?.raceName || 'Not specified'}
                        </span>
                      </div>
                      {fullscreenImage.crew?.club && (
                        <div className="detail-item">
                          <span className="detail-label">Club:</span>
                          <span className="detail-value">
                            {fullscreenImage.crew.club.name}
                            <div className="color-swatches inline">
                              <div
                                className="color-swatch"
                                style={{
                                  backgroundColor:
                                    fullscreenImage.crew.club.primaryColor,
                                }}
                              />
                              <div
                                className="color-swatch"
                                style={{
                                  backgroundColor:
                                    fullscreenImage.crew.club.secondaryColor,
                                }}
                              />
                            </div>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Template Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">
                          {fullscreenImage.template?.name}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">
                          {fullscreenImage.template?.templateType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>File Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Filename:</span>
                        <span className="detail-value">
                          {fullscreenImage.filename}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">
                          {new Date(fullscreenImage.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {fullscreenImage.metadata?.width &&
                        fullscreenImage.metadata?.height && (
                          <div className="detail-item">
                            <span className="detail-label">Dimensions:</span>
                            <span className="detail-value">
                              {fullscreenImage.metadata.width} ×{' '}
                              {fullscreenImage.metadata.height}
                            </span>
                          </div>
                        )}
                      {fullscreenImage.metadata?.generatedAt && (
                        <div className="detail-item">
                          <span className="detail-label">Generated:</span>
                          <span className="detail-value">
                            {new Date(
                              fullscreenImage.metadata.generatedAt,
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {fullscreenImage.metadata?.colors && (
                    <div className="detail-section">
                      <h4>Color Scheme</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Primary Color:</span>
                          <span className="detail-value">
                            {fullscreenImage.metadata.colors.primaryColor}
                            <div
                              className="color-swatch"
                              style={{
                                backgroundColor:
                                  fullscreenImage.metadata.colors.primaryColor,
                              }}
                            />
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Secondary Color:</span>
                          <span className="detail-value">
                            {fullscreenImage.metadata.colors.secondaryColor}
                            <div
                              className="color-swatch"
                              style={{
                                backgroundColor:
                                  fullscreenImage.metadata.colors
                                    .secondaryColor,
                              }}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleDownload(fullscreenImage)}
                    >
                      Download
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        handleDeleteImage(fullscreenImage)
                        setFullscreenImage(null)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
