import { trpc } from '../lib/trpc-client'

export default function CrewImagesList() {
  const { data: crewImages, isLoading, error } = trpc.crewImage.getAll.useQuery()

  if (isLoading) return <div>Loading crew images...</div>
  if (error) return <div>Error loading crew images: {error.message}</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Crew Images</h2>
      {crewImages?.length === 0 ? (
        <p className="text-gray-500">No crew images found. Create your first one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {crewImages?.map((image) => (
            <div key={image.id} className="border rounded-lg p-4 shadow">
              <h3 className="font-semibold">{image.title}</h3>
              {image.description && (
                <p className="text-gray-600 mt-2">{image.description}</p>
              )}
              {image.imageUrl && (
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="mt-3 w-full h-48 object-cover rounded"
                />
              )}
              <p className="text-sm text-gray-500 mt-2">
                Created by: {image.user.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}