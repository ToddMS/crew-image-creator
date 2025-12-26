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

  // Advanced filtering state
  const [selectedClub, setSelectedClub] = useState<string>('')
  const [selectedBoatType, setSelectedBoatType] = useState<string>('')
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''})
  const [sortBy, setSortBy] = useState<'recent' | 'club' | 'boat' | 'name'>('recent')

  // Layout and display state
  const [layoutMode, setLayoutMode] = useState<'compact' | 'large' | 'list' | 'masonry'>('compact')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

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

    // Apply search filter (enhanced)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((image) => {
        const crewName = image.crew?.name?.toLowerCase() || ''
        const clubName = image.crew?.club?.name?.toLowerCase() || ''
        const raceName = image.crew?.raceName?.toLowerCase() || ''
        const boatType = image.crew?.boatType?.name?.toLowerCase() || ''
        const rowerNames = image.crew?.crewNames?.join(' ')?.toLowerCase() || ''

        return crewName.includes(query) ||
               clubName.includes(query) ||
               raceName.includes(query) ||
               boatType.includes(query) ||
               rowerNames.includes(query) ||
               image.crew?.id?.toLowerCase().includes(query)
      })
    }

    // Apply club filter
    if (selectedClub) {
      filtered = filtered.filter(image => image.crew?.club?.name === selectedClub)
    }

    // Apply boat type filter
    if (selectedBoatType) {
      filtered = filtered.filter(image => image.crew?.boatType?.code === selectedBoatType)
    }

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(image => {
        const imageDate = new Date(image.createdAt)
        const start = dateRange.start ? new Date(dateRange.start) : null
        const end = dateRange.end ? new Date(dateRange.end) : null

        if (start && imageDate < start) return false
        if (end && imageDate > end) return false
        return true
      })
    }

    // Apply sorting
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'club':
          return (a.crew?.club?.name || '').localeCompare(b.crew?.club?.name || '')
        case 'boat':
          return (a.crew?.boatType?.code || '').localeCompare(b.crew?.boatType?.code || '')
        case 'name':
          return (a.crew?.name || '').localeCompare(b.crew?.name || '')
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    setFilteredImages(filtered)
  }, [savedImages, searchQuery, selectedClub, selectedBoatType, dateRange, sortBy])

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

  const handleSelectByClub = (clubName: string) => {
    const clubImages = filteredImages.filter(img => img.crew?.club?.name === clubName)
    const clubImageIds = clubImages.map(img => img.id)
    const newSelected = new Set(selectedImages)

    // If all club images are selected, deselect them; otherwise select them
    const allClubSelected = clubImageIds.every(id => newSelected.has(id))
    if (allClubSelected) {
      clubImageIds.forEach(id => newSelected.delete(id))
    } else {
      clubImageIds.forEach(id => newSelected.add(id))
    }

    setSelectedImages(newSelected)
  }

  const handleSelectByBoatType = (boatType: string) => {
    const boatImages = filteredImages.filter(img => img.crew?.boatType?.code === boatType)
    const boatImageIds = boatImages.map(img => img.id)
    const newSelected = new Set(selectedImages)

    const allBoatSelected = boatImageIds.every(id => newSelected.has(id))
    if (allBoatSelected) {
      boatImageIds.forEach(id => newSelected.delete(id))
    } else {
      boatImageIds.forEach(id => newSelected.add(id))
    }

    setSelectedImages(newSelected)
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
        {/* Professional Gallery Controls */}
        <div className="gallery-controls">
          {/* Primary Search & Controls Bar */}
          <div className="primary-controls">
            <div className="search-container">
              <div className="search-input-wrapper">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <input
                  type="text"
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input-modern"
                />
                {searchQuery && (
                  <button
                    className="search-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="control-pills">
              {/* Active Filters Pills */}
              {selectedClub && (
                <div className="filter-pill">
                  <span className="pill-label">Club:</span>
                  <span className="pill-value">{selectedClub}</span>
                  <button className="pill-remove" onClick={() => setSelectedClub('')}>×</button>
                </div>
              )}

              {selectedBoatType && (
                <div className="filter-pill">
                  <span className="pill-label">Boat:</span>
                  <span className="pill-value">{selectedBoatType}</span>
                  <button className="pill-remove" onClick={() => setSelectedBoatType('')}>×</button>
                </div>
              )}

              {(dateRange.start || dateRange.end) && (
                <div className="filter-pill">
                  <span className="pill-label">Date:</span>
                  <span className="pill-value">
                    {dateRange.start || 'Any'} - {dateRange.end || 'Any'}
                  </span>
                  <button className="pill-remove" onClick={() => setDateRange({start: '', end: ''})}>×</button>
                </div>
              )}

              {/* Filter Toggle Button */}
              <button
                className={`filter-toggle ${showAdvancedSearch ? 'active' : ''}`}
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"></polygon>
                </svg>
                Filter
                {(selectedClub || selectedBoatType || dateRange.start || dateRange.end) && (
                  <span className="filter-count">
                    {[selectedClub, selectedBoatType, dateRange.start || dateRange.end].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            <div className="layout-view-controls">
              {/* Sort Dropdown */}
              <div className="sort-dropdown">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="sort-select"
                >
                  <option value="recent">Latest</option>
                  <option value="club">Club A→Z</option>
                  <option value="boat">Boat Type</option>
                  <option value="name">Crew Name</option>
                </select>
              </div>

              {/* Layout Toggle */}
              <div className="layout-toggle">
                {[
                  { key: 'compact', icon: '⊞', title: 'Compact Grid' },
                  { key: 'large', icon: '⊠', title: 'Large Grid' },
                  { key: 'list', icon: '☰', title: 'List View' },
                  { key: 'masonry', icon: '⋮', title: 'Masonry' }
                ].map(layout => (
                  <button
                    key={layout.key}
                    className={`layout-btn ${layoutMode === layout.key ? 'active' : ''}`}
                    onClick={() => setLayoutMode(layout.key as any)}
                    title={layout.title}
                  >
                    {layout.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedSearch && (
            <div className="advanced-filters-panel">
              <div className="filters-header">
                <h3>Advanced Filters</h3>
                <button
                  className="clear-all-btn"
                  onClick={() => {
                    setSelectedClub('')
                    setSelectedBoatType('')
                    setDateRange({start: '', end: ''})
                    setSortBy('recent')
                  }}
                >
                  Clear all
                </button>
              </div>

              <div className="filters-grid">
                <div className="filter-section">
                  <h4 className="section-title">Club</h4>
                  <div className="filter-options">
                    {Array.from(new Set(savedImages.map(img => img.crew?.club?.name).filter(Boolean))).map(club => (
                      <button
                        key={club}
                        className={`option-btn ${selectedClub === club ? 'selected' : ''}`}
                        onClick={() => setSelectedClub(selectedClub === club ? '' : club)}
                      >
                        {club}
                        {selectedClub === club && <span className="selected-check">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h4 className="section-title">Boat Type</h4>
                  <div className="filter-options">
                    {Array.from(new Set(savedImages.map(img => img.crew?.boatType?.code).filter(Boolean))).map(boat => (
                      <button
                        key={boat}
                        className={`option-btn ${selectedBoatType === boat ? 'selected' : ''}`}
                        onClick={() => setSelectedBoatType(selectedBoatType === boat ? '' : boat)}
                      >
                        {boat}
                        {selectedBoatType === boat && <span className="selected-check">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="filter-section">
                  <h4 className="section-title">Date Range</h4>
                  <div className="date-range-inputs">
                    <div className="date-input-group">
                      <label>From</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                        className="date-input-modern"
                      />
                    </div>
                    <div className="date-input-group">
                      <label>To</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                        className="date-input-modern"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Bar */}
          <div className="results-bar">
            <div className="results-info">
              <span className="results-count">{filteredImages.length}</span>
              <span className="results-label">
                {filteredImages.length === 1 ? 'image' : 'images'}
              </span>
              {selectedImages.size > 0 && (
                <>
                  <span className="separator">•</span>
                  <span className="selected-count">{selectedImages.size} selected</span>
                </>
              )}
            </div>

            <div className="results-actions">
              {selectedImages.size > 0 && (
                <div className="batch-actions">
                  <button className="action-btn download-btn" onClick={handleBatchDownload}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7,10 12,15 17,10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download ({selectedImages.size})
                  </button>
                  <button className="action-btn delete-btn" onClick={handleBatchDelete}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                    </svg>
                    Delete ({selectedImages.size})
                  </button>
                </div>
              )}

              <button className="select-all-btn" onClick={handleSelectAll}>
                {selectedImages.size === filteredImages.length ? 'Deselect All' : 'Select All'}
              </button>

              <a href="/generate" className="generate-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                Generate New
              </a>
            </div>
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
          <div className={`gallery-grid layout-${layoutMode}`}>
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
                          title={`Primary: ${image.crew.club.primaryColor}`}
                        />
                        <div
                          className="color-swatch"
                          style={{
                            backgroundColor: image.crew.club.secondaryColor,
                          }}
                          title={`Secondary: ${image.crew.club.secondaryColor}`}
                        />
                      </div>
                    </div>
                  )}
                  <div className="image-subtitle">
                    {image.crew?.boatType.code || 'Unknown Boat'}
                    {image.crew?.raceName && ` • ${image.crew.raceName}`}
                  </div>

                  {/* Enhanced Metadata */}
                  <div className="image-metadata">
                    <div className="metadata-row">
                      <span className="metadata-label">Created:</span>
                      <span className="metadata-value">{new Date(image.createdAt).toLocaleDateString()}</span>
                    </div>
                    {image.metadata?.width && image.metadata?.height && (
                      <div className="metadata-row">
                        <span className="metadata-label">Resolution:</span>
                        <span className="metadata-value">{image.metadata.width}x{image.metadata.height}</span>
                      </div>
                    )}
                    {image.template?.name && (
                      <div className="metadata-row">
                        <span className="metadata-label">Template:</span>
                        <span className="metadata-value" title={image.template.name}>
                          {image.template.templateType || 'Unknown'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hover Actions */}
                  <div className="image-actions-hover">
                    <div className="action-group">
                      <button
                        className="action-btn download"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(image)
                        }}
                        title="Download Image"
                      >
                        ⬇
                      </button>
                      <button
                        className="action-btn copy"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(image.imageUrl)
                          alert('Image URL copied to clipboard!')
                        }}
                        title="Copy Link"
                      >
                        📋
                      </button>
                      <button
                        className="action-btn regenerate"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Navigate to generate page with crew pre-selected
                          window.location.href = `/generate?crew=${image.crew?.id}`
                        }}
                        title="Regenerate with this crew"
                      >
                        🔄
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteImage(image)
                        }}
                        title="Delete Image"
                      >
                        🗑
                      </button>
                    </div>
                  </div>

                  {/* Fallback Actions for Mobile */}
                  <div className="image-actions-mobile">
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

        {/* Floating Action Bar */}
        <div className="floating-actions">
          <button
            className="fab fab-secondary"
            onClick={() => {
              const zip = confirm('Export all visible images as ZIP file?')
              if (zip && filteredImages.length > 0) {
                filteredImages.forEach((image, index) => {
                  setTimeout(() => handleDownload(image), index * 200)
                })
              }
            }}
            title="Export All Images"
          >
            📦
          </button>

          <a
            href="/generate"
            className="fab fab-primary"
            title="Generate New Image"
          >
            ✨
          </a>
        </div>
      </div>
    </div>
  )
}
