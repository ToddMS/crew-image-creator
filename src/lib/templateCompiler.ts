export interface TemplateData {
  CLUB_NAME: string
  CREW_NAME: string
  BOAT_TYPE: string
  BOAT_CODE: string
  SEATS: number
  RACE_NAME: string
  BOAT_NAME: string
  COACH_NAME: string
  CREW_MEMBERS: Array<{
    POSITION: string
    NAME: string
  }>
  BOAT_IMAGE_URL?: string
  BOAT_IMAGE_AVAILABLE: boolean
}

export interface ColorScheme {
  primaryColor: string
  secondaryColor: string
}

export interface PresetColorScheme extends ColorScheme {
  name: string
  description: string
}

export interface TemplateBoatImageConfig {
  enabled: boolean
  position: 'center' | 'left' | 'right' | 'background' | 'top' | 'bottom'
  size: 'small' | 'medium' | 'large'
  opacity?: number
  className?: string
  style?: Record<string, string>
}

export interface TemplateMetadata {
  boatImage?: TemplateBoatImageConfig
  dimensions?: { width: number; height: number }
  [key: string]: any
}

export class TemplateCompiler {
  /**
   * Available boat images - maps boat codes to clean filenames
   */
  private static readonly BOAT_IMAGE_MAP: Record<string, string> = {
    '2-': '2-.png',
    '4+': '4+.png',
    '8+': '8Coxed.png',
  }

  /**
   * Check if boat image exists for the given boat code
   */
  static getBoatImageInfo(boatCode: string): {
    available: boolean
    url?: string
  } {
    const filename = this.BOAT_IMAGE_MAP[boatCode]
    const available = !!filename

    if (available) {
      try {
        // Convert to absolute file path for puppeteer
        const fs = require('node:fs')
        const path = require('node:path')
        const imagePath = path.join(
          process.cwd(),
          'public',
          'boat-images',
          filename,
        )

        if (fs.existsSync(imagePath)) {
          // Convert to base64 data URL for reliable loading in puppeteer
          const imageBuffer = fs.readFileSync(imagePath)
          const base64 = imageBuffer.toString('base64')
          const dataUrl = `data:image/png;base64,${base64}`
          return { available: true, url: dataUrl }
        }
      } catch (error) {
        console.error('Error loading boat image:', error)
      }
    }

    return {
      available,
      url: available ? `/boat-images/${filename}` : undefined,
    }
  }

  /**
   * Compile a template with crew data and color scheme
   */
  static compileTemplate(
    templateHtml: string,
    data: TemplateData,
    colors: ColorScheme,
    templateMetadata?: TemplateMetadata,
  ): string {
    let compiledHtml = templateHtml

    // Replace single variables
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'CREW_MEMBERS') {
        const placeholder = `{{${key}}}`
        compiledHtml = compiledHtml.replace(
          new RegExp(placeholder, 'g'),
          String(value),
        )
      }
    })

    // Handle crew members array
    compiledHtml = this.compileCrewMembers(compiledHtml, data.CREW_MEMBERS)

    // Handle boat image with template-specific positioning
    compiledHtml = this.applyBoatImage(
      compiledHtml,
      data,
      templateMetadata?.boatImage,
    )

    // Apply color scheme
    compiledHtml = this.applyColorScheme(compiledHtml, colors)

    return compiledHtml
  }

  /**
   * Compile the crew members section
   */
  private static compileCrewMembers(
    html: string,
    crewMembers: Array<{ POSITION: string; NAME: string }>,
  ): string {
    // Find the crew member template block
    const templateStart = html.indexOf('{{#CREW_MEMBERS}}')
    const templateEnd =
      html.indexOf('{{/CREW_MEMBERS}}') + '{{/CREW_MEMBERS}}'.length

    if (templateStart === -1 || templateEnd === -1) {
      return html
    }

    // Extract the template
    const template = html.substring(
      templateStart + '{{#CREW_MEMBERS}}'.length,
      templateEnd - '{{/CREW_MEMBERS}}'.length,
    )

    // Generate HTML for each crew member
    const crewMemberHtml = crewMembers
      .map((member) => {
        let memberHtml = template
        memberHtml = memberHtml.replace(/\{\{POSITION\}\}/g, member.POSITION)
        memberHtml = memberHtml.replace(/\{\{NAME\}\}/g, member.NAME)

        // Special styling for Coxswain
        if (member.POSITION.toLowerCase().includes('cox')) {
          memberHtml = memberHtml.replace(
            'background: #f9fafb;',
            'background: linear-gradient(135deg, #fdf2f8, #fce7f3);',
          )
          memberHtml = memberHtml.replace(
            'border: 1px solid #e5e7eb;',
            'border: 2px solid #f472b6;',
          )
        }

        return memberHtml
      })
      .join('')

    // Replace the template block with compiled HTML
    return (
      html.substring(0, templateStart) +
      crewMemberHtml +
      html.substring(templateEnd)
    )
  }

  /**
   * Apply color scheme to the template
   */
  private static applyColorScheme(html: string, colors: ColorScheme): string {
    let styledHtml = html

    // Apply comprehensive color mappings for all templates
    styledHtml = this.applyGradientColors(styledHtml, colors)
    styledHtml = this.applySolidColors(styledHtml, colors)
    styledHtml = this.applyBorderColors(styledHtml, colors)
    styledHtml = this.applySpecialColors(styledHtml, colors)

    return styledHtml
  }

  /**
   * Apply gradient color replacements
   */
  private static applyGradientColors(
    html: string,
    colors: ColorScheme,
  ): string {
    const gradientMappings = [
      // Header gradients
      {
        from: 'background: linear-gradient(135deg, #059669 0%, #10b981 50%, #d946ef 100%);',
        to: `background: linear-gradient(135deg, ${colors.primaryColor} 0%, ${colors.secondaryColor} 50%, ${colors.primaryColor} 100%);`,
      },
      // Footer gradients
      {
        from: 'background: linear-gradient(90deg, #059669 0%, #10b981 50%, #d946ef 100%);',
        to: `background: linear-gradient(90deg, ${colors.primaryColor} 0%, ${colors.secondaryColor} 50%, ${colors.primaryColor} 100%);`,
      },
      // Boat silhouette gradients
      {
        from: 'background: linear-gradient(90deg, #059669, #10b981);',
        to: `background: linear-gradient(90deg, ${colors.primaryColor}, ${colors.secondaryColor});`,
      },
      // Position badge gradients
      {
        from: 'background: linear-gradient(90deg, #059669, #d946ef);',
        to: `background: linear-gradient(90deg, ${colors.primaryColor}, ${colors.secondaryColor});`,
      },
      {
        from: 'background: linear-gradient(90deg, #059669, #10b981);',
        to: `background: linear-gradient(90deg, ${colors.primaryColor}, ${colors.secondaryColor});`,
      },
    ]

    let styledHtml = html
    gradientMappings.forEach((mapping) => {
      styledHtml = styledHtml.replace(
        new RegExp(mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        mapping.to,
      )
    })

    return styledHtml
  }

  /**
   * Apply solid color replacements
   */
  private static applySolidColors(html: string, colors: ColorScheme): string {
    const solidColorMappings = [
      // Primary color mappings
      { from: '#059669', to: colors.primaryColor },
      { from: '#15803d', to: colors.primaryColor },
      { from: '#10b981', to: colors.secondaryColor },
      // Secondary color mappings
      { from: '#f9a8d4', to: colors.secondaryColor },
      { from: '#d946ef', to: colors.secondaryColor },
    ]

    let styledHtml = html
    solidColorMappings.forEach((mapping) => {
      styledHtml = styledHtml.replace(new RegExp(mapping.from, 'g'), mapping.to)
    })

    return styledHtml
  }

  /**
   * Apply border color replacements
   */
  private static applyBorderColors(html: string, colors: ColorScheme): string {
    const borderMappings = [
      {
        from: 'border-left: 8px solid #059669;',
        to: `border-left: 8px solid ${colors.primaryColor};`,
      },
      {
        from: 'border: 2px solid #f472b6;',
        to: `border: 2px solid ${colors.secondaryColor};`,
      },
    ]

    let styledHtml = html
    borderMappings.forEach((mapping) => {
      styledHtml = styledHtml.replace(
        new RegExp(mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        mapping.to,
      )
    })

    return styledHtml
  }

  /**
   * Apply special color effects and CSS customizations
   */
  private static applySpecialColors(html: string, colors: ColorScheme): string {
    let styledHtml = html

    // Apply SVG fill colors for Template 2 (diagonal split)
    styledHtml = styledHtml.replace(
      /fill="#f9a8d4"/g,
      `fill="${colors.secondaryColor}"`,
    )
    styledHtml = styledHtml.replace(
      /fill="#15803d"/g,
      `fill="${colors.primaryColor}"`,
    )

    // Apply crew member hover effects with custom colors
    const hoverEffect = `
      .crew-member:hover {
        box-shadow: 0 8px 25px ${colors.primaryColor}33;
        border-left: 4px solid ${colors.primaryColor};
      }
    `

    // Insert hover effects before closing style tag
    if (styledHtml.includes('</style>')) {
      styledHtml = styledHtml.replace('</style>', `${hoverEffect}</style>`)
    }

    return styledHtml
  }

  /**
   * Apply boat image to template based on availability and positioning
   */
  private static applyBoatImage(
    html: string,
    data: TemplateData,
    boatImageConfig?: TemplateBoatImageConfig,
  ): string {
    let styledHtml = html

    // Check if boat images are disabled in template config
    if (boatImageConfig && !boatImageConfig.enabled) {
      styledHtml = styledHtml.replace(/\{\{BOAT_IMAGE\}\}/g, '')
      styledHtml = this.removeConditionalBlock(
        styledHtml,
        'BOAT_IMAGE_AVAILABLE',
      )
      return styledHtml
    }

    // Generate boat image HTML with template-specific styling
    const boatImageHtml = this.generateBoatImageHtml(data, boatImageConfig)

    // Replace {{BOAT_IMAGE}} placeholder
    styledHtml = styledHtml.replace(/\{\{BOAT_IMAGE\}\}/g, boatImageHtml)

    // Handle {{#BOAT_IMAGE_AVAILABLE}} conditional blocks
    styledHtml = this.processConditionalBlock(
      styledHtml,
      'BOAT_IMAGE_AVAILABLE',
      data.BOAT_IMAGE_AVAILABLE,
    )

    // Add boat image specific CSS if configured
    if (boatImageConfig && data.BOAT_IMAGE_AVAILABLE) {
      styledHtml = this.addBoatImageCSS(styledHtml, boatImageConfig)
    }

    return styledHtml
  }

  /**
   * Generate boat image HTML based on data and configuration
   */
  private static generateBoatImageHtml(
    data: TemplateData,
    config?: TemplateBoatImageConfig,
  ): string {
    if (!data.BOAT_IMAGE_AVAILABLE || !data.BOAT_IMAGE_URL) {
      return `<div class="boat-image-placeholder">Boat image for ${data.BOAT_CODE} coming soon...</div>`
    }

    const className = config?.className || 'boat-image'
    const sizeClass = config?.size
      ? `boat-image-${config.size}`
      : 'boat-image-medium'
    const positionClass = config?.position
      ? `boat-image-${config.position}`
      : 'boat-image-center'

    let style = ''
    // Force full opacity for better visibility
    style += 'opacity: 1.0; z-index: 25;'

    if (config?.style) {
      style += Object.entries(config.style)
        .map(([key, value]) => `${key}: ${value};`)
        .join(' ')
    }

    return `<img src="${data.BOAT_IMAGE_URL}" alt="${data.BOAT_TYPE} boat" class="${className} ${sizeClass} ${positionClass}" style="${style}" />`
  }

  /**
   * Process conditional template blocks
   */
  private static processConditionalBlock(
    html: string,
    blockName: string,
    condition: boolean,
  ): string {
    const startTag = `{{#${blockName}}}`
    const endTag = `{{/${blockName}}}`
    const startIndex = html.indexOf(startTag)
    const endIndex = html.indexOf(endTag)

    if (startIndex !== -1 && endIndex !== -1) {
      const beforeBlock = html.substring(0, startIndex)
      const blockContent = html.substring(
        startIndex + startTag.length,
        endIndex,
      )
      const afterBlock = html.substring(endIndex + endTag.length)

      return beforeBlock + (condition ? blockContent : '') + afterBlock
    }

    return html
  }

  /**
   * Remove conditional template blocks entirely
   */
  private static removeConditionalBlock(
    html: string,
    blockName: string,
  ): string {
    const startTag = `{{#${blockName}}}`
    const endTag = `{{/${blockName}}}`
    const startIndex = html.indexOf(startTag)
    const endIndex = html.indexOf(endTag)

    if (startIndex !== -1 && endIndex !== -1) {
      const beforeBlock = html.substring(0, startIndex)
      const afterBlock = html.substring(endIndex + endTag.length)
      return beforeBlock + afterBlock
    }

    return html
  }

  /**
   * Add boat image specific CSS based on configuration
   */
  private static addBoatImageCSS(
    html: string,
    config: TemplateBoatImageConfig,
  ): string {
    const boatImageCSS = `
      .boat-image {
        max-width: 100%;
        height: auto;
        display: block;
      }

      .boat-image-small { max-width: 150px; }
      .boat-image-medium { max-width: 300px; }
      .boat-image-large { max-width: 500px; }

      .boat-image-center { margin: 0 auto; }
      .boat-image-left { margin-right: auto; }
      .boat-image-right { margin-left: auto; }
      .boat-image-background {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: -1;
      }
      .boat-image-top { margin-bottom: auto; }
      .boat-image-bottom { margin-top: auto; }

      .boat-image-placeholder {
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-style: italic;
        border: 2px dashed #d1d5db;
        border-radius: 8px;
        background: #f9fafb;
      }
    `

    if (html.includes('</style>')) {
      return html.replace('</style>', `${boatImageCSS}</style>`)
    } else if (html.includes('</head>')) {
      return html.replace('</head>', `<style>${boatImageCSS}</style></head>`)
    }

    return html
  }

  /**
   * Convert crew data from database format to template format
   */
  static formatCrewData(crew: any, template: any): TemplateData {
    const crewMembers: Array<{ POSITION: string; NAME: string }> = []

    // Add regular crew members
    if (crew.crewNames && Array.isArray(crew.crewNames)) {
      let regularRowerIndex = 1

      crew.crewNames.forEach((name: string) => {
        if (name.toLowerCase().startsWith('cox:')) {
          // Handle coxswain
          crewMembers.push({
            POSITION: 'Coxswain',
            NAME: name.replace(/^cox:\s*/i, '').trim(),
          })
        } else {
          // Handle regular rowers
          const position = this.getPositionLabel(
            regularRowerIndex,
            crew.boatType?.seats || 8,
          )
          crewMembers.push({
            POSITION: position,
            NAME: name.trim(),
          })
          regularRowerIndex++
        }
      })
    }

    // Get boat image information
    const boatCode = crew.boatType?.code || '8+'
    const boatImageInfo = this.getBoatImageInfo(boatCode)

    return {
      CLUB_NAME: crew.club?.name || crew.clubName || 'Rowing Club',
      CREW_NAME: crew.name || 'Crew',
      BOAT_TYPE: crew.boatType?.name || 'Eight',
      BOAT_CODE: boatCode,
      SEATS:
        crew.boatType?.seats ||
        crewMembers.filter((m) => m.POSITION !== 'Coxswain').length ||
        8,
      RACE_NAME: crew.raceName || 'Championship Race',
      BOAT_NAME: crew.boatName || `${crew.boatType?.name || 'Eight'} Shell`,
      COACH_NAME: crew.coachName || crew.coach?.name || 'Head Coach',
      CREW_MEMBERS: crewMembers,
      BOAT_IMAGE_URL: boatImageInfo.url,
      BOAT_IMAGE_AVAILABLE: boatImageInfo.available,
    }
  }

  /**
   * Get position label for rowing positions
   */
  private static getPositionLabel(
    seatNumber: number,
    totalSeats: number,
  ): string {
    if (seatNumber === 1) return 'Bow'
    if (seatNumber === totalSeats) return 'Stroke'
    return `Seat ${seatNumber}`
  }

  /**
   * Get predefined color schemes
   */
  static getPresetColorSchemes(): Array<PresetColorScheme> {
    return [
      {
        name: 'Classic Green',
        description: 'Traditional rowing club green and pink',
        primaryColor: '#15803d',
        secondaryColor: '#f9a8d4',
      },
      {
        name: 'Ocean Blue',
        description: 'Deep blue with light blue accents',
        primaryColor: '#1e40af',
        secondaryColor: '#60a5fa',
      },
      {
        name: 'Royal Purple',
        description: 'Rich purple with gold highlights',
        primaryColor: '#7c3aed',
        secondaryColor: '#fbbf24',
      },
      {
        name: 'Sunset Orange',
        description: 'Warm orange with coral accents',
        primaryColor: '#ea580c',
        secondaryColor: '#fb7185',
      },
      {
        name: 'Forest Green',
        description: 'Deep forest green with emerald',
        primaryColor: '#059669',
        secondaryColor: '#10b981',
      },
      {
        name: 'Cardinal Red',
        description: 'Bold cardinal red with cream',
        primaryColor: '#dc2626',
        secondaryColor: '#fef3c7',
      },
      {
        name: 'Navy Blue',
        description: 'Classic navy with silver accents',
        primaryColor: '#1e3a8a',
        secondaryColor: '#e5e7eb',
      },
      {
        name: 'Maroon Gold',
        description: 'Rich maroon with golden yellow',
        primaryColor: '#991b1b',
        secondaryColor: '#fde047',
      },
    ]
  }

  /**
   * Get a color scheme by name
   */
  static getColorSchemeByName(name: string): ColorScheme | null {
    const preset = this.getPresetColorSchemes().find(
      (scheme) => scheme.name === name,
    )
    return preset
      ? {
          primaryColor: preset.primaryColor,
          secondaryColor: preset.secondaryColor,
        }
      : null
  }
}
