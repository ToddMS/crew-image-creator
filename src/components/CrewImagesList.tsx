import { trpc } from '../lib/trpc-client'

export default function CrewImagesList() {
  const {
    data: savedImages,
    isLoading,
    error,
  } = trpc.savedImage.getAll.useQuery()

  if (isLoading) return <div>Loading saved images...</div>
  if (error) return <div>Error loading saved images: {error.message}</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Saved Crew Images</h2>
      {savedImages?.length === 0 ? (
        <p className="text-gray-500">
          No saved images found. Create your first crew and generate an image!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedImages?.map((image) => (
            <div key={image.id} className="border rounded-lg p-4 shadow">
              <img
                src={image.imageUrl}
                alt={image.filename}
                className="w-full h-48 object-cover rounded mb-3"
              />
              <h3 className="font-semibold">{image.crew.name}</h3>
              <p className="text-sm text-gray-600">{image.crew.clubName}</p>
              {image.crew.raceName && (
                <p className="text-sm text-gray-600">{image.crew.raceName}</p>
              )}
              <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                <span>{image.template.name}</span>
                <span>{new Date(image.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {image.crew.boatType.name} • Created by {image.user.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
