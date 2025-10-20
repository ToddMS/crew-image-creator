import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Eye, EyeOff, Plus } from 'lucide-react'
import { trpc } from '../lib/trpc-client'
import CrewForm from '../components/CrewForm'

export const Route = createFileRoute('/crews')({
  component: CrewsPage,
})

function CrewsPage() {
  const [showForm, setShowForm] = useState(false)
  const [showBoatTypes, setShowBoatTypes] = useState(false)

  const {
    data: crews,
    isLoading: crewsLoading,
    refetch: refetchCrews,
  } = trpc.crew.getAll.useQuery()
  const { data: boatTypes, isLoading: boatTypesLoading } =
    trpc.boatType.getAll.useQuery()

  // Get demo user (in a real app, this would come from auth)
  const { data: users } = trpc.user.getAll.useQuery()
  const demoUser = users?.[0] // Use first user from seed data

  if (crewsLoading || boatTypesLoading) {
    return <div className="p-6">Loading crews and boat types...</div>
  }

  const handleCrewCreated = () => {
    setShowForm(false)
    refetchCrews()
  }

  if (!demoUser) {
    return <div className="p-6">Loading user data...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Crew Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          {showForm ? 'Cancel' : 'Create New Crew'}
        </button>
      </div>

      {/* Crew Creation Form */}
      {showForm && (
        <div className="mb-8">
          <CrewForm userId={demoUser.id} onSuccess={handleCrewCreated} />
        </div>
      )}

      {/* Boat Types Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setShowBoatTypes(!showBoatTypes)}
            className="flex items-center gap-2 text-xl font-semibold hover:text-blue-600"
          >
            {showBoatTypes ? <EyeOff size={20} /> : <Eye size={20} />}
            Available Boat Types ({boatTypes?.length})
          </button>
        </div>

        {showBoatTypes && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {boatTypes?.map((boatType) => (
              <div
                key={boatType.id}
                className="bg-white border rounded-lg p-4 shadow-sm"
              >
                <div className="font-semibold text-lg">{boatType.code}</div>
                <div className="text-sm text-gray-600">{boatType.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {boatType.seats} seats • {boatType.category}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing Crews Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Current Crews</h2>
        {crews?.length === 0 ? (
          <p className="text-gray-500">
            No crews created yet. Create your first crew!
          </p>
        ) : (
          <div className="space-y-4">
            {crews?.map((crew) => (
              <div
                key={crew.id}
                className="bg-white border rounded-lg p-6 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{crew.name}</h3>
                    {crew.club ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: crew.club.primaryColor }}
                        />
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: crew.club.secondaryColor }}
                        />
                        <p className="text-gray-600">{crew.club.name}</p>
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        {crew.clubName || 'No club'}
                      </p>
                    )}
                    {crew.raceName && (
                      <p className="text-sm text-gray-500">{crew.raceName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{crew.boatType.code}</div>
                    <div className="text-sm text-gray-500">
                      {crew.boatType.name}
                    </div>
                  </div>
                </div>

                {crew.boatName && (
                  <p className="text-sm text-gray-600 mb-2">
                    Boat: <span className="font-medium">{crew.boatName}</span>
                  </p>
                )}

                {crew.coachName && (
                  <p className="text-sm text-gray-600 mb-3">
                    Coach: <span className="font-medium">{crew.coachName}</span>
                  </p>
                )}

                <div>
                  <h4 className="font-medium mb-2">Crew Members:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {crew.crewNames.map((name, index) => (
                      <div
                        key={index}
                        className="text-sm bg-gray-50 rounded px-2 py-1"
                      >
                        <span className="font-medium">{index + 1}:</span> {name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-400">
                  Created by {crew.user.name} •{' '}
                  {new Date(crew.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
