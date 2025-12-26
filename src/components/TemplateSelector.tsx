import { useState } from 'react'
import { trpc } from '../lib/trpc-client'

interface TemplateSelectorProps {
  selectedTemplateId?: string
  onTemplateSelect: (templateId: string) => void
  className?: string
  hideTitle?: boolean
}

export function TemplateSelector({
  selectedTemplateId,
  onTemplateSelect,
  className = '',
  hideTitle = false,
}: TemplateSelectorProps) {
  const [selectedType, setSelectedType] = useState<string>('all')

  const { data: templates, isLoading, error } = trpc.template.getAll.useQuery()

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">
          Error loading templates: {error.message}
        </div>
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-gray-500 p-8 text-center bg-gray-50 rounded-lg">
          No templates available
        </div>
      </div>
    )
  }

  // Show all templates without filtering
  const filteredTemplates = templates

  return (
    <div className={`${className}`}>
      {!hideTitle && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>
        </div>
      )}

      {/* Template grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              selectedTemplateId === template.id
                ? 'border-blue-600 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => {
              console.log('🎨 DEBUG: Template clicked:', template.id, template.name)
              onTemplateSelect(template.id)
            }}
          >
            {/* Template preview */}
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              {template.previewUrl ? (
                <img
                  src={template.previewUrl}
                  alt={`${template.name} preview`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <div class="text-center">
                          <div class="text-gray-400 text-4xl mb-2">🎨</div>
                          <div class="text-gray-600 font-medium">${template.name}</div>
                        </div>
                      </div>
                    `
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center">
                    <div className="text-gray-400 text-4xl mb-2">🎨</div>
                    <div className="text-gray-600 font-medium">
                      {template.name}
                    </div>
                  </div>
                </div>
              )}

              {/* Selection indicator */}
              {selectedTemplateId === template.id && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && selectedType !== 'all' && (
        <div className="text-gray-500 p-8 text-center bg-gray-50 rounded-lg">
          No templates found for "{selectedType}" type
        </div>
      )}
    </div>
  )
}
