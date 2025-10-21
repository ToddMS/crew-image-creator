import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { trpc } from '../lib/trpc-client'
import { ImageUpload } from '../components/ImageUpload'
import { useAuth } from './__root'
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const newLogoInputRef = useRef<HTMLInputElement>(null)
  const editLogoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const { data: clubs = [], isLoading, refetch } = trpc.club.getAll.useQuery()

  const createMutation = trpc.club.create.useMutation({
    onSuccess: () => {
      setIsCreatingNew(false)
      setNewClubForm({ name: '', primaryColor: '#2563eb', secondaryColor: '#1e40af', logoUrl: '' })
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

  const handleEditFormChange = (clubId: string, field: string, value: string) => {
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
      alert(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleLogoClick = (clubId?: string) => {
    if (clubId) {
      editLogoInputRefs.current[clubId]?.click()
    } else {
      newLogoInputRef.current?.click()
    }
  }

  const handleLogoFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, clubId?: string) => {
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

  const filteredClubs = clubs.filter((club) =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-title">Clubs</span>
            <span className="section-badge">{clubs.length}</span>
          </div>
          <div className="section-header-right">
            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search clubs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                className="btn btn-primary"
                onClick={startNewClub}
                disabled={isCreatingNew}
              >
                + Add New
              </button>
            </div>
          </div>
        </div>

        <div className="gallery-grid">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading clubs...</p>
            </div>
          ) : filteredClubs.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? (
                <>
                  <h3>No clubs found</h3>
                  <p>No clubs match "{searchTerm}"</p>
                  <button className="btn btn-secondary" onClick={() => setSearchTerm('')}>
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
          ) : (
            <>
              {isCreatingNew && (
                <div className="preset-card editing new-preset">
                  <div className="preset-header">
                    <div
                      className={`logo-section editable ${newClubForm.logoUrl ? 'has-logo' : 'empty'}`}
                      onClick={() => newClubForm.logoUrl ? handleLogoRemove() : handleLogoClick()}
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
                        className="preset-name-input"
                        placeholder="Enter club name"
                        value={newClubForm.name}
                        onChange={(e) => handleNewClubChange('name', e.target.value)}
                        style={{ width: '100%', paddingLeft: '0.5rem' }}
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
                      <div className="preset-color-label">Primary</div>
                      <input
                        type="color"
                        className="preset-color-picker"
                        value={newClubForm.primaryColor}
                        onChange={(e) => handleNewClubChange('primaryColor', e.target.value)}
                      />
                      <input
                        type="text"
                        className="preset-color-hex-input"
                        value={newClubForm.primaryColor}
                        onChange={(e) => handleNewClubChange('primaryColor', e.target.value)}
                      />
                    </div>
                    <div className="preset-color-group">
                      <div className="preset-color-label">Secondary</div>
                      <input
                        type="color"
                        className="preset-color-picker"
                        value={newClubForm.secondaryColor}
                        onChange={(e) => handleNewClubChange('secondaryColor', e.target.value)}
                      />
                      <input
                        type="text"
                        className="preset-color-hex-input"
                        value={newClubForm.secondaryColor}
                        onChange={(e) => handleNewClubChange('secondaryColor', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="preset-actions">
                    <button className="preset-btn" onClick={cancelNewClub}>
                      Cancel
                    </button>
                    <button className="preset-btn primary" onClick={saveNewClub}>
                      Save
                    </button>
                  </div>
                </div>
              )}
              {filteredClubs.map((club) => {
                const isEditing = editingClubId === club.id
                const editData = editForm[club.id] || club

                return (
                  <div
                    key={club.id}
                    className={`preset-card ${isEditing ? 'editing' : ''}`}
                  >
                    <div className="preset-header">
                      <div
                        className={`logo-section ${isEditing ? 'editable' : ''} ${(isEditing ? editData.logoUrl : club.logoUrl) ? 'has-logo' : 'empty'}`}
                        onClick={isEditing ? () => editData.logoUrl ? handleLogoRemove(club.id) : handleLogoClick(club.id) : undefined}
                      >
                        {(isEditing ? editData.logoUrl : club.logoUrl) ? (
                          <img src={isEditing ? editData.logoUrl : club.logoUrl} alt={`${club.name} logo`} />
                        ) : (
                          isEditing ? '+' : ''
                        )}
                      </div>
                      <div className="name-section">
                        {isEditing ? (
                          <input
                            type="text"
                            className="preset-name-input"
                            value={editData.name}
                            onChange={(e) =>
                              handleEditFormChange(club.id, 'name', e.target.value)
                            }
                            style={{ width: '100%', paddingLeft: '0.5rem' }}
                          />
                        ) : (
                          <h3 className="preset-name">
                            {club.name}
                          </h3>
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
                                handleEditFormChange(club.id, 'primaryColor', e.target.value)
                              }
                            />
                            <input
                              type="text"
                              className="preset-color-hex-input"
                              value={editData.primaryColor}
                              onChange={(e) =>
                                handleEditFormChange(club.id, 'primaryColor', e.target.value)
                              }
                            />
                          </>
                        ) : (
                          <>
                            <div
                              className="preset-color-swatch"
                              style={{ background: club.primaryColor }}
                            ></div>
                            <div className="preset-color-hex">{club.primaryColor}</div>
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
                                handleEditFormChange(club.id, 'secondaryColor', e.target.value)
                              }
                            />
                            <input
                              type="text"
                              className="preset-color-hex-input"
                              value={editData.secondaryColor}
                              onChange={(e) =>
                                handleEditFormChange(club.id, 'secondaryColor', e.target.value)
                              }
                            />
                          </>
                        ) : (
                          <>
                            <div
                              className="preset-color-swatch"
                              style={{ background: club.secondaryColor }}
                            ></div>
                            <div className="preset-color-hex">{club.secondaryColor}</div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="preset-actions">
                      {isEditing ? (
                        <>
                          <button
                            className="preset-btn"
                            onClick={() => handleCancelEdit(club.id)}
                          >
                            Cancel
                          </button>
                          <button
                            className="preset-btn primary"
                            onClick={() => handleSaveEdit(club)}
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="preset-btn"
                            onClick={() => handleEdit(club)}
                          >
                            Edit
                          </button>
                          <button
                            className="preset-btn danger"
                            onClick={() => setShowDeleteConfirm(club.id)}
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
            <p>Are you sure you want to delete this club? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}