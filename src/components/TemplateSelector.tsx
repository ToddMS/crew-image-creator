import { useState } from 'react'
import { trpc } from '../lib/trpc-client'

interface TemplateSelectorProps {
  selectedTemplateId?: string
  onTemplateSelect: (templateId: string) => void
  className?: string
}

export function TemplateSelector({
  selectedTemplateId,
  onTemplateSelect,
  className = '',
}: TemplateSelectorProps) {
  const [selectedType, setSelectedType] = useState<string>('all')

  const { data: templates, isLoading, error } = trpc.template.getAll.useQuery()

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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

  const templateTypes = ['all', ...new Set(templates.map(t => t.templateType))]
  const filteredTemplates = selectedType === 'all'
    ? templates
    : templates.filter(t => t.templateType === selectedType)

  return (
    <div className={`${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>

        {/* Template type filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {templateTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
              selectedTemplateId === template.id
                ? 'border-blue-600 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => onTemplateSelect(template.id)}
          >
            {/* Template preview */}
            <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center relative">
              {template.previewUrl ? (
                <img
                  src={template.previewUrl}
                  alt={`${template.name} preview`}
                  className="w-full h-full object-cover"
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
                    <div className="text-gray-600 font-medium">{template.name}</div>
                  </div>
                </div>
              )}

              {/* Selection indicator */}
              {selectedTemplateId === template.id && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Template info */}
            <div className="p-3">
              <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="capitalize">{template.templateType}</span>
                {template.metadata && (
                  <div className="flex gap-1">
                    {template.metadata.primaryColor && (
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: template.metadata.primaryColor }}
                        title={`Primary: ${template.metadata.primaryColor}`}
                      />
                    )}
                    {template.metadata.secondaryColor && (
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: template.metadata.secondaryColor }}
                        title={`Secondary: ${template.metadata.secondaryColor}`}
                      />
                    )}
                  </div>
                )}
              </div>
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