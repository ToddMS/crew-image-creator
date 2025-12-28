import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { trpc } from '../lib/trpc-client'
import './create-crew.css'

export const Route = createFileRoute('/crews_/create')({
  component: CreateCrewPage,
})

const boatClassToSeats: Record<string, number> = {
  '8+': 8,
  '4+': 4,
  '4-': 4,
  '4x': 4,
  '2-': 2,
  '2x': 2,
  '1x': 1,
}

const boatClassHasCox = (boatClass: string) =>
  boatClass === '8+' || boatClass === '4+'

const boatClassToBoatType = (boatClass: string) => {
  const mapping: Record<
    string,
    { id: number; value: string; seats: number; name: string }
  > = {
    '8+': { id: 1, value: '8+', seats: 8, name: 'Eight' },
    '4+': { id: 2, value: '4+', seats: 4, name: 'Coxed Four' },
    '4-': { id: 3, value: '4-', seats: 4, name: 'Coxless Four' },
    '4x': { id: 6, value: '4x', seats: 4, name: 'Quad Sculls' },
    '2-': { id: 7, value: '2-', seats: 2, name: 'Coxless Pair' },
    '2x': { id: 4, value: '2x', seats: 2, name: 'Double Sculls' },
    '1x': { id: 5, value: '1x', seats: 1, name: 'Single Sculls' },
  }
  return mapping[boatClass]
}

function CreateCrewPage() {
  const navigate = useNavigate()

  // Get the first user from the database - in production this would come from auth context
  const { data: users } = trpc.user.getAll.useQuery()
  const user = users?.[0]

  const [activeStep, setActiveStep] = useState(0)
  const [boatClass, setBoatClass] = useState('')
  const [clubName, setClubName] = useState('')
  const [selectedClubId, setSelectedClubId] = useState('')
  const [raceName, setRaceName] = useState('')
  const [boatName, setBoatName] = useState('')
  const [coachName, setCoachName] = useState('')
  const [crewNames, setCrewNames] = useState<Array<string>>([])
  const [coxName, setCoxName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [showClubDropdown, setShowClubDropdown] = useState(false)
  const [filteredClubs, setFilteredClubs] = useState<string[]>([])
  const [highlightedClubIndex, setHighlightedClubIndex] = useState(-1)

  // Get boat types for the mutation
  const { data: boatTypes = [] } = trpc.boatType.getAll.useQuery()

  // Get existing clubs for the dropdown
  const { data: existingClubs = [] } = trpc.club.getAll.useQuery()

  const createCrewMutation = trpc.crew.create.useMutation({
    onSuccess: () => {
      alert(`Crew "${boatName}" created successfully!`)
      navigate({ to: '/crews' })
    },
    onError: (error) => {
      alert(`Failed to create crew: ${error.message}`)
      setSaving(false)
    },
  })

  const steps = [
    {
      label: 'Crew Information',
    },
    {
      label: 'Add Crew',
    },
    {
      label: 'Review & Save',
    },
  ]

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(boatClass && clubName && raceName && boatName)
      case 1:
        return (
          crewNames.every((name) => name.trim().length > 0) &&
          (!boatClassHasCox(boatClass) || coxName.trim().length > 0)
        )
      default:
        return true
    }
  }

  const getValidationMessage = (step: number): string => {
    const missingFields: string[] = []

    switch (step) {
      case 0:
        if (!boatClass) missingFields.push('Boat Class')
        if (!clubName) missingFields.push('Club Name')
        if (!raceName) missingFields.push('Race Name')
        if (!boatName) missingFields.push('Boat Name')
        break
      case 1:
        if (crewNames.some(name => !name.trim())) missingFields.push('All crew member names')
        if (boatClassHasCox(boatClass) && !coxName.trim()) missingFields.push('Coxswain name')
        break
    }

    if (missingFields.length === 0) return ''
    if (missingFields.length === 1) return `Please fill in: ${missingFields[0]}`
    if (missingFields.length === 2) return `Please fill in: ${missingFields.join(' and ')}`
    return `Please fill in: ${missingFields.slice(0, -1).join(', ')} and ${missingFields.slice(-1)}`
  }

  const handleNext = () => {
    if (canProceedFromStep(activeStep)) {
      setActiveStep((prev) => prev + 1)
      setShowValidation(false)
    } else {
      setShowValidation(true)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const handleNameChange = (idx: number, value: string) => {
    setCrewNames((names) => names.map((n, i) => (i === idx ? value : n)))
  }

  // Club combobox handlers
  const handleClubNameChange = (value: string) => {
    setClubName(value)

    // If manually typing (not selecting from dropdown), clear the clubId
    const exactMatch = existingClubs.find(club => club.name === value)
    setSelectedClubId(exactMatch?.id || '')

    // Filter clubs based on input
    const clubNames = existingClubs.map(club => club.name)
    const filtered = value.length === 0
      ? clubNames.slice(0, 5) // Show first 5 clubs when no input
      : clubNames.filter(name =>
          name.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5) // Limit to 5 results

    setFilteredClubs(filtered)
    setShowClubDropdown(true) // Always show dropdown when focused
    setHighlightedClubIndex(-1)
  }

  const selectClub = (clubName: string) => {
    setClubName(clubName)

    // Find the club ID if this is an existing club
    const matchingClub = existingClubs.find(club => club.name === clubName)
    setSelectedClubId(matchingClub?.id || '')

    setShowClubDropdown(false)
    setHighlightedClubIndex(-1)
  }

  const handleClubKeyDown = (e: React.KeyboardEvent) => {
    // Handle dropdown navigation if dropdown is shown
    if (showClubDropdown && filteredClubs.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedClubIndex(prev =>
            prev < filteredClubs.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedClubIndex(prev => prev > 0 ? prev - 1 : prev)
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedClubIndex >= 0) {
            selectClub(filteredClubs[highlightedClubIndex])
          }
          return
        case 'Escape':
          setShowClubDropdown(false)
          setHighlightedClubIndex(-1)
          break
      }
    }

    // Handle regular Enter key navigation when no dropdown or no selection
    handleInputKeyDown(e, 1, 5, false) // Club name is field index 1 out of 5 total fields in step 1
  }

  // Handle Enter key navigation between fields
  const handleInputKeyDown = (e: React.KeyboardEvent, fieldIndex: number, totalFields: number, isLastStep: boolean = false) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      if (fieldIndex < totalFields - 1) {
        // Move to next field
        const nextFieldIndex = fieldIndex + 1
        const inputs = document.querySelectorAll('input[type="text"], select')
        const nextInput = inputs[nextFieldIndex] as HTMLInputElement | HTMLSelectElement
        if (nextInput) {
          nextInput.focus()
        }
      } else {
        // Last field - advance to next step or save
        if (isLastStep) {
          // On last step, trigger save
          handleSaveCrew()
        } else {
          // On other steps, go to next step
          handleNext()
        }
      }
    }
  }

  // Handle crew member input navigation
  const handleCrewMemberKeyDown = (e: React.KeyboardEvent, memberIndex: number, totalMembers: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()

      if (memberIndex < totalMembers - 1) {
        // Move to next crew member field
        setTimeout(() => {
          const inputs = document.querySelectorAll('input[required]')
          const currentStepInputs = Array.from(inputs).filter(input =>
            input.closest('.form-container') !== null
          )
          const nextInput = currentStepInputs[memberIndex + 1] as HTMLInputElement
          if (nextInput) {
            nextInput.focus()
          }
        }, 0)
      } else {
        // Last crew member field - go to next step
        handleNext()
      }
    }
  }

  const handleSaveCrew = async () => {
    if (!user) {
      alert('Please sign in to save your crew')
      return
    }

    setSaving(true)
    try {
      const selectedBoatType = boatTypes.find((bt) => bt.code === boatClass)
      if (!selectedBoatType) {
        throw new Error('Invalid boat type selected')
      }

      const allCrewNames = [
        ...(boatClassHasCox(boatClass) ? [coxName] : []),
        ...crewNames,
      ]

      await createCrewMutation.mutateAsync({
        name: boatName,
        clubName: clubName,
        clubId: selectedClubId || undefined,
        raceName: raceName,
        boatTypeId: selectedBoatType.id,
        crewNames: allCrewNames,
        coachName: coachName.trim() || undefined,
        userId: user.id,
      })
    } catch (error) {
      console.error('Error saving crew:', error)
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="form-container">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="boatClass">
                  Boat Class <span className="required">*</span>
                </label>
                <select
                  id="boatClass"
                  value={boatClass}
                  onChange={(e) => {
                    const newBoatClass = e.target.value
                    setBoatClass(newBoatClass)
                    setCrewNames(
                      Array(boatClassToSeats[newBoatClass] || 0).fill(''),
                    )
                    setCoxName('')
                  }}
                  onKeyDown={(e) => handleInputKeyDown(e, 0, 5, false)} // Boat class is field 0 out of 5 in step 1
                  className={showValidation && !boatClass ? 'error' : ''}
                  required
                >
                  <option value="">Select boat class</option>
                  <option value="8+">8+ (Eight)</option>
                  <option value="4+">4+ (Coxed Four)</option>
                  <option value="4-">4- (Coxless Four)</option>
                  <option value="4x">4x (Quad Sculls)</option>
                  <option value="2-">2- (Coxless Pair)</option>
                  <option value="2x">2x (Double Sculls)</option>
                  <option value="1x">1x (Single Sculls)</option>
                </select>
                {showValidation && !boatClass && (
                  <div className="error-message">
                    Please select a boat class
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="clubName">
                  Club Name <span className="required">*</span>
                </label>
                <div className="combobox-container">
                  <input
                    type="text"
                    id="clubName"
                    value={clubName}
                    onChange={(e) => handleClubNameChange(e.target.value)}
                    onKeyDown={handleClubKeyDown}
                    onFocus={() => {
                      const clubNames = existingClubs.map(club => club.name)
                      const filtered = clubName.length === 0
                        ? clubNames.slice(0, 5) // Show first 5 clubs when empty
                        : clubNames.filter(name =>
                            name.toLowerCase().includes(clubName.toLowerCase())
                          ).slice(0, 5)

                      setFilteredClubs(filtered)
                      setShowClubDropdown(filtered.length > 0)
                    }}
                    onBlur={(e) => {
                      // Delay hiding dropdown to allow click selection
                      setTimeout(() => setShowClubDropdown(false), 150)
                    }}
                    className={showValidation && !clubName ? 'error' : ''}
                    placeholder="Enter or search club name"
                    required
                    autoComplete="off"
                  />
                  {showClubDropdown && filteredClubs.length > 0 && (
                    <div className="combobox-dropdown">
                      {filteredClubs.map((club, index) => (
                        <div
                          key={club}
                          className={`combobox-option ${index === highlightedClubIndex ? 'highlighted' : ''}`}
                          onClick={() => selectClub(club)}
                          onMouseEnter={() => setHighlightedClubIndex(index)}
                        >
                          {club}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {showValidation && !clubName && (
                  <div className="error-message">Please enter club name</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="raceName">
                  Race/Event Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="raceName"
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, 2, 5, false)} // Race name is field 2 out of 5 in step 1
                  className={showValidation && !raceName ? 'error' : ''}
                  placeholder="Enter race or event name"
                  required
                />
                {showValidation && !raceName && (
                  <div className="error-message">Please enter race name</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="boatName">
                  Boat Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="boatName"
                  value={boatName}
                  onChange={(e) => setBoatName(e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, 3, 5, false)} // Boat name is field 3 out of 5 in step 1
                  className={showValidation && !boatName ? 'error' : ''}
                  placeholder="Enter boat name"
                  required
                />
                {showValidation && !boatName && (
                  <div className="error-message">Please enter boat name</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="coachName">Coach Name (Optional)</label>
                <input
                  type="text"
                  id="coachName"
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  onKeyDown={(e) => handleInputKeyDown(e, 4, 5, false)} // Coach name is field 4 out of 5 in step 1 (last field in step 1)
                  placeholder="Enter coach name (optional)"
                />
              </div>
            </div>
          </div>
        )

      case 1:
        if (!canProceedFromStep(0)) {
          return (
            <div
              className="form-container"
              style={{ textAlign: 'center', padding: '3rem' }}
            >
              <p
                style={{
                  fontSize: '1.1rem',
                  color: '#6b7280',
                  marginBottom: '1rem',
                }}
              >
                ⬅️ Please complete crew information first
              </p>
              <p style={{ color: '#9ca3af' }}>
                Go back to fill in boat class, club name, race name, and boat
                name
              </p>
            </div>
          )
        }

        return (
          <div className="form-container">
            <div className="crew-names-section">
              {boatClassHasCox(boatClass) && (
                <div className="cox-input">
                  <div className="crew-name-input">
                    <div className="seat-label">
                      Coxswain <span className="required">*</span>
                    </div>
                    <input
                      type="text"
                      value={coxName}
                      onChange={(e) => setCoxName(e.target.value)}
                      onKeyDown={(e) => handleCrewMemberKeyDown(e, 0, crewNames.length + 1)} // Cox is first field
                      className={
                        showValidation && !coxName.trim() ? 'error' : ''
                      }
                      placeholder="Enter coxswain's name"
                      required
                    />
                    {showValidation && !coxName.trim() && (
                      <div className="error-message">
                        Please enter coxswain name
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={`crew-names-grid ${boatClass === '1x' ? 'single-sculler-grid' : boatClass === '2x' || boatClass === '2-' ? 'two-seat-grid' : ''}`}>
                {crewNames.map((name, index) => {
                  const seatNumber = boatClassToSeats[boatClass] - index
                  const seatName =
                    boatClass === '1x'
                      ? 'Single Sculler'
                      : seatNumber === 1
                        ? 'Bow Seat'
                        : seatNumber === boatClassToSeats[boatClass]
                          ? 'Stroke Seat'
                          : `${seatNumber} Seat`

                  const placeholderText =
                    boatClass === '1x'
                      ? "Enter sculler's name"
                      : seatNumber === 1
                        ? "Enter bow's name"
                        : seatNumber === boatClassToSeats[boatClass]
                          ? "Enter stroke's name"
                          : `Enter ${seatNumber}'s name`

                  return (
                    <div key={index} className="crew-name-input">
                      <div className="seat-label">
                        {seatName} <span className="required">*</span>
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) =>
                          handleNameChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleCrewMemberKeyDown(e, boatClassHasCox(boatClass) ? index + 1 : index, crewNames.length + (boatClassHasCox(boatClass) ? 1 : 0))}
                        className={
                          showValidation && !name.trim() ? 'error' : ''
                        }
                        placeholder={placeholderText}
                        required
                      />
                      {showValidation && !name.trim() && (
                        <div className="error-message">
                          Please enter rower name
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="form-container">
            <div className="review-section-clean">
              {/* Crew Details in 2-column grid */}
              <div className="crew-details-grid">
                <div className="review-item-compact">
                  <span className="review-label">Boat Class:</span>
                  <span className="review-value">
                    {boatClassToBoatType(boatClass).name} - {boatClass}
                  </span>
                </div>
                <div className="review-item-compact">
                  <span className="review-label">Club:</span>
                  <span className="review-value">{clubName}</span>
                </div>
                <div className="review-item-compact">
                  <span className="review-label">Race:</span>
                  <span className="review-value">{raceName}</span>
                </div>
                <div className="review-item-compact">
                  <span className="review-label">Boat Name:</span>
                  <span className="review-value">{boatName}</span>
                </div>
                {coachName && (
                  <div className="review-item-compact crew-detail-coach">
                    <span className="review-label">Coach:</span>
                    <span className="review-value">{coachName}</span>
                  </div>
                )}
              </div>

              {/* Crew Members */}
              <div className="crew-members-compact">
                {boatClassHasCox(boatClass) && (
                  <div className="review-item-compact">
                    <span className="review-label">Coxswain:</span>
                    <span className="review-value">{coxName}</span>
                  </div>
                )}

                {/* All crew members in correct rowing order - Cox, Stroke, 7, 6, 5, 4, 3, 2, Bow */}
                <div className="crew-members-grid">
                  {crewNames.map((name, index) => {
                    const seatNumber = boatClassToSeats[boatClass] - index
                    const seatName = boatClass === '1x' ? 'Single sculler' :
                                    seatNumber === 1 ? 'Bow seat' :
                                    seatNumber === boatClassToSeats[boatClass] ? 'Stroke seat' :
                                    `${seatNumber} seat`

                    return (
                      <div key={seatNumber} className="review-item-compact">
                        <span className="review-label">{seatName}:</span>
                        <span className="review-value">{name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!user) {
    return (
      <div className="create-crew-container">
        <div className="container">
          <div className="empty-state">
            <h2>Create Crew</h2>
            <p>Sign in to create and manage your crew lineups</p>
            <button className="btn btn-primary">Sign In to Create Crew</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="create-crew-container">
      <div className="container">
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {activeStep === 0 ? (
            <button
              className="btn-text-small"
              onClick={() => navigate({ to: '/crews' })}
            >
              ← Back to Crews
            </button>
          ) : (
            <button className="btn-text-small" onClick={handleBack}>
              ← Back
            </button>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            {activeStep === steps.length - 1 ? (
              <button
                className="btn-success-small"
                onClick={handleSaveCrew}
                disabled={saving || !canProceedFromStep(activeStep)}
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    Save Crew
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17,21 17,13 7,13 7,21"/>
                      <polyline points="7,3 7,8 15,8"/>
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <button
                className="btn-primary-small"
                onClick={handleNext}
              >
                Next Step →
              </button>
            )}
          </div>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {steps.map((step, index) => (
            <div
              key={step.label}
              className={`step ${
                activeStep > index
                  ? 'completed'
                  : activeStep === index
                    ? 'active'
                    : 'inactive'
              }`}
            >
              <div className="step-icon">
                {activeStep > index ? '✓' : index + 1}
              </div>
              <div className="step-content">
                <div className="step-label">{step.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        {renderStepContent(activeStep)}
      </div>
    </div>
  )
}
