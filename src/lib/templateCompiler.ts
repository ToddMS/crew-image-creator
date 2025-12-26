import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

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
    '1x': '1x.svg', // Single scull
    '2-': '2-.svg', // Coxless pair (sweep)
    '2x': '2x.svg', // Double sculls
    '4-': '4-.svg', // Coxless four (sweep) - same hull as 4+
    '4+': '4-.svg', // Coxed four (sweep) - same hull as 4-, coxswain position differs
    '4x': '4x.svg', // Quad sculls
    '8+': '8+.svg', // Eight
  }

  /**
   * Check if boat image exists for the given boat code
   */
  static getBoatImageInfo(boatCode: string): {
    available: boolean
    url?: string
  } {
    try {
      const filename = this.BOAT_IMAGE_MAP[boatCode]
      const available = !!filename

      if (available) {
        // Convert to absolute file path for puppeteer
        const imagePath = path.join(
          process.cwd(),
          'public',
          'boat-images',
          filename,
        )

        if (existsSync(imagePath)) {
          // Convert to base64 data URL for reliable loading in puppeteer
          const imageBuffer = readFileSync(imagePath)
          const base64 = imageBuffer.toString('base64')
          // Detect file extension for proper MIME type
          const extension = filename.split('.').pop()?.toLowerCase()
          const mimeType = extension === 'svg' ? 'image/svg+xml' : 'image/png'
          const dataUrl = `data:${mimeType};base64,${base64}`
          return { available: true, url: dataUrl }
        }
      }
    } catch (error) {
      console.error('Error loading boat image:', error)
    }

    return {
      available: false,
      url: undefined,
    }
  }

  /**
   * Process club logo URL for reliable loading in Puppeteer
   */
  static getClubLogoInfo(logoUrl: string | null | undefined): {
    available: boolean
    url?: string
  } {
    try {
      if (!logoUrl) {
        return { available: false, url: undefined }
      }

      // If it's a local URL (starts with /uploads/), convert to base64
      if (logoUrl.startsWith('/uploads/')) {
        const imagePath = path.join(process.cwd(), 'public', logoUrl)

        if (existsSync(imagePath)) {
          // Convert to base64 data URL for reliable loading in puppeteer
          const imageBuffer = readFileSync(imagePath)
          const base64 = imageBuffer.toString('base64')
          // Try to detect the image type from file extension
          const extension = logoUrl.split('.').pop()?.toLowerCase()
          const mimeType = extension === 'png' ? 'image/png' :
                          extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
                          extension === 'webp' ? 'image/webp' :
                          'image/png' // default fallback
          const dataUrl = `data:${mimeType};base64,${base64}`
          console.log('Club logo converted to base64:', { logoUrl, available: true })
          return { available: true, url: dataUrl }
        } else {
          console.log('Club logo file not found:', imagePath)
        }
      } else {
        // External URL - use as-is (might work in Puppeteer)
        console.log('Club logo external URL:', logoUrl)
        return { available: true, url: logoUrl }
      }
    } catch (error) {
      console.error('Error loading club logo:', error)
    }

    return {
      available: false,
      url: undefined,
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
    console.log('🎯 DEBUG: TemplateCompiler.compileTemplate called')
    console.log('  - Has crewMembers:', !!data.crewMembers, 'Count:', data.crewMembers?.length)
    console.log('  - crewMembers data:', JSON.stringify(data.crewMembers, null, 2))
    let compiledHtml = templateHtml

    // Replace single variables (both uppercase and lowercase versions)
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'CREW_MEMBERS' && key !== 'crewMembers') {
        // Handle uppercase keys (e.g., RACE_NAME)
        const placeholder = `{{${key}}}`
        compiledHtml = compiledHtml.replace(
          new RegExp(placeholder, 'g'),
          String(value),
        )

        // Handle lowercase keys (e.g., raceName)
        const lowerKey = key.charAt(0).toLowerCase() + key.slice(1)
        const lowerPlaceholder = `{{${lowerKey}}}`
        compiledHtml = compiledHtml.replace(
          new RegExp(lowerPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          String(value),
        )
      }
    })

    // Handle crew members array (both formats)
    if (data.CREW_MEMBERS) {
      compiledHtml = this.compileCrewMembers(compiledHtml, data.CREW_MEMBERS)
    }
    if (data.crewMembers) {
      compiledHtml = this.compileCrewMembersNew(compiledHtml, data.crewMembers)
    }

    // Handle boat image with template-specific positioning
    compiledHtml = this.applyBoatImage(
      compiledHtml,
      data,
      templateMetadata?.boatImage,
    )

    // Handle club logo conditional
    const hasClubLogo = !!(data as any).clubLogo
    console.log('Club logo data:', (data as any).clubLogo, 'hasClubLogo:', hasClubLogo)

    compiledHtml = this.processConditionalBlock(
      compiledHtml,
      'clubLogo',
      hasClubLogo,
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
   * Compile the crew members section (new lowercase format)
   */
  private static compileCrewMembersNew(
    html: string,
    crewMembers: Array<{ name: string; badge: string; style: string }>,
  ): string {
    // Find the crew member template block
    const templateStart = html.indexOf('{{#crewMembers}}')
    const templateEnd =
      html.indexOf('{{/crewMembers}}') + '{{/crewMembers}}'.length

    if (templateStart === -1 || templateEnd === -1) {
      return html
    }

    // Extract the template
    const template = html.substring(
      templateStart + '{{#crewMembers}}'.length,
      templateEnd - '{{/crewMembers}}'.length,
    )

    // Generate HTML for each crew member
    const crewMemberHtml = crewMembers
      .map((member) => {
        let memberHtml = template
        memberHtml = memberHtml.replace(/\{\{name\}\}/g, member.name)
        memberHtml = memberHtml.replace(/\{\{badge\}\}/g, member.badge)
        memberHtml = memberHtml.replace(/\{\{style\}\}/g, member.style)
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
      { from: '#094e2a', to: colors.primaryColor }, // Text colors
      { from: '#10b981', to: colors.secondaryColor },
      // Secondary color mappings
      { from: '#f9a8d4', to: colors.secondaryColor },
      { from: '#f3bfd4', to: colors.secondaryColor }, // Header text color
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

    // Apply SVG fill colors for Template 1 (diagonal split layout)
    // Background should be secondary color, diagonal sections should be primary color
    styledHtml = styledHtml.replace(
      /fill="#f3bfd4"/g,
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
      const boatSeats = crew.boatType?.seats || 8
      const hasCox = crew.boatType?.code?.includes('+') || false
      // For coxed boats, rower seats are 1 to 8 (not 9), cox is separate
      const maxRowerSeat = hasCox ? 8 : boatSeats

      console.log(`🎯 DEBUG: boatSeats=${boatSeats}, hasCox=${hasCox}, maxRowerSeat=${maxRowerSeat}`)

      crew.crewNames.forEach((name: string, index: number) => {
        if (name.toLowerCase().startsWith('cox:')) {
          // Handle coxswain with "cox:" prefix
          crewMembers.push({
            POSITION: 'Coxswain',
            NAME: name.replace(/^cox:\s*/i, '').trim(),
          })
        } else if (hasCox && index === 0) {
          // First crew member in coxed boats is the coxswain
          crewMembers.push({
            POSITION: 'Coxswain',
            NAME: name.trim(),
          })
        } else {
          // Handle rowers in reverse order (cox -> stroke -> ... -> bow)
          // For 8+: Tim(idx 1)=Stroke(8), Todd(idx 2)=7, ..., Alex(idx 8)=Bow(1)
          const seatNumber = hasCox ? maxRowerSeat - (index - 1) : maxRowerSeat - index + 1

          // Only create rower positions for valid seat numbers (1 to maxRowerSeat)
          if (seatNumber >= 1 && seatNumber <= maxRowerSeat) {
            const position = this.getPositionLabel(seatNumber, maxRowerSeat)

            crewMembers.push({
              POSITION: position,
              NAME: name.trim(),
            })
          }
        }
      })
    }

    // Get boat image information
    const boatCode = crew.boatType?.code || '8+'
    const boatImageInfo = this.getBoatImageInfo(boatCode)

    // Get club logo information
    console.log('🎯 DEBUG: crew.clubId:', crew.clubId)
    console.log('🎯 DEBUG: crew.clubName:', crew.clubName)
    console.log('🎯 DEBUG: crew.club:', JSON.stringify(crew.club, null, 2))
    console.log('🎯 DEBUG: crew.club?.logoUrl:', crew.club?.logoUrl)
    const clubLogoInfo = this.getClubLogoInfo(crew.club?.logoUrl)

    // Enhanced data for Template 4 (Professional Layout)
    const crewMembersWithPositions = this.generateCrewPositions(crewMembers, boatCode)
    const crewCategory = this.generateCrewCategory(crew)

    // For Template 2: Put crew in Bow to Stroke order with Cox at end
    const rowers = crewMembers.filter(m => m.POSITION !== 'Coxswain')
    const coxswain = crewMembers.find(m => m.POSITION === 'Coxswain')
    const reversedCrewOrder = [...rowers].reverse() // Bow to Stroke order
    if (coxswain) {
      reversedCrewOrder.push(coxswain) // Add cox at the end
    }

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
      CREW_MEMBERS: reversedCrewOrder,
      BOAT_IMAGE_URL: boatImageInfo.url,
      BOAT_IMAGE_AVAILABLE: boatImageInfo.available,
      // Enhanced Template 4 data
      raceName: crew.raceName || 'Championship Regatta 2025',
      crewCategory: crewCategory,
      crewMembers: crewMembersWithPositions,
      clubLogo: clubLogoInfo.url || null,
      clubName: crew.club?.name || crew.clubName || 'Rowing Club',
      boatImage: boatImageInfo.url,
      positions: this.generateOarPositions(boatCode),
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

  /**
   * Generate crew positions with styling for Template 4
   */
  private static generateCrewPositions(crewMembers: Array<any>, boatCode: string) {
    return crewMembers.map((member, index) => {
      // member.POSITION already contains the correct position string
      let badge: string

      if (member.POSITION === 'Coxswain') {
        badge = 'C'
      } else if (member.POSITION === 'Bow') {
        badge = 'B'
      } else if (member.POSITION === 'Stroke') {
        badge = 'S'
      } else {
        // Extract seat number from "Seat X" format
        const seatMatch = member.POSITION.match(/Seat (\d+)/)
        badge = seatMatch ? seatMatch[1] : member.POSITION
      }

      const style = this.getPositionStyle(badge, boatCode)

      return {
        name: member.NAME,
        position: badge,
        badge: badge,
        style: style
      }
    })
  }

  /**
   * Generate crew category string (e.g., "M1 Senior Men | Open Club 8+")
   */
  private static generateCrewCategory(crew: any): string {
    const category = crew.category || 'M1 Senior Men'
    const competition = crew.competition || 'Open Club'
    const boatCode = crew.boatType?.code || '8+'

    return `${category} | ${competition} ${boatCode}`
  }

  /**
   * Get position badge text for crew member
   */
  private static getPositionBadge(position: string, seatNumber: number, totalSeats: number) {
    if (position === 'Coxswain') {
      return { badge: 'C', fullName: 'Coxswain' }
    }

    if (seatNumber === 1) {
      return { badge: 'B', fullName: 'Bow' }
    }

    if (seatNumber === totalSeats - 1) { // Exclude cox from total
      return { badge: 'S', fullName: 'Stroke' }
    }

    return { badge: seatNumber.toString(), fullName: `Seat ${seatNumber}` }
  }

  /**
   * Get CSS positioning style for crew member based on boat layout
   */
  private static getPositionStyle(badge: string, boatCode: string): string {
    // Different positioning layouts based on boat type
    switch (boatCode) {
      case '4+':
        return this.get4PlusPositions(badge)
      case '4-':
        return this.get4MinusPositions(badge)
      case '4x':
        return this.get4xPositions(badge)
      case '2x':
        return this.get2xPositions(badge)
      case '2-':
        return this.get2MinusPositions(badge)
      case '1x':
        return this.get1xPositions(badge)
      case '8+':
      default:
        return this.get8PlusPositions(badge)
    }
  }

  /**
   * Position layout for 8+ boats (original layout)
   */
  private static get8PlusPositions(badge: string): string {
    const positions: Record<string, string> = {
      'B': 'top: 37% !important; right: 360px !important;',
      '2': 'top: 41% !important; left: 310px !important;',
      '3': 'top: 47% !important; right: 360px !important;',
      '4': 'top: 51% !important; left: 310px !important;',
      '5': 'top: 57% !important; right: 360px !important;',
      '6': 'top: 61% !important; left: 310px !important;',
      '7': 'top: 67% !important; right: 360px !important;',
      'S': 'top: 72% !important; left: 310px !important;',
      'C': 'top: 76% !important; right: 520px !important;'
    }
    return positions[badge] || 'top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;'
  }

  /**
   * Position layout for 4+ boats (Coxed Four)
   */
  private static get4PlusPositions(badge: string): string {
    const positions: Record<string, string> = {
      'B': 'top: 42% !important; right: 360px !important;',
      '2': 'top: 50% !important; left: 310px !important;',
      '3': 'top: 58% !important; right: 360px !important;',
      'S': 'top: 66% !important; left: 310px !important;',
      'C': 'top: 72% !important; right: 520px !important;'
    }
    return positions[badge] || 'top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;'
  }

  /**
   * Position layout for 4- boats (Coxless Four)
   */
  private static get4MinusPositions(badge: string): string {
    const positions: Record<string, string> = {
      'B': 'top: 45% !important; right: 360px !important;',
      '2': 'top: 52% !important; left: 310px !important;',
      '3': 'top: 59% !important; right: 360px !important;',
      'S': 'top: 66% !important; left: 310px !important;'
    }
    return positions[badge] || 'top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;'
  }

  /**
   * Position layout for 4x boats (Quad Sculls)
   */
  private static get4xPositions(badge: string): string {
    const positions: Record<string, string> = {
      'B': 'top: 45% !important; right: 360px !important;',
      '2': 'top: 52% !important; left: 310px !important;',
      '3': 'top: 59% !important; right: 360px !important;',
      'S': 'top: 66% !important; left: 310px !important;'
    }
    return positions[badge] || 'top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;'
  }

  /**
   * Position layout for 2x boats (Double Sculls)
   */
  private static get2xPositions(badge: string): string {
    const positions: Record<string, string> = {
      'B': 'top: 48% !important; right: 360px !important;',
      'S': 'top: 58% !important; left: 310px !important;'
    }
    return positions[badge] || 'top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;'
  }

  /**
   * Position layout for 2- boats (Coxless Pair)
   */
  private static get2MinusPositions(badge: string): string {
    const positions: Record<string, string> = {
      'B': 'top: 48% !important; right: 360px !important;',
      'S': 'top: 58% !important; left: 310px !important;'
    }
    return positions[badge] || 'top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;'
  }

  /**
   * Position layout for 1x boats (Single Sculls)
   */
  private static get1xPositions(badge: string): string {
    const positions: Record<string, string> = {
      'S': 'top: 53% !important; left: 50% !important; transform: translate(-50%, -50%) !important;'
    }
    return positions[badge] || 'top: 53% !important; left: 50% !important; transform: translate(-50%, -50%) !important;'
  }

  /**
   * Generate oar positions for boat diagram
   */
  private static generateOarPositions(boatCode: string) {
    const positions = []
    const seatCount = parseInt(boatCode.charAt(0)) || 8

    for (let i = 1; i <= seatCount; i++) {
      const isPort = i % 2 === 0 // Even seats are port side
      const oarX = 50 + (i * 35) // Spread oars along boat

      positions.push({
        seat: i,
        isPort: isPort,
        oarX: oarX
      })
    }

    return positions
  }
}
