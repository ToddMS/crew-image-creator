import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { trpc } from '../lib/trpc-client'

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
  const [isCreating, setIsCreating] = useState(false)
  const [editingClub, setEditingClub] = useState<string | null>(null)
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    primaryColor: '#1e3a8a',
    secondaryColor: '#ffffff',
    logoUrl: '',
  })

  const { data: clubs, isLoading, refetch } = trpc.club.getAll.useQuery()

  const createMutation = trpc.club.create.useMutation({
    onSuccess: () => {
      setIsCreating(false)
      setFormData({ name: '', primaryColor: '#1e3a8a', secondaryColor: '#ffffff', logoUrl: '' })
      refetch()
    },
    onError: (error) => {
      alert(`Failed to create club: ${error.message}`)
    },
  })

  const updateMutation = trpc.club.update.useMutation({
    onSuccess: () => {
      setEditingClub(null)
      setFormData({ name: '', primaryColor: '#1e3a8a', secondaryColor: '#ffffff', logoUrl: '' })
      refetch()
    },
    onError: (error) => {
      alert(`Failed to update club: ${error.message}`)
    },
  })

  const deleteMutation = trpc.club.delete.useMutation({
    onSuccess: () => {
      refetch()
    },
    onError: (error) => {
      alert(`Failed to delete club: ${error.message}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Club name is required')
      return
    }

    const userId = 'demo-user-id' // In a real app, get from auth context

    if (editingClub) {
      updateMutation.mutate({
        id: editingClub,
        ...formData,
        logoUrl: formData.logoUrl || undefined,
      })
    } else {
      createMutation.mutate({
        ...formData,
        logoUrl: formData.logoUrl || undefined,
        userId,
      })
    }
  }

  const handleEdit = (club: any) => {
    setEditingClub(club.id)
    setFormData({
      name: club.name,
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
      logoUrl: club.logoUrl || '',
    })
    setIsCreating(true)
  }

  const handleDelete = (clubId: string, clubName: string) => {
    if (window.confirm(`Are you sure you want to delete "${clubName}"? This action cannot be undone.`)) {
      deleteMutation.mutate({ id: clubId })
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingClub(null)
    setFormData({ name: '', primaryColor: '#1e3a8a', secondaryColor: '#ffffff', logoUrl: '' })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Club Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage your rowing club presets with custom colors
          </p>
        </div>

        {/* Create/Edit Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {editingClub ? 'Edit Club' : 'Create New Club'}
            </h2>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add New Club
              </button>
            )}
          </div>

          {(isCreating || editingClub) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Club Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter club name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="#1e3a8a"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Secondary Color *
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="#ffffff"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Color Preview</h3>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg border border-gray-300 flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Primary
                  </div>
                  <div
                    className="w-16 h-16 rounded-lg border border-gray-300 flex items-center justify-center text-gray-900 font-medium"
                    style={{ backgroundColor: formData.secondaryColor }}
                  >
                    Secondary
                  </div>
                  <div
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-center font-medium"
                    style={{
                      backgroundColor: formData.primaryColor,
                      color: formData.secondaryColor,
                    }}
                  >
                    Sample Club Banner
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      {editingClub ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    editingClub ? 'Update Club' : 'Create Club'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Clubs List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Clubs</h2>

          {isLoading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          ) : clubs && clubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubs.map((club) => (
                <div key={club.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{club.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(club)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => handleDelete(club.id, club.name)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Colors:</span>
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: club.primaryColor }}
                        title={`Primary: ${club.primaryColor}`}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: club.secondaryColor }}
                        title={`Secondary: ${club.secondaryColor}`}
                      />
                    </div>

                    {club.logoUrl && (
                      <div className="text-sm text-gray-600">
                        <span>Logo: </span>
                        <a
                          href={club.logoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          View
                        </a>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      {club.crews?.length || 0} crew{(club.crews?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Preview Banner */}
                  <div
                    className="mt-3 px-3 py-2 rounded text-center text-sm font-medium"
                    style={{
                      backgroundColor: club.primaryColor,
                      color: club.secondaryColor,
                    }}
                  >
                    {club.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No clubs created yet.</p>
              <p className="text-sm mt-1">Click "Add New Club" to create your first club preset.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}