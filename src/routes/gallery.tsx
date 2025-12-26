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
          image.crew.name.toLowerCase().includes(query) ||
          image.template.name.toLowerCase().includes(query) ||
          image.crew.id.toLowerCase().includes(query),
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

                <div
                  className="image-preview"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFullscreenImage(image)
                  }}
                >
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
                  {image.crew?.club && (
                    <div className="club-info">
                      <span className="club-name-prominent">{image.crew.club.name}</span>
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
                  <div className="image-subtitle">
                    {image.crew?.boatType.code || 'Unknown Boat'}
                    {image.crew?.raceName && ` • ${image.crew.raceName}`}
                  </div>
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

        {/* Fullscreen Modal - Simplified */}
        {fullscreenImage && (
          <div
            className="modal-overlay"
            onClick={() => setFullscreenImage(null)}
            style={{
              position: 'fixed',
              inset: '0',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: '9999',
              padding: '1rem'
            }}
          >
            {/* Header with image name and close button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '1rem',
                maxWidth: '1536px'
              }}
            >
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: 'white',
                  margin: '0'
                }}
              >
                {fullscreenImage.crew?.name || 'Unknown Crew'}
              </h2>
              <button
                onClick={() => setFullscreenImage(null)}
                style={{
                  padding: '0.5rem',
                  color: 'white',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '2rem',
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.color = '#d1d5db'}
                onMouseOut={(e) => e.target.style.color = 'white'}
              >
                ×
              </button>
            </div>

            {/* Full-size image */}
            <div
              style={{
                flex: '1',
                width: '100%',
                maxWidth: '1536px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={fullscreenImage.imageUrl}
                alt={`${fullscreenImage.crew?.name} - ${fullscreenImage.template?.name}`}
                onClick={() => setFullscreenImage(null)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
