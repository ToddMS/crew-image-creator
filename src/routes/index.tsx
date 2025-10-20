import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  // For now, let's disable tRPC queries and use mock data to fix SSR issues
  const recentImages = []
  const totalCrews = []

  const features = [
    {
      icon: '🚣‍♂️',
      title: 'Create Crews',
      description: 'Build your rowing crews with detailed boat types, positions, and club affiliations.',
      link: '/crews',
      linkText: 'Manage Crews',
    },
    {
      icon: '🎨',
      title: 'Generate Images',
      description: 'Create stunning social media graphics with professional templates.',
      link: '/generate',
      linkText: 'Generate Now',
    },
    {
      icon: '🖼️',
      title: 'Gallery',
      description: 'Browse, download, and manage all your generated crew images.',
      link: '/gallery',
      linkText: 'View Gallery',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🚣‍♂️</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Crew Image Generator
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Create professional rowing crew images for social media in seconds.
            Build your crews, choose templates, and generate stunning graphics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/crews"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
            <Link
              to="/gallery"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              View Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need to create amazing crew images
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <Link
                  to={feature.link}
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {feature.linkText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Ready to get started?
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Join the growing community of rowing clubs and teams using our
                platform to create professional crew images. Perfect for social
                media, team announcements, and race day promotions.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {totalCrews.length || 0}
                  </div>
                  <div className="text-gray-600">Crews Created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {recentImages.length || 0}
                  </div>
                  <div className="text-gray-600">Images Generated</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Start Guide
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <div className="font-medium text-gray-900">Create a Crew</div>
                    <div className="text-sm text-gray-600">Add your rowers, boat type, and club details</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <div className="font-medium text-gray-900">Choose Template</div>
                    <div className="text-sm text-gray-600">Select from our professional design templates</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <div className="font-medium text-gray-900">Generate & Share</div>
                    <div className="text-sm text-gray-600">Create your image and download for social media</div>
                  </div>
                </div>
              </div>
              <Link
                to="/crews"
                className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mt-6"
              >
                Start Creating
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Images */}
      {recentImages.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Recent Images
              </h2>
              <Link
                to="/gallery"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentImages.slice(0, 4).map((image) => (
                <div
                  key={image.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/3] bg-gray-100">
                    <img
                      src={image.imageUrl}
                      alt={`${image.crew?.name || 'Crew'} image`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 truncate">
                      {image.crew?.name || 'Unknown Crew'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(image.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
