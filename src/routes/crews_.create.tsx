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
  const [raceName, setRaceName] = useState('')
  const [boatName, setBoatName] = useState('')
  const [coachName, setCoachName] = useState('')
  const [crewNames, setCrewNames] = useState<Array<string>>([])
  const [coxName, setCoxName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  // Get boat types for the mutation
  const { data: boatTypes = [] } = trpc.boatType.getAll.useQuery()

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
      description: 'Basic details about your crew',
    },
    {
      label: 'Add Members',
      description: 'Enter crew member names',
    },
    {
      label: 'Review & Save',
      description: 'Review and save your crew',
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

  const handleNext = () => {
    if (canProceedFromStep(activeStep)) {
      setActiveStep((prev) => prev + 1)
      setShowValidation(false)
    } else {
      setShowValidation(true)
    }
  }

  const handleBack = () => {
    if (activeStep === 0) {
      navigate({ to: '/crews' })
    } else {
      setActiveStep((prev) => prev - 1)
    }
  }

  const handleNameChange = (idx: number, value: string) => {
    setCrewNames((names) => names.map((n, i) => (i === idx ? value : n)))
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
                <input
                  type="text"
                  id="clubName"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className={showValidation && !clubName ? 'error' : ''}
                  placeholder="Enter club name"
                  required
                />
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
                      className={
                        showValidation && !coxName.trim() ? 'error' : ''
                      }
                      placeholder="Enter coxswain name"
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

              <div className="crew-names-grid">
                {crewNames.map((name, index) => {
                  const seatNumber = boatClassToSeats[boatClass] - index
                  const seatName =
                    seatNumber === 1
                      ? 'Bow Seat'
                      : seatNumber === boatClassToSeats[boatClass]
                        ? 'Stroke Seat'
                        : `${seatNumber} Seat`

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
                        className={
                          showValidation && !name.trim() ? 'error' : ''
                        }
                        placeholder="Enter rower name"
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
            <div className="review-section">
              <div className="review-card">
                <h3>Crew Details</h3>
                <div className="review-item">
                  <span className="review-label">Boat Class:</span>
                  <span className="review-value">
                    {boatClass} - {boatClassToBoatType(boatClass)?.name}
                  </span>
                </div>
                <div className="review-item">
                  <span className="review-label">Club:</span>
                  <span className="review-value">{clubName}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Race:</span>
                  <span className="review-value">{raceName}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Boat Name:</span>
                  <span className="review-value">{boatName}</span>
                </div>
                {coachName && (
                  <div className="review-item">
                    <span className="review-label">Coach:</span>
                    <span className="review-value">{coachName}</span>
                  </div>
                )}
              </div>

              <div className="review-card">
                <h3>Crew Members</h3>
                {boatClassHasCox(boatClass) && (
                  <div className="review-item">
                    <span className="review-label">Coxswain:</span>
                    <span className="review-value">{coxName}</span>
                  </div>
                )}
                {crewNames.map((name, index) => {
                  const seatNumber = boatClassToSeats[boatClass] - index
                  const seatName =
                    seatNumber === 1
                      ? 'Bow Seat'
                      : seatNumber === boatClassToSeats[boatClass]
                        ? 'Stroke Seat'
                        : `${seatNumber} Seat`

                  return (
                    <div key={index} className="review-item">
                      <span className="review-label">{seatName}:</span>
                      <span className="review-value">{name}</span>
                    </div>
                  )
                })}
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
        <div className="page-header">
          <h1>Create New Crew</h1>
          <p>Set up your crew lineup and member details</p>
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
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Step Content */}
        {renderStepContent(activeStep)}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn btn-secondary" onClick={handleBack}>
            ← {activeStep === 0 ? 'Back to Crews' : 'Back'}
          </button>

          <div style={{ display: 'flex', gap: '1rem' }}>
            {activeStep === steps.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={handleSaveCrew}
                disabled={saving || !canProceedFromStep(activeStep)}
              >
                {saving ? 'Saving...' : 'Save Crew'}
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!canProceedFromStep(activeStep)}
              >
                Next Step →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
