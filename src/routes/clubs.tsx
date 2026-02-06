import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { trpc } from '../lib/trpc-client'
import { useAuth } from '../lib/auth-context'
import { DataContainer } from '../components/DataContainer'
import { ClubCard } from '../components/ClubCard'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { Modal } from '../components/Modal'
import '../components/DataContainer.css'
import './clubs.css'

export const Route = createFileRoute('/clubs')({
  component: ClubsPage,
})

interface ClubFormData {
  name: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string
}

function ClubsPage() {
  const { user } = useAuth()
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [editingClubId, setEditingClubId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    logoUrl: '',
  })
  const [newClubForm, setNewClubForm] = useState<ClubFormData>({
    name: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    logoUrl: '',
  })
  const [editForm, setEditForm] = useState<{ [key: string]: ClubFormData }>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  )
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredClubs, setFilteredClubs] = useState<Array<any>>([])
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set())
  const newLogoInputRef = useRef<HTMLInputElement>(null)
  const editLogoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>(
    {},
  )

  const utils = trpc.useUtils()
  const { data: clubs = [], isLoading, refetch } = trpc.club.getAll.useQuery()

  const createMutation = trpc.club.create.useMutation({
    onSuccess: () => {
      setIsCreatingNew(false)
      setNewClubForm({
        name: '',
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        logoUrl: '',
      })
      utils.club.getAll.invalidate()
      utils.crew.getAll.invalidate()
    },
    onError: (error) => {
      alert(`Failed to create club: ${error.message}`)
    },
  })

  const updateMutation = trpc.club.update.useMutation({
    onSuccess: () => {
      setEditingClubId(null)
      setEditForm({})
      utils.club.getAll.invalidate()
      utils.crew.getAll.invalidate()
    },
    onError: (error) => {
      alert(`Failed to update club: ${error.message}`)
    },
  })

  const deleteMutation = trpc.club.delete.useMutation({
    onSuccess: () => {
      setShowDeleteConfirm(null)
      utils.club.getAll.invalidate()
      utils.crew.getAll.invalidate()
    },
    onError: (error) => {
      alert(`Failed to delete club: ${error.message}`)
    },
  })

  const bulkDeleteMutation = trpc.club.bulkDelete.useMutation({
    onSuccess: () => {
      setSelectedClubs(new Set())
      utils.club.getAll.invalidate()
      utils.crew.getAll.invalidate()
    },
    onError: (error) => {
      alert(`Failed to delete clubs: ${error.message}`)
    },
  })

  const handleEdit = (club: any) => {
    setEditingClubId(club.id)
    setEditForm({
      ...editForm,
      [club.id]: {
        name: club.name,
        primaryColor: club.primaryColor,
        secondaryColor: club.secondaryColor,
        logoUrl: club.logoUrl || '',
      },
    })
  }

  const handleCancelEdit = (clubId: string) => {
    setEditingClubId(null)
    const newEditForm = { ...editForm }
    delete newEditForm[clubId]
    setEditForm(newEditForm)
  }

  const handleSaveEdit = async (club: any) => {
    const editData = editForm[club.id]
    if (!editData || !editData.name.trim()) {
      alert('Club name is required')
      return
    }

    updateMutation.mutate({
      id: club.id,
      ...editData,
      logoUrl: editData.logoUrl || '',
    })
  }

  const handleEditFormChange = (
    clubId: string,
    field: string,
    value: string,
  ) => {
    setEditForm({
      ...editForm,
      [clubId]: {
        ...editForm[clubId],
        [field]: value,
      },
    })
  }

  const handleDelete = async (clubId: string) => {
    deleteMutation.mutate({ id: clubId })
  }

  const handleBulkDelete = async () => {
    if (selectedClubs.size === 0) return
    setShowBatchDeleteConfirm(true)
  }

  const confirmBulkDelete = async () => {
    bulkDeleteMutation.mutate({ ids: Array.from(selectedClubs) })
    setShowBatchDeleteConfirm(false)
  }

  const handleClubSelection = (clubId: string, checked: boolean) => {
    const newSelected = new Set(selectedClubs)
    if (checked) {
      newSelected.add(clubId)
    } else {
      newSelected.delete(clubId)
    }
    setSelectedClubs(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedClubs.size === filteredClubs.length) {
      setSelectedClubs(new Set())
    } else {
      setSelectedClubs(new Set(filteredClubs.map((club) => club.id)))
    }
  }

  const startNewClub = () => {
    setIsCreatingNew(true)
    setNewClubForm({
      name: '',
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      logoUrl: '',
    })
  }

  const cancelNewClub = () => {
    setIsCreatingNew(false)
    setNewClubForm({
      name: '',
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      logoUrl: '',
    })
  }

  const saveNewClub = async () => {
    if (!newClubForm.name.trim()) {
      alert('Club name is required')
      return
    }

    if (!user) {
      alert('Please sign in to create clubs')
      return
    }

    createMutation.mutate({
      ...newClubForm,
      logoUrl: newClubForm.logoUrl || '',
      userId: user.id,
    })
  }

  const handleNewClubChange = (field: string, value: string) => {
    setNewClubForm({
      ...newClubForm,
      [field]: value,
    })
  }

  const handleLogoUpload = async (file: File, clubId?: string) => {
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/upload/club-logo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      if (clubId) {
        // Update existing club
        handleEditFormChange(clubId, 'logoUrl', result.logoUrl)
      } else {
        // Update new club form
        handleNewClubChange('logoUrl', result.logoUrl)
      }
    } catch (error) {
      alert(
        `Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  const handleLogoClick = (clubId?: string) => {
    if (clubId) {
      editLogoInputRefs.current[clubId]?.click()
    } else {
      newLogoInputRef.current?.click()
    }
  }

  const handleLogoFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    clubId?: string,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    await handleLogoUpload(file, clubId)
  }

  const handleLogoRemove = (clubId?: string) => {
    if (clubId) {
      handleEditFormChange(clubId, 'logoUrl', '')
    } else {
      handleNewClubChange('logoUrl', '')
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent, clubId?: string) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))

    if (!imageFile) {
      alert('Please drop an image file')
      return
    }

    if (imageFile.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    await handleLogoUpload(imageFile, clubId)
  }

  // Filter function for SearchBar
  const filterFunction = (club: any, query: string) => {
    return club.name.toLowerCase().includes(query)
  }

  // User comes from auth context

  if (!user) {
    return (
      <div className="club-presets-container">
        <div className="container">
          <div className="empty-state">
            <h2>Clubs</h2>
            <p>Sign in to manage your club color presets</p>
            <button className="btn btn-primary">Sign In to Manage Clubs</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <DataContainer
        items={clubs}
        loading={isLoading}
        error=""
        emptyState={{
          title: "No Clubs Yet",
          message: "Create your first club preset to get started",
          actionLabel: "Create First Club",
          actionOnClick: startNewClub
        }}
        searchConfig={{
          placeholder: "Search clubs...",
          filterFunction,
          sortOptions: [
            { value: 'name', label: 'Name A-Z', sortFn: (a, b) => a.name.localeCompare(b.name) },
            { value: 'recent', label: 'Recently Created', sortFn: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() }
          ]
        }}
        renderCard={(club, isSelected, onSelect) => (
          <ClubCard
            club={club}
            isSelected={isSelected}
            onSelect={onSelect}
            isEditing={editingClubId === club.id}
            editData={editForm[club.id]}
            onEdit={handleEdit}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
            onDelete={(club) => setShowDeleteConfirm(club.id)}
            onEditFormChange={handleEditFormChange}
            onLogoClick={handleLogoClick}
            onLogoRemove={handleLogoRemove}
          />
        )}
        className="club-presets-container"
        gridClassName="gallery-grid"
        selectedItems={selectedClubs}
        onItemSelect={handleClubSelection}
        onSelectAll={handleSelectAll}
        actionButtons={[
          ...(selectedClubs.size > 0 ? [{
            label: 'Delete Selected',
            onClick: handleBulkDelete,
            variant: 'crew-danger' as const
          }] : []),
          {
            label: 'Create New Club',
            onClick: startNewClub,
            variant: 'primary' as const,
            disabled: isCreatingNew
          }
        ]}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        filteredItems={filteredClubs}
        onItemsFiltered={setFilteredClubs}
        sortBy="name"
        onSortChange={() => {}}
      />

      {/* Create New Club Form */}
      <Modal
        isOpen={isCreatingNew}
        onClose={cancelNewClub}
        title="Create New Club"
        maxWidth="600px"
        className="club-modal"
      >
        <div className="club-form">
              <div className="form-group">
                <label htmlFor="club-name">Club Name *</label>
                <input
                  id="club-name"
                  type="text"
                  value={newClubForm.name}
                  onChange={(e) => handleNewClubChange('name', e.target.value)}
                  placeholder="Enter club name"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="primary-color">Primary Color *</label>
                  <div className="color-input-group">
                    <input
                      id="primary-color"
                      type="color"
                      value={newClubForm.primaryColor}
                      onChange={(e) => handleNewClubChange('primaryColor', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={newClubForm.primaryColor}
                      onChange={(e) => handleNewClubChange('primaryColor', e.target.value)}
                      placeholder="#000000"
                      className="color-text-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="secondary-color">Secondary Color *</label>
                  <div className="color-input-group">
                    <input
                      id="secondary-color"
                      type="color"
                      value={newClubForm.secondaryColor}
                      onChange={(e) => handleNewClubChange('secondaryColor', e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={newClubForm.secondaryColor}
                      onChange={(e) => handleNewClubChange('secondaryColor', e.target.value)}
                      placeholder="#000000"
                      className="color-text-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Club Logo (Optional)</label>
                <div
                  className="logo-upload-area"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e)}
                  onClick={() => handleLogoClick()}
                >
                  {newClubForm.logoUrl ? (
                    <div className="logo-preview">
                      <img src={newClubForm.logoUrl} alt="Club logo preview" />
                      <button
                        className="logo-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLogoRemove()
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="logo-upload-placeholder">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21,15 16,10 5,21"></polyline>
                      </svg>
                      <p>Click or drag image here</p>
                      <span>Max 2MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelNewClub}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveNewClub}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Club'}
                </button>
              </div>
        </div>
      </Modal>

      {/* Hidden file inputs for logo upload */}
      {isCreatingNew && (
        <input
          ref={newLogoInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleLogoFileSelect(e)}
          style={{ display: 'none' }}
        />
      )}

      {Object.keys(editForm).map(clubId => (
        <input
          key={clubId}
          ref={(el) => {
            editLogoInputRefs.current[clubId] = el
          }}
          type="file"
          accept="image/*"
          onChange={(e) => handleLogoFileSelect(e, clubId)}
          style={{ display: 'none' }}
        />
      ))}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDelete(showDeleteConfirm!)}
        title="Delete Club"
        message={`Are you sure you want to delete "${filteredClubs.find(club => club.id === showDeleteConfirm)?.name}"?`}
        confirmButtonText="Delete Club"
      />

      {/* Batch Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title={selectedClubs.size === 1 ? "Delete Club" : "Delete Clubs"}
        message={
          selectedClubs.size === 1
            ? `Are you sure you want to delete "${filteredClubs.find(club => selectedClubs.has(club.id))?.name}"?`
            : `Are you sure you want to delete ${selectedClubs.size} clubs?`
        }
        confirmButtonText={selectedClubs.size === 1 ? "Delete Club" : "Delete Clubs"}
      />
    </>
  )
}
