import { useEffect, useState } from 'react'
import { Save, Users } from 'lucide-react'
import { trpc } from '../lib/trpc-client'

interface CrewFormProps {
  onSuccess?: () => void
  userId: string
}

export default function CrewForm({ onSuccess, userId }: CrewFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    clubId: '',
    clubName: '',
    raceName: '',
    raceDate: '',
    boatName: '',
    coachName: '',
    raceCategory: '',
    crewNames: [] as Array<string>,
    boatTypeId: '',
  })

  const [useClubPreset, setUseClubPreset] = useState(true)
  const [selectedBoatType, setSelectedBoatType] = useState<any>(null)

  const { data: boatTypes } = trpc.boatType.getAll.useQuery()
  const { data: clubs } = trpc.club.getByUserId.useQuery({ userId })

  const createCrew = trpc.crew.create.useMutation({
    onSuccess: () => {
      setFormData({
        name: '',
        clubId: '',
        clubName: '',
        raceName: '',
        raceDate: '',
        boatName: '',
        coachName: '',
        raceCategory: '',
        crewNames: [],
        boatTypeId: '',
      })
      setSelectedBoatType(null)
      onSuccess?.()
    },
  })

  useEffect(() => {
    if (selectedBoatType) {
      const newCrewNames = Array(selectedBoatType.seats).fill('')
      setFormData((prev) => ({ ...prev, crewNames: newCrewNames }))
    }
  }, [selectedBoatType])

  const handleBoatTypeChange = (boatTypeId: string) => {
    const boatType = boatTypes?.find((bt) => bt.id === boatTypeId) || null
    setSelectedBoatType(boatType)
    setFormData((prev) => ({ ...prev, boatTypeId }))
  }

  const updateCrewName = (index: number, name: string) => {
    const newCrewNames = [...formData.crewNames]
    newCrewNames[index] = name
    setFormData((prev) => ({ ...prev, crewNames: newCrewNames }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const submitData = {
      ...formData,
      userId,
      clubId: useClubPreset ? formData.clubId || undefined : undefined,
      clubName: useClubPreset ? undefined : formData.clubName,
    }

    createCrew.mutate(submitData)
  }

  const getPositionLabel = (index: number) => {
    if (!selectedBoatType) return `Position ${index + 1}`

    const isEight = selectedBoatType.code === '8+'
    const hasCox = selectedBoatType.code.includes('+')

    if (hasCox && index === selectedBoatType.seats - 1) {
      return 'Coxswain'
    }

    if (isEight) {
      const positions = ['Bow', '2', '3', '4', '5', '6', '7', 'Stroke']
      return positions[index] || `Position ${index + 1}`
    }

    return `Position ${index + 1}`
  }

  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Users size={24} className="text-blue-600" />
        <h2 className="text-2xl font-semibold">Create New Crew</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Crew Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Men's Senior Eight"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Boat Type *
            </label>
            <select
              value={formData.boatTypeId}
              onChange={(e) => handleBoatTypeChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select boat type...</option>
              {boatTypes?.map((boatType) => (
                <option key={boatType.id} value={boatType.id}>
                  {boatType.code} - {boatType.name} ({boatType.seats} seats)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Club Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Club</label>
          <div className="mb-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={useClubPreset}
                onChange={() => setUseClubPreset(true)}
                className="text-blue-600"
              />
              <span>Use saved club preset</span>
            </label>
            <label className="flex items-center gap-2 mt-1">
              <input
                type="radio"
                checked={!useClubPreset}
                onChange={() => setUseClubPreset(false)}
                className="text-blue-600"
              />
              <span>Enter custom club name</span>
            </label>
          </div>

          {useClubPreset ? (
            <select
              value={formData.clubId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clubId: e.target.value }))
              }
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select club preset...</option>
              {clubs?.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData.clubName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clubName: e.target.value }))
              }
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter club name..."
            />
          )}
        </div>

        {/* Optional Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Race/Event</label>
              <input
                type="text"
                value={formData.raceName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, raceName: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Head of the River"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Race Date</label>
              <input
                type="text"
                value={formData.raceDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, raceDate: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., March 15, 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Boat Name</label>
              <input
                type="text"
                value={formData.boatName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, boatName: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Thunder"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Coach</label>
              <input
                type="text"
                value={formData.coachName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, coachName: e.target.value }))
                }
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Coach Smith"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Race Category</label>
            <input
              type="text"
              value={formData.raceCategory}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, raceCategory: e.target.value }))
              }
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Heat 2, Final H"
            />
          </div>
        </div>

        {/* Crew Members */}
        {selectedBoatType && (
          <div>
            <h3 className="text-lg font-medium mb-3">
              Crew Members ({selectedBoatType.name} - {selectedBoatType.seats}{' '}
              seats)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {formData.crewNames.map((name, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium mb-1">
                    {getPositionLabel(index)}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updateCrewName(index, e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter name..."
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={
              createCrew.isPending || !formData.name || !formData.boatTypeId
            }
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {createCrew.isPending ? 'Creating...' : 'Create Crew'}
          </button>
        </div>

        {createCrew.error && (
          <div className="text-red-600 text-sm">
            Error: {createCrew.error.message}
          </div>
        )}
      </form>
    </div>
  )
}
