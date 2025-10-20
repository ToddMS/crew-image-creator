import { createFileRoute } from '@tanstack/react-router'
import { ImageGallery } from '../components/ImageGallery'

export const Route = createFileRoute('/gallery')({
  component: GalleryPage,
})

function GalleryPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-600 mt-2">
            Browse all generated crew images
          </p>
        </div>

        <ImageGallery />
      </div>
    </div>
  )
}