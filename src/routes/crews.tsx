import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '../lib/trpc-client'
import { useAuth } from '../lib/auth-context'
import { DataContainer } from '../components/DataContainer'
import { CrewCard } from '../components/CrewCard'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { CreateCrewModal } from '../components/CreateCrewModal'
import '../components/DataContainer.css'
import './crews.css'

export const Route = createFileRoute('/crews')({
  component: CrewsPage,
})

const boatClassHasCox = (boatClass: string) =>
  boatClass === '8+' || boatClass === '4+'

function CrewsPage() {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<string>('recent')
  const [selectedCrews, setSelectedCrews] = useState<Set<string>>(new Set())
  const [expandedCrewMembers, setExpandedCrewMembers] = useState<Set<string>>(
    new Set(),
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCrews, setFilteredCrews] = useState<Array<any>>([])
  const [selectedClub, setSelectedClub] = useState<string>('')
  const [selectedBoatClass, setSelectedBoatClass] = useState<string>('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any | null>(null)
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCrew, setEditingCrew] = useState<any | null>(null)

  const { user } = useAuth()

  const utils = trpc.useUtils()
  const {
    data: crews = [],
    isLoading: loading,
    error,
    refetch: loadCrews,
  } = trpc.crew.getAll.useQuery()

  const deleteCrew = trpc.crew.delete.useMutation({
    onSuccess: () => {
      utils.crew.getAll.invalidate()
      utils.savedImage.getAll.invalidate()
    },
  })

  // Transform crews data to match the old format
  const savedCrews = crews.map((crew) => {
    const getSeatLabel = (
      idx: number,
      totalRowers: number,
      hasCox: boolean,
    ) => {
      if (hasCox && idx === 0) return 'C'
      const rowerIdx = hasCox ? idx - 1 : idx

      if (totalRowers === 8) {
        const seats = ['S', '7', '6', '5', '4', '3', '2', 'B']
        return seats[rowerIdx]
      } else if (totalRowers === 4) {
        const seats = ['S', '3', '2', 'B']
        return seats[rowerIdx]
      } else if (totalRowers === 2) {
        const seats = ['S', 'B']
        return seats[rowerIdx]
      } else if (totalRowers === 1) {
        return 'S'
      }
      return `${rowerIdx + 1}`
    }

    const totalRowers = crew.boatType.seats
    const hasCox = boatClassHasCox(crew.boatType.code)

    return {
      ...crew,
      boatClub: crew.club?.name || crew.clubName || 'No Club',
      boatName: crew.name,
      boatClass: crew.boatType.code,
      crewMembers: crew.crewNames.map((name, idx) => ({
        seat: getSeatLabel(idx, totalRowers, hasCox),
        name,
      })),
    }
  })

  // Filter function for SearchBar
  const filterFunction = (crew: any, query: string) => {
    const crewName = crew.boatName?.toLowerCase() || ''
    const clubName = crew.boatClub?.toLowerCase() || ''
    const raceName = crew.raceName?.toLowerCase() || ''
    const rowerNames = crew.crewMembers?.map((member: any) => member.name).join(' ').toLowerCase() || ''
    const coachName = crew.coachName?.toLowerCase() || ''

    return crewName.includes(query) ||
           clubName.includes(query) ||
           raceName.includes(query) ||
           rowerNames.includes(query) ||
           coachName.includes(query)
  }

  // Get unique clubs and boat classes for filters
  const uniqueClubs = Array.from(new Set(savedCrews.map(crew => crew.boatClub).filter(Boolean))).map(club => ({
    value: club,
    label: club
  }))

  const uniqueBoatClasses = Array.from(new Set(savedCrews.map(crew => crew.boatClass).filter(Boolean))).map(boatClass => ({
    value: boatClass,
    label: boatClass
  }))

  const handleDeleteCrew = async (crew: any) => {
    setShowDeleteConfirm(crew)
  }

  const confirmDeleteCrew = async (crew: any) => {
    try {
      await deleteCrew.mutateAsync({ id: crew.id })
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting crew:', error)
    }
  }

  const handleCrewSelection = (crewId: string, checked: boolean) => {
    const newSelected = new Set(selectedCrews)
    if (checked) {
      newSelected.add(crewId)
    } else {
      newSelected.delete(crewId)
    }
    setSelectedCrews(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedCrews.size === filteredCrews.length) {
      setSelectedCrews(new Set())
    } else {
      setSelectedCrews(new Set(filteredCrews.map((crew) => crew.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCrews.size === 0) return
    setShowBatchDeleteConfirm(true)
  }

  const confirmBulkDelete = async () => {
    try {
      for (const crewId of selectedCrews) {
        await deleteCrew.mutateAsync({ id: crewId })
      }
      setSelectedCrews(new Set())
      setShowBatchDeleteConfirm(false)
    } catch (error) {
      console.error('Error in bulk delete:', error)
    }
  }

  const toggleCrewMembersExpansion = (crewId: string) => {
    const newExpanded = new Set(expandedCrewMembers)
    if (newExpanded.has(crewId)) {
      newExpanded.delete(crewId)
    } else {
      newExpanded.add(crewId)
    }
    setExpandedCrewMembers(newExpanded)
  }

  if (!user) {
    return (
      <div className="data-container">
        <div className="container">
          <div className="empty-state">
            <h2>Crews</h2>
            <p>Sign in to view and manage your saved crew lineups</p>
            <button className="btn btn-primary">Sign In to View Crews</button>
          </div>
        </div>
      </div>
    )
  }

  const handleEditCrew = (crew: any) => {
    setEditingCrew({
      id: crew.id,
      boatClass: crew.boatClass,
      clubName: crew.boatClub,
      raceName: crew.raceName,
      boatName: crew.boatName,
      raceDate: crew.raceDate,
      coachName: crew.coachName,
      raceCategory: crew.raceCategory,
      crewNames: crew.crewMembers
        .filter((member: any) => member.seat !== 'C')
        .map((member: any) => member.name),
      coxName: crew.crewMembers.find((member: any) => member.seat === 'C')?.name || '',
    })
    setShowCreateModal(true)
  }

  const handleCreateCrew = () => {
    setEditingCrew(null)
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingCrew(null)
  }

  const handleCrewSuccess = () => {
    loadCrews()
  }

  const handleGenerateCrew = (crew: any) => {
    navigate({ to: '/generate', state: { selectedCrewIds: [crew.id] } })
  }

  return (
    <>
      <DataContainer
        items={savedCrews}
        loading={loading}
        error={error?.message}
        emptyState={{
          title: "No Crews Yet",
          message: "Create your first crew lineup to get started with generating beautiful rowing images",
          actionLabel: "Create Your First Crew",
          actionOnClick: handleCreateCrew
        }}
        searchConfig={{
          placeholder: "Search crews...",
          filterFunction,
          sortOptions: [
            { value: 'recent', label: 'Recently Created', sortFn: (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() },
            { value: 'club', label: 'Club Name', sortFn: (a, b) => a.boatClub.localeCompare(b.boatClub) },
            { value: 'race', label: 'Race Name', sortFn: (a, b) => (a.raceName || '').localeCompare(b.raceName || '') },
            { value: 'boat_class', label: 'Boat Class', sortFn: (a, b) => a.boatClass.localeCompare(b.boatClass) }
          ],
          advancedFilters: [
            {
              name: 'club',
              label: 'Club',
              options: [{ value: '', label: 'All Clubs' }, ...uniqueClubs],
              selectedValue: selectedClub,
              onValueChange: setSelectedClub,
              filterFn: (crew, value) => !value || crew.boatClub === value
            },
            {
              name: 'boatClass',
              label: 'Boat Class',
              options: [{ value: '', label: 'All Boat Classes' }, ...uniqueBoatClasses],
              selectedValue: selectedBoatClass,
              onValueChange: setSelectedBoatClass,
              filterFn: (crew, value) => !value || crew.boatClass === value
            }
          ]
        }}
        renderCard={(crew, isSelected, onSelect) => (
          <CrewCard
            crew={crew}
            isSelected={isSelected}
            onSelect={onSelect}
            onEdit={handleEditCrew}
            onDelete={handleDeleteCrew}
            onGenerate={handleGenerateCrew}
            expandedCrewMembers={expandedCrewMembers}
            onToggleExpansion={toggleCrewMembersExpansion}
          />
        )}
        className="my-crews-container"
        gridClassName="crews-grid"
        selectedItems={selectedCrews}
        onItemSelect={handleCrewSelection}
        onSelectAll={handleSelectAll}
        actionButtons={[
          ...(selectedCrews.size > 0 ? [
            {
              label: 'Delete Selected',
              onClick: handleBulkDelete,
              variant: 'crew-danger' as const
            },
            {
              label: 'Generate Selected',
              onClick: () => navigate({ to: '/generate', state: { selectedCrewIds: Array.from(selectedCrews) } }),
              variant: 'crew-secondary' as const
            }
          ] : []),
          {
            label: 'Create New Crew',
            onClick: handleCreateCrew,
            variant: 'primary' as const
          }
        ]}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredItems={filteredCrews}
        onItemsFiltered={setFilteredCrews}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
        onRetry={() => loadCrews()}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => confirmDeleteCrew(showDeleteConfirm)}
        title="Delete Crew"
        message={`Are you sure you want to delete "${showDeleteConfirm?.boatName}"?`}
        confirmButtonText="Delete Crew"
      />

      {/* Batch Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title={selectedCrews.size === 1 ? "Delete Crew" : "Delete Crews"}
        message={
          selectedCrews.size === 1
            ? `Are you sure you want to delete "${filteredCrews.find(crew => selectedCrews.has(crew.id))?.boatName}"?`
            : `Are you sure you want to delete ${selectedCrews.size} crews?`
        }
        confirmButtonText={selectedCrews.size === 1 ? "Delete Crew" : "Delete Crews"}
      />

      {/* Create/Edit Crew Modal */}
      <CreateCrewModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleCrewSuccess}
        editingCrew={editingCrew}
      />
    </>
  )
}