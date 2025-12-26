import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { trpc } from '../lib/trpc-client'
import { ImageUpload } from '../components/ImageUpload'
import { useAuth } from '../lib/auth-context'
import { SearchBar } from '../components/SearchBar'
import '../components/SearchBar.css'
import '../components/Button.css'
import '../dashboard.css'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredClubs, setFilteredClubs] = useState<any[]>([])
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set())
  const newLogoInputRef = useRef<HTMLInputElement>(null)
  const editLogoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>(
    {},
  )

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
      refetch()
    },
    onError: (error) => {
      alert(`Failed to create club: ${error.message}`)
    },
  })

  const updateMutation = trpc.club.update.useMutation({
    onSuccess: () => {
      setEditingClubId(null)
      setEditForm({})
      refetch()
    },
    onError: (error) => {
      alert(`Failed to update club: ${error.message}`)
    },
  })

  const deleteMutation = trpc.club.delete.useMutation({
    onSuccess: () => {
      setShowDeleteConfirm(null)
      refetch()
    },
    onError: (error) => {
      alert(`Failed to delete club: ${error.message}`)
    },
  })

  const bulkDeleteMutation = trpc.club.bulkDelete.useMutation({
    onSuccess: () => {
      setSelectedClubs(new Set())
      refetch()
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
      logoUrl: editData.logoUrl || undefined,
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

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedClubs.size} club${selectedClubs.size > 1 ? 's' : ''}? This action cannot be undone.`
    )

    if (confirmed) {
      bulkDeleteMutation.mutate({ ids: Array.from(selectedClubs) })
    }
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
      logoUrl: newClubForm.logoUrl || undefined,
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
    <div className="club-presets-container">
      <div className="container">
        <SearchBar
          items={clubs}
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          onItemsFiltered={setFilteredClubs}
          placeholder="Search clubs..."
          filterFunction={filterFunction}
          resultsCount={filteredClubs.length}
          className="clubs-search-bar"
          actionButtons={[
            ...(selectedClubs.size > 0 ? [{
              label: 'Delete',
              onClick: handleBulkDelete,
              variant: 'crew-danger' as const
            }] : []),
            ...(filteredClubs.length > 0 ? [{
              label: selectedClubs.size === filteredClubs.length ? 'Deselect All' : 'Select All',
              onClick: handleSelectAll,
              variant: 'secondary' as const
            }] : []),
            {
              label: 'Create New',
              onClick: startNewClub,
              variant: 'primary' as const,
              disabled: isCreatingNew
            }
          ]}
        />

        <div className="gallery-grid">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading clubs...</p>
            </div>
          ) : (
            <>
              {isCreatingNew && (
                <div className="preset-card editing new-preset">
                  <div className="preset-header">
                    <div
                      className={`logo-section editable ${newClubForm.logoUrl ? 'has-logo' : 'empty'}`}
                      onClick={() =>
                        newClubForm.logoUrl
                          ? handleLogoRemove()
                          : handleLogoClick()
                      }
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e)}
                    >
                      {newClubForm.logoUrl ? (
                        <img src={newClubForm.logoUrl} alt="Club logo" />
                      ) : (
                        '+'
                      )}
                    </div>
                    <div className="name-section">
                      <input
                        type="text"
                        className="preset-name-input editing-input"
                        placeholder="Enter club name"
                        value={newClubForm.name}
                        onChange={(e) =>
                          handleNewClubChange('name', e.target.value)
                        }
                      />
                    </div>
                    <input
                      ref={newLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoFileSelect(e)}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div className="preset-colors">
                    <div className="preset-color-group">
                      <div className="preset-color-label">PRIMARY</div>
                      <input
                        type="color"
                        className="preset-color-picker"
                        value={newClubForm.primaryColor}
                        onChange={(e) =>
                          handleNewClubChange('primaryColor', e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="preset-color-hex-input"
                        value={newClubForm.primaryColor}
                        onChange={(e) =>
                          handleNewClubChange('primaryColor', e.target.value)
                        }
                      />
                    </div>
                    <div className="preset-color-group">
                      <div className="preset-color-label">SECONDARY</div>
                      <input
                        type="color"
                        className="preset-color-picker"
                        value={newClubForm.secondaryColor}
                        onChange={(e) =>
                          handleNewClubChange('secondaryColor', e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="preset-color-hex-input"
                        value={newClubForm.secondaryColor}
                        onChange={(e) =>
                          handleNewClubChange('secondaryColor', e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="preset-actions">
                    <button className="crew-action-btn secondary" onClick={cancelNewClub}>
                      Cancel
                    </button>
                    <button
                      className="crew-action-btn primary"
                      onClick={saveNewClub}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {filteredClubs.length === 0 && !isCreatingNew ? (
                <div className="empty-state">
                  {searchTerm ? (
                    <>
                      <h3>No clubs found</h3>
                      <p>No clubs match "{searchTerm}"</p>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setSearchTerm('')}
                      >
                        Clear Search
                      </button>
                    </>
                  ) : (
                    <>
                      <h3>No Clubs Yet</h3>
                      <p>Create your first club preset to get started</p>
                      <button className="btn btn-primary" onClick={startNewClub}>
                        Create First Club
                      </button>
                    </>
                  )}
                </div>
              ) : null}

              {filteredClubs.map((club) => {
                const isEditing = editingClubId === club.id
                const editData = editForm[club.id] || club

                return (
                  <div
                    key={club.id}
                    className={`preset-card ${isEditing ? 'editing' : ''} ${selectedClubs.has(club.id) ? 'selected' : ''}`}
                    onClick={() =>
                      handleClubSelection(
                        club.id,
                        !selectedClubs.has(club.id),
                      )
                    }
                  >
                    <div className="preset-header">
                      <div
                        className={`logo-section ${isEditing ? 'editable' : ''} ${(isEditing ? editData.logoUrl : club.logoUrl) ? 'has-logo' : 'empty'}`}
                        onClick={
                          isEditing
                            ? (e) => {
                                e.stopPropagation()
                                editData.logoUrl
                                  ? handleLogoRemove(club.id)
                                  : handleLogoClick(club.id)
                              }
                            : undefined
                        }
                      >
                        {(isEditing ? editData.logoUrl : club.logoUrl) ? (
                          <img
                            src={isEditing ? editData.logoUrl : club.logoUrl}
                            alt={`${club.name} logo`}
                          />
                        ) : isEditing ? (
                          '+'
                        ) : (
                          ''
                        )}
                      </div>
                      <div className="name-section">
                        {isEditing ? (
                          <input
                            type="text"
                            className="preset-name-input"
                            value={editData.name}
                            onChange={(e) =>
                              handleEditFormChange(
                                club.id,
                                'name',
                                e.target.value,
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: '100%', paddingLeft: '0.5rem' }}
                          />
                        ) : (
                          <h3 className="preset-name">{club.name}</h3>
                        )}
                      </div>
                      {isEditing && (
                        <input
                          ref={(el) => {
                            editLogoInputRefs.current[club.id] = el
                          }}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoFileSelect(e, club.id)}
                          style={{ display: 'none' }}
                        />
                      )}
                    </div>
                    <div className="preset-colors">
                      <div className="preset-color-group">
                        <div className="preset-color-label">Primary</div>
                        {isEditing ? (
                          <>
                            <input
                              type="color"
                              className="preset-color-picker"
                              value={editData.primaryColor}
                              onChange={(e) =>
                                handleEditFormChange(
                                  club.id,
                                  'primaryColor',
                                  e.target.value,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <input
                              type="text"
                              className="preset-color-hex-input"
                              value={editData.primaryColor}
                              onChange={(e) =>
                                handleEditFormChange(
                                  club.id,
                                  'primaryColor',
                                  e.target.value,
                                )
                              }
                            />
                          </>
                        ) : (
                          <>
                            <div
                              className="preset-color-swatch"
                              style={{ background: club.primaryColor }}
                            ></div>
                            <div className="preset-color-hex">
                              {club.primaryColor}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="preset-color-group">
                        <div className="preset-color-label">Secondary</div>
                        {isEditing ? (
                          <>
                            <input
                              type="color"
                              className="preset-color-picker"
                              value={editData.secondaryColor}
                              onChange={(e) =>
                                handleEditFormChange(
                                  club.id,
                                  'secondaryColor',
                                  e.target.value,
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                            <input
                              type="text"
                              className="preset-color-hex-input"
                              value={editData.secondaryColor}
                              onChange={(e) =>
                                handleEditFormChange(
                                  club.id,
                                  'secondaryColor',
                                  e.target.value,
                                )
                              }
                            />
                          </>
                        ) : (
                          <>
                            <div
                              className="preset-color-swatch"
                              style={{ background: club.secondaryColor }}
                            ></div>
                            <div className="preset-color-hex">
                              {club.secondaryColor}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="preset-actions">
                      {isEditing ? (
                        <>
                          <button
                            className="crew-action-btn secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelEdit(club.id)
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            className="crew-action-btn primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveEdit(club)
                            }}
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="crew-action-btn primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(club)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="crew-action-btn danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDeleteConfirm(club.id)
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Club</h3>
            <p>
              Are you sure you want to delete this club? This action cannot be
              undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
