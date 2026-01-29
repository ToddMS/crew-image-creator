import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '../lib/trpc-client'
import { SearchBar } from '../components/SearchBar'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import '../components/SearchBar.css'
import '../components/Button.css'
import '../dashboard.css'
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

  // Mock user state for now - in the original this comes from auth context
  const user = { name: 'Demo User' }

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
      <div className="my-crews-container">
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

  if (loading) {
    return (
      <div className="my-crews-container">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h3>Loading your crews...</h3>
          </div>
        </div>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div className="my-crews-container">
        <div className="container">
          <div className="alert error">
            ⚠️ {error.message || 'Failed to load crews. Please try again.'}
            <button className="alert-close" onClick={() => loadCrews()}>
              ×
            </button>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-primary" onClick={() => loadCrews()}>
              Retry Loading Crews
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (savedCrews.length === 0 && !loading) {
    return (
      <div className="my-crews-container">
        <div className="container">
          <div className="empty-state">
            <h2>No Crews Yet</h2>
            <p>
              Create your first crew lineup to get started with generating
              beautiful rowing images
            </p>
            <Link to="/crews/create" className="btn btn-primary">
              Create Your First Crew
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-crews-container">
      <div className="container">
        <div className="crews-section">
          <SearchBar
            items={savedCrews}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onItemsFiltered={setFilteredCrews}
            placeholder="Search crews..."
            filterFunction={filterFunction}
            sortOptions={[
              { value: 'recent', label: 'Recently Created', sortFn: (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() },
              { value: 'club', label: 'Club Name', sortFn: (a, b) => a.boatClub.localeCompare(b.boatClub) },
              { value: 'race', label: 'Race Name', sortFn: (a, b) => (a.raceName || '').localeCompare(b.raceName || '') },
              { value: 'boat_class', label: 'Boat Class', sortFn: (a, b) => a.boatClass.localeCompare(b.boatClass) }
            ]}
            selectedSort={sortBy}
            onSortChange={setSortBy}
            advancedFilters={[
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
            ]}
            showAdvancedFilters={showAdvancedFilters}
            onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
            resultsCount={filteredCrews.length}
            className="crews-search-bar"
            actionButtons={[
              ...(selectedCrews.size > 0 ? [
                {
                  label: 'Delete',
                  onClick: handleBulkDelete,
                  variant: 'crew-danger' as const
                },
                {
                  label: 'Generate',
                  onClick: () => navigate({ to: '/generate', state: { selectedCrewIds: Array.from(selectedCrews) } }),
                  variant: 'crew-secondary' as const
                }
              ] : []),
              ...(filteredCrews.length > 0 ? [{
                label: selectedCrews.size === filteredCrews.length ? 'Deselect All' : 'Select All',
                onClick: handleSelectAll,
                variant: 'secondary'
              }] : []),
              {
                label: 'Create New',
                onClick: () => navigate({ to: '/crews/create' }),
                variant: 'primary'
              }
            ]}
          />

          <div className="crews-grid">
            {filteredCrews.map((crew) => (
              <div
                key={crew.id}
                className={`crew-card ${selectedCrews.has(crew.id) ? 'selected' : ''}`}
                onClick={() =>
                  handleCrewSelection(
                    crew.id,
                    !selectedCrews.has(crew.id),
                  )
                }
              >
                <div className="crew-card-header">
                  <div className="crew-card-title">
                    <h3>{crew.boatName}</h3>
                    <div className="crew-card-subtitle">
                      <span className="club-name-full">{crew.boatClub}</span>
                    </div>
                  </div>
                  <span className="boat-type-badge">{crew.boatClass}</span>
                </div>

                <div className="crew-compact-info">
                  <div className="crew-compact-row">
                    <span className="crew-compact-label">Race:</span>
                    <span className="crew-compact-value">
                      {crew.raceName || 'No race'}
                    </span>
                  </div>
                  {crew.raceCategory && (
                    <div className="crew-compact-row">
                      <span className="crew-compact-label">Category:</span>
                      <span className="crew-compact-value">
                        {crew.raceCategory}
                      </span>
                    </div>
                  )}
                </div>

                <div className="crew-members">
                  <div
                    className="crew-members-header"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCrewMembersExpansion(crew.id)
                    }}
                  >
                    <span className="crew-members-title">
                      {crew.crewMembers.length} Crew Members
                    </span>
                    <span
                      className={`crew-members-toggle ${expandedCrewMembers.has(crew.id) ? 'expanded' : ''}`}
                    >
                      ▼
                    </span>
                  </div>

                  {expandedCrewMembers.has(crew.id) && (
                    <div
                      className="crew-boat-layout"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCrewMembersExpansion(crew.id)
                      }}
                    >
                      {/* Coach floated left */}
                      {crew.coachName && (
                        <div className="coach-position">
                          <div className="crew-member-seat coach">
                            Coach
                          </div>
                          <div className="crew-member-name">
                            {crew.coachName}
                          </div>
                        </div>
                      )}

                      {/* Cox at top center if exists */}
                      {crew.crewMembers.some(
                        (member: any) => member.seat === 'C',
                      ) && (
                        <div className="cox-position">
                          {crew.crewMembers
                            .filter((member: any) => member.seat === 'C')
                            .map((member: any, idx: number) => (
                              <div key={idx} className="crew-member-boat">
                                <div className="crew-member-seat">
                                  {member.seat}
                                </div>
                                <div className="crew-member-name">
                                  {member.name}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Rowers in single column */}
                      <div className="rowers-layout">
                        {crew.crewMembers
                          .filter((member: any) => member.seat !== 'C')
                          .map((member: any, idx: number) => (
                            <div key={idx} className="rower-position">
                              <div className="crew-member-boat">
                                <div className="crew-member-seat">
                                  {member.seat}
                                </div>
                                <div className="crew-member-name">
                                  {member.name}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="crew-actions">
                  <div className="crew-actions-left">
                    <Link
                      to="/crews/create"
                      className="crew-action-btn primary"
                      state={{
                        editingCrew: {
                          id: crew.id,
                          boatClass: crew.boatClass,
                          clubName: crew.boatClub,
                          raceName: crew.raceName,
                          boatName: crew.boatName,
                          raceDate: crew.raceDate,
                          coachName: crew.coachName,
                          raceCategory: crew.raceCategory,
                          crewNames: crew.crewMembers
                            .filter(
                              (member: any) => member.seat !== 'C',
                            )
                            .map((member: any) => member.name),
                          coxName:
                            crew.crewMembers.find(
                              (member: any) => member.seat === 'C',
                            )?.name || '',
                        },
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Edit
                    </Link>
                  </div>
                  <div className="crew-actions-right">
                    <Link
                      to="/generate"
                      className="crew-action-btn secondary"
                      state={{ selectedCrewIds: [crew.id] }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Generate
                    </Link>
                    <button
                      className="crew-action-btn danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCrew(crew)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  )
}