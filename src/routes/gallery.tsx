import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '../lib/trpc-client'
import { SearchBar } from '../components/SearchBar'
import '../components/SearchBar.css'
import '../components/Button.css'
import './gallery.css'

export const Route = createFileRoute('/gallery')({
  component: GalleryPage,
})

interface SavedImage {
  id: string
  imageUrl: string
  filename: string
  fileSize: number | null
  dimensions: any
  metadata: any
  createdAt: Date | string
  updatedAt: Date | string
  crewId: string
  templateId: string
  userId: string
  crew?: {
    id: string
    name: string
    clubName?: string | null
    raceName?: string | null
    boatName?: string | null
    coachName?: string | null
    crewNames: Array<string>
    boatTypeId: string
    userId: string
    clubId?: string | null
    createdAt: Date | string
    updatedAt: Date | string
    boatType: {
      id: string
      name: string
      code: string
      seats: number
      category: string
      metadata: any
      createdAt: Date | string
      updatedAt: Date | string
    }
    club?: {
      id: string
      name: string
      primaryColor: string
      secondaryColor: string
      logoUrl: string | null
      createdAt: Date | string
      updatedAt: Date | string
      userId: string
    } | null
  }
  template?: {
    id: string
    name: string
    templateType: string
    previewUrl: string
    isActive: boolean
    metadata: any
    createdAt: Date | string
    updatedAt: Date | string
  }
  user: {
    id: string
    name: string
    email: string
    emailVerified: Date | null
    image: string | null
    password: string | null
    preferences: any
    createdAt: Date | string
    updatedAt: Date | string
  }
}

function GalleryPage() {

  const [filteredImages, setFilteredImages] = useState<Array<SavedImage>>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Advanced filtering state
  const [selectedClub, setSelectedClub] = useState<string>('')
  const [selectedBoatType, setSelectedBoatType] = useState<string>('')
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({start: '', end: ''})
  const [sortBy, setSortBy] = useState<'recent' | 'club' | 'boat' | 'name'>('recent')

  // Layout and display state
  const [layoutMode] = useState<'compact' | 'large' | 'list' | 'masonry'>('compact')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  const {
    data: savedImagesRaw = [],
    isLoading: loading,
    refetch: loadImages,
  } = trpc.savedImage.getAll.useQuery()

  const savedImages = (savedImagesRaw as unknown) as Array<SavedImage>

  const deleteImageMutation = trpc.savedImage.delete.useMutation({
    onSuccess: (): void => {
      loadImages()
    },
    onError: (error: { message: string }): void => {
      alert(`Failed to delete image: ${error.message}`)
    },
  })


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

  // Function removed as it was unused

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
      `Are you sure you want to delete "${
        image.crew?.boatType.code === '1x'
          ? (image.crew.crewNames[0] || image.crew.name || 'this image')
          : (image.crew?.name || 'this image')
      }"?\n\nThis action cannot be undone.`,
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

  // Get unique clubs and boat types for filters
  const uniqueClubs = Array.from(new Set(savedImages.map(img => img.crew?.club?.name || img.crew?.clubName).filter((name): name is string => Boolean(name)))).map(club => ({
    value: club,
    label: club
  }))

  const uniqueBoatTypes = Array.from(new Set(savedImages.map(img => img.crew?.boatType.code).filter((code): code is string => Boolean(code)))).map(boat => ({
    value: boat,
    label: boat
  }))

  // Filter function for SearchBar
  const filterFunction = (image: SavedImage, query: string): boolean => {
    const crewName = image.crew?.name.toLowerCase() || ''
    const clubName = (image.crew?.club?.name || image.crew?.clubName)?.toLowerCase() || ''
    const raceName = image.crew?.raceName?.toLowerCase() || ''
    const boatType = image.crew?.boatType.name.toLowerCase() || ''
    const rowerNames = image.crew?.crewNames.join(' ').toLowerCase() || ''

    return crewName.includes(query) ||
           clubName.includes(query) ||
           raceName.includes(query) ||
           boatType.includes(query) ||
           rowerNames.includes(query) ||
           (image.crew?.id.toLowerCase().includes(query) || false)
  }

  // Date range filter function
  const dateRangeFilterFn = (image: SavedImage, value: string) => {
    if (!value) return true
    const [start, end] = value.split('|')
    const imageDate = new Date(image.createdAt)
    const startDate = start ? new Date(start) : null
    const endDate = end ? new Date(end) : null

    if (startDate && imageDate < startDate) return false
    if (endDate && imageDate > endDate) return false
    return true
  }

  // Date range value for SearchBar
  const dateRangeValue = dateRange.start || dateRange.end ? `${dateRange.start}|${dateRange.end}` : ''

  // Date range options (this is a bit different as it's not predefined options)
  const dateRangeOptions = [
    { value: '', label: 'Any Date' },
    { value: `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}|`, label: 'Last 7 days' },
    { value: `${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}|`, label: 'Last 30 days' },
    { value: `${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}|`, label: 'Last 3 months' }
  ]

  const handleDateRangeChange = (value: string) => {
    if (!value) {
      setDateRange({ start: '', end: '' })
    } else {
      const [start, end] = value.split('|')
      setDateRange({ start: start || '', end: end || '' })
    }
  }

  return (
    <div className="gallery-container">
      <div className="container">
        <SearchBar
          items={savedImages}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onItemsFiltered={setFilteredImages}
          placeholder="Search images..."
          filterFunction={filterFunction}
          sortOptions={[
            { value: 'recent', label: 'Latest', sortFn: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() },
            { value: 'club', label: 'Club A→Z', sortFn: (a, b) => (a.crew?.club?.name || a.crew?.clubName || '').localeCompare(b.crew?.club?.name || b.crew?.clubName || '') },
            { value: 'boat', label: 'Boat Type', sortFn: (a, b) => (a.crew?.boatType.code || '').localeCompare(b.crew?.boatType.code || '') },
            { value: 'name', label: 'Crew Name', sortFn: (a, b) => (a.crew?.name || '').localeCompare(b.crew?.name || '') }
          ]}
          selectedSort={sortBy}
          onSortChange={(sort) => setSortBy(sort as 'recent' | 'club' | 'boat' | 'name')}
          advancedFilters={[
            {
              name: 'club',
              label: 'Club',
              options: [{ value: '', label: 'All Clubs' }, ...uniqueClubs],
              selectedValue: selectedClub,
              onValueChange: setSelectedClub,
              filterFn: (image, value) => !value || (image.crew?.club?.name || image.crew?.clubName) === value
            },
            {
              name: 'boatType',
              label: 'Boat',
              options: [{ value: '', label: 'All Boats' }, ...uniqueBoatTypes],
              selectedValue: selectedBoatType,
              onValueChange: setSelectedBoatType,
              filterFn: (image, value) => !value || image.crew?.boatType.code === value
            },
            {
              name: 'dateRange',
              label: 'Date',
              options: dateRangeOptions,
              selectedValue: dateRangeValue,
              onValueChange: handleDateRangeChange,
              filterFn: dateRangeFilterFn
            }
          ]}
          showAdvancedFilters={showAdvancedSearch}
          onToggleAdvancedFilters={() => setShowAdvancedSearch(!showAdvancedSearch)}
          resultsCount={filteredImages.length}
          leftActions={
            selectedImages.size > 0 && (
              <div className="selection-actions-inline">
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
                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2V6"></path>
                  </svg>
                  Delete ({selectedImages.size})
                </button>
              </div>
            )
          }
          actionButtons={[
            ...(selectedImages.size > 0 ? [
              {
                label: 'Delete',
                onClick: handleBatchDelete,
                variant: 'crew-danger' as const
              },
              {
                label: 'Download',
                onClick: handleBatchDownload,
                variant: 'crew-secondary' as const
              }
            ] : []),
            ...(filteredImages.length > 0 ? [{
              label: selectedImages.size === filteredImages.length ? 'Deselect All' : 'Select All',
              onClick: handleSelectAll,
              variant: 'secondary' as const
            }] : []),
            {
              label: 'Create New',
              onClick: () => window.location.href = '/generate',
              variant: 'primary' as const
            }
          ]}
        />


        {/* Gallery Content */}
        {filteredImages.length === 0 ? (
          <div className="empty-state">
            <h2>No Images Yet</h2>
            <p>
              Start creating beautiful crew images by generating your first
              image
            </p>
            <a href="/generate" className="btn btn-primary">
              Generate Your First Image
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
                  <div className="image-header">
                    <div className="image-title">
                      {image.crew?.boatType.code === '1x' && image.crew.crewNames.length > 0
                        ? image.crew.crewNames[0]
                        : image.crew?.name || 'Unknown Crew'
                      }
                    </div>
                    <span className="boat-type-badge">{image.crew?.boatType.code || 'Unknown'}</span>
                  </div>
                  <div className="image-subtitle">
                    {(image.crew?.club?.name || image.crew?.clubName) || 'No Club'}
                    {image.crew?.raceName && ` - ${image.crew.raceName}`}
                  </div>

                  {/* Created Date - Bottom Left */}
                  <div className="image-created-date">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </div>

                  {/* Image Actions */}
                  <div className="crew-actions">
                    <div className="crew-actions-left">
                    </div>
                    <div className="crew-actions-right">
                      <button
                        className="crew-action-btn secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(image)
                        }}
                      >
                        Download
                      </button>
                      <button
                        className="crew-action-btn danger"
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
              </div>
            ))}
          </div>
        )}


      </div>
    </div>
  )
}
