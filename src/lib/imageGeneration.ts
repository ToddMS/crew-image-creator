interface Crew {
  id: string
  name: string
  raceName?: string | null
  crewNames: string[]
  boatType: { name: string; code: string }
  club?: { name: string; primaryColor: string; secondaryColor: string } | null
}

interface Template {
  id: string
  name: string
  templateType: string
  metadata?: any
}

interface GeneratedImage {
  imageUrl: string
  filename: string
  width: number
  height: number
}

export class ImageGenerationService {
  /**
   * Generate a crew image (placeholder implementation)
   * In a real implementation, this would call an image generation API
   * or use a canvas/image manipulation library
   */
  static async generateCrewImage(
    crew: Crew,
    template: Template
  ): Promise<GeneratedImage> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

    // For now, return a placeholder image with dynamic content
    const placeholderUrl = this.createPlaceholderImageUrl(crew, template)

    return {
      imageUrl: placeholderUrl,
      filename: `${crew.name.toLowerCase().replace(/\s+/g, '-')}-${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`,
      width: 1200,
      height: 800,
    }
  }

  /**
   * Create a placeholder image URL with crew and template information
   */
  private static createPlaceholderImageUrl(crew: Crew, template: Template): string {
    const params = new URLSearchParams({
      width: '1200',
      height: '800',
      bg: this.getBackgroundColor(template),
      text: this.getImageText(crew),
      fontsize: '24',
      fontcolor: this.getTextColor(template),
    })

    // Using a placeholder service (you might want to use a different one or implement your own)
    return `https://via.placeholder.com/1200x800/${this.getBackgroundColor(template).replace('#', '')}/${this.getTextColor(template).replace('#', '')}?text=${encodeURIComponent(this.getImageText(crew))}`
  }

  /**
   * Get background color from template metadata
   */
  private static getBackgroundColor(template: Template): string {
    if (template.metadata?.primaryColor) {
      return template.metadata.primaryColor
    }

    // Default colors based on template type
    const defaultColors = {
      classic: '#1e3a8a',
      modern: '#dc2626',
      minimal: '#f8fafc',
      elegant: '#1e40af',
    }

    return defaultColors[template.templateType as keyof typeof defaultColors] || '#1e40af'
  }

  /**
   * Get text color that contrasts with background
   */
  private static getTextColor(template: Template): string {
    if (template.metadata?.secondaryColor) {
      return template.metadata.secondaryColor
    }

    const bg = this.getBackgroundColor(template)
    // Simple contrast logic - in reality you'd want better color contrast calculation
    const isLight = ['#f8fafc', '#ffffff', '#f9fafb'].includes(bg)
    return isLight ? '#000000' : '#ffffff'
  }

  /**
   * Generate text content for the image
   */
  private static getImageText(crew: Crew): string {
    const lines = []

    lines.push(crew.name)

    if (crew.raceName) {
      lines.push(crew.raceName)
    }

    lines.push(`${crew.boatType.name} (${crew.boatType.code})`)

    if (crew.club) {
      lines.push(crew.club.name)
    }

    // Add rower names (limit to avoid too long text)
    const rowerNames = crew.crewNames
    if (rowerNames.length <= 8) {
      lines.push(...rowerNames)
    } else {
      lines.push(`${rowerNames.slice(0, 6).join(', ')} +${rowerNames.length - 6} more`)
    }

    return lines.join(' • ')
  }

  /**
   * Validate that a crew and template are compatible for image generation
   */
  static validateGenerationInput(crew: Crew, template: Template): { valid: boolean; error?: string } {
    if (!crew.crewNames || crew.crewNames.length === 0) {
      return { valid: false, error: 'Crew must have at least one rower' }
    }

    if (crew.crewNames.some(name => !name?.trim())) {
      return { valid: false, error: 'All rowers must have names' }
    }

    if (!crew.name?.trim()) {
      return { valid: false, error: 'Crew must have a name' }
    }

    return { valid: true }
  }
}

/**
 * Helper function to save generated image to database
 */
export async function saveGeneratedImage(
  crewId: string,
  templateId: string,
  userId: string,
  generatedImage: GeneratedImage
) {
  // This would typically be called from a tRPC mutation
  return {
    id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    crewId,
    templateId,
    userId,
    imageUrl: generatedImage.imageUrl,
    filename: generatedImage.filename,
    metadata: {
      width: generatedImage.width,
      height: generatedImage.height,
      generatedAt: new Date().toISOString(),
    },
    createdAt: new Date(),
  }
}