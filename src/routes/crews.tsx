import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '../lib/trpc-client'
import '../dashboard.css'
import './crews.css'

export const Route = createFileRoute('/crews')({
  component: CrewsPage,
})

const boatClassHasCox = (boatClass: string) =>
  boatClass === '8+' || boatClass === '4+'

function CrewsPage() {
  const [sortBy, setSortBy] = useState<string>('recent')
  const [selectedCrews, setSelectedCrews] = useState<Set<string>>(new Set())
  const [expandedCrewMembers, setExpandedCrewMembers] = useState<Set<string>>(
    new Set(),
  )

  // Mock user state for now - in the original this comes from auth context
  const user = { name: 'Demo User' }

  const {
    data: crews = [],
    isLoading: loading,
    error,
    refetch: loadCrews,
  } = trpc.crew.getAll.useQuery()

  const deleteCrew = trpc.crew.delete.useMutation({
    onSuccess: () => loadCrews(),
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

  const getSortedCrews = () => {
    const crewsCopy = [...savedCrews]

    switch (sortBy) {
      case 'recent':
        return crewsCopy.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
      case 'club':
        return crewsCopy.sort((a, b) => a.boatClub.localeCompare(b.boatClub))
      case 'race':
        return crewsCopy.sort((a, b) =>
          (a.raceName || '').localeCompare(b.raceName || ''),
        )
      case 'boat_class':
        return crewsCopy.sort((a, b) => a.boatClass.localeCompare(b.boatClass))
      default:
        return crewsCopy
    }
  }

  const distributeCrewsIntoColumns = (
    crews: Array<any>,
    columnCount: number = 4,
  ) => {
    const columns: Array<Array<any>> = Array.from({ length: columnCount }, () => [])

    crews.forEach((crew, index) => {
      const columnIndex = index % columnCount
      columns[columnIndex].push(crew)
    })

    return columns
  }

  const handleDeleteCrew = async (crew: any) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${crew.boatName}"?\n\nThis action cannot be undone.`,
    )

    if (!isConfirmed) {
      return
    }

    try {
      await deleteCrew.mutateAsync({ id: crew.id })
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

  const handleBulkDelete = async () => {
    const crewsToDelete = Array.from(selectedCrews)
      .map((crewId) => savedCrews.find((crew) => crew.id === crewId))
      .filter((crew) => crew !== undefined)

    if (crewsToDelete.length === 0) return

    const crewNames = crewsToDelete.map((crew) => crew.boatName).join(', ')
    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${crewsToDelete.length} crew${crewsToDelete.length > 1 ? 's' : ''}?\n\nCrews: ${crewNames}\n\nThis action cannot be undone.`,
    )

    if (!isConfirmed) {
      return
    }

    try {
      for (const crewId of selectedCrews) {
        await deleteCrew.mutateAsync({ id: crewId })
      }
      setSelectedCrews(new Set())
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
          <div className="section-header">
            <div className="section-header-left">
              <span className="section-title">Crews</span>
              <span className="section-badge">{getSortedCrews().length}</span>
              <div className="crew-count">
                {selectedCrews.size > 0 ? (
                  <span className="section-badge selection">
                    {selectedCrews.size} of {savedCrews.length} crews selected
                  </span>
                ) : (
                  ``
                )}
              </div>
            </div>
            <div className="section-header-right">
              {selectedCrews.size > 0 && (
                <div className="selection-actions-inline">
                  <button
                    className="btn-text-small"
                    onClick={() => setSelectedCrews(new Set())}
                  >
                    Clear ({selectedCrews.size})
                  </button>
                  <Link
                    to="/generate"
                    className="btn-primary-small"
                    state={{
                      selectedCrewIds: Array.from(selectedCrews),
                    }}
                  >
                    Generate
                  </Link>
                  <button
                    className="btn-outline-danger-small"
                    onClick={handleBulkDelete}
                  >
                    Delete
                  </button>
                </div>
              )}

              <div className="crew-dropdown">
                {savedCrews.length > 0 && (
                  <div className="sort-dropdown">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort crews by"
                    >
                      <option value="recent">Recently Created</option>
                      <option value="club">Club Name</option>
                      <option value="race">Race Name</option>
                      <option value="boat_class">Boat Class</option>
                    </select>
                  </div>
                )}
              </div>

              <Link to="/crews/create" className="btn-primary-small">
                Create New Crew
              </Link>
            </div>
          </div>

          <div className="crews-grid">
            {distributeCrewsIntoColumns(getSortedCrews()).map(
              (column, columnIndex) => (
                <div key={columnIndex} className="crew-column">
                  {column.map((crew) => (
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
                            <span>{crew.boatClub}</span>
                            <span>•</span>
                            <span>{crew.boatClass}</span>
                          </div>
                        </div>
                        <div
                          className={`crew-card-checkbox ${selectedCrews.has(crew.id) ? 'checked' : ''}`}
                          onClick={() =>
                            handleCrewSelection(
                              crew.id,
                              !selectedCrews.has(crew.id),
                            )
                          }
                        ></div>
                      </div>

                      <div className="crew-compact-info">
                        <div className="crew-compact-row">
                          <span className="crew-compact-label">Race:</span>
                          <span className="crew-compact-value">
                            {crew.raceName || 'No race'}
                          </span>
                        </div>
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
                                crewNames: crew.crewMembers
                                  .filter(
                                    (member: any) => member.seat !== 'Cox',
                                  )
                                  .map((member: any) => member.name),
                                coxName:
                                  crew.crewMembers.find(
                                    (member: any) => member.seat === 'Cox',
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
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
