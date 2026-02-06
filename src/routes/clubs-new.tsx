import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '../lib/trpc-client'
import { useAuth } from '../lib/auth-context'
import { DataContainer } from '../components/DataContainer'
import { ClubCard } from '../components/ClubCard'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import '../components/DataContainer.css'
import './clubs.css'

export const Route = createFileRoute('/clubs-new')({
  component: ClubsNewPage,
})

interface ClubFormData {
  name: string
  primaryColor: string
  secondaryColor: string
  logoUrl: string
}

function ClubsNewPage() {
  const { user } = useAuth()
  const [editingClubId, setEditingClubId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ [key: string]: ClubFormData }>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredClubs, setFilteredClubs] = useState<Array<any>>([])
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set())

  const utils = trpc.useUtils()
  const { data: clubs = [], isLoading, error } = trpc.club.getAll.useQuery()

  const updateMutation = trpc.club.update.useMutation({
    onSuccess: () => {
      setEditingClubId(null)
      setEditForm({})
      utils.club.getAll.invalidate()
    },
    onError: (error) => {
      alert(`Failed to update club: ${error.message}`)
    },
  })

  const deleteMutation = trpc.club.delete.useMutation({
    onSuccess: () => {
      setShowDeleteConfirm(null)
      utils.club.getAll.invalidate()
    },
  })

  const bulkDeleteMutation = trpc.club.bulkDelete.useMutation({
    onSuccess: () => {
      setSelectedClubs(new Set())
      utils.club.getAll.invalidate()
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

  const handleCancelEdit = (clubId: string) => {
    setEditingClubId(null)
    const newEditForm = { ...editForm }
    delete newEditForm[clubId]
    setEditForm(newEditForm)
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

  const handleDelete = async (club: any) => {
    setShowDeleteConfirm(club.id)
  }

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      await deleteMutation.mutateAsync({ id: showDeleteConfirm })
    }
  }

  const handleBatchDelete = async () => {
    if (selectedClubs.size === 0) return
    setShowBatchDeleteConfirm(true)
  }

  const confirmBulkDelete = async () => {
    await bulkDeleteMutation.mutateAsync({ ids: Array.from(selectedClubs) })
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

  const handleLogoClick = (clubId?: string) => {
    console.log('Logo click for club:', clubId)
  }

  const handleLogoRemove = (clubId?: string) => {
    if (clubId) {
      handleEditFormChange(clubId, 'logoUrl', '')
    }
  }

  const filterFunction = (club: any, query: string) => {
    return club.name.toLowerCase().includes(query)
  }

  if (!user) {
    return (
      <div className="data-container">
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
        error={error?.message}
        emptyState={{
          title: "No Clubs Yet",
          message: "Create your first club preset to get started",
          actionLabel: "Create First Club",
          actionOnClick: () => console.log('Create club clicked')
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
            onDelete={handleDelete}
            onEditFormChange={handleEditFormChange}
            onLogoClick={handleLogoClick}
            onLogoRemove={handleLogoRemove}
          />
        )}
        className="club-presets-container"
        gridClassName="clubs-grid"
        selectedItems={selectedClubs}
        onItemSelect={handleClubSelection}
        onSelectAll={handleSelectAll}
        actionButtons={[
          ...(selectedClubs.size > 0 ? [{
            label: 'Delete Selected',
            onClick: handleBatchDelete,
            variant: 'danger' as const
          }] : []),
          {
            label: 'Create New Club',
            onClick: () => console.log('Create new club'),
            variant: 'primary' as const
          }
        ]}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        filteredItems={filteredClubs}
        onItemsFiltered={setFilteredClubs}
        sortBy="name"
        onSortChange={() => {}}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={confirmDelete}
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