export interface TemplateData {
  CLUB_NAME: string
  CREW_NAME: string
  BOAT_TYPE: string
  SEATS: number
  RACE_NAME: string
  BOAT_NAME: string
  COACH_NAME: string
  CREW_MEMBERS: Array<{
    POSITION: string
    NAME: string
  }>
}

export interface ColorScheme {
  primaryColor: string
  secondaryColor: string
}

export interface PresetColorScheme extends ColorScheme {
  name: string
  description: string
}

export class TemplateCompiler {
  /**
   * Compile a template with crew data and color scheme
   */
  static compileTemplate(
    templateHtml: string,
    data: TemplateData,
    colors: ColorScheme
  ): string {
    let compiledHtml = templateHtml

    // Replace single variables
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'CREW_MEMBERS') {
        const placeholder = `{{${key}}}`
        compiledHtml = compiledHtml.replace(new RegExp(placeholder, 'g'), String(value))
      }
    })

    // Handle crew members array
    compiledHtml = this.compileCrewMembers(compiledHtml, data.CREW_MEMBERS)

    // Apply color scheme
    compiledHtml = this.applyColorScheme(compiledHtml, colors)

    return compiledHtml
  }

  /**
   * Compile the crew members section
   */
  private static compileCrewMembers(
    html: string,
    crewMembers: Array<{ POSITION: string; NAME: string }>
  ): string {
    // Find the crew member template block
    const templateStart = html.indexOf('{{#CREW_MEMBERS}}')
    const templateEnd = html.indexOf('{{/CREW_MEMBERS}}') + '{{/CREW_MEMBERS}}'.length

    if (templateStart === -1 || templateEnd === -1) {
      return html
    }

    // Extract the template
    const template = html.substring(
      templateStart + '{{#CREW_MEMBERS}}'.length,
      templateEnd - '{{/CREW_MEMBERS}}'.length
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
            'background: linear-gradient(135deg, #fdf2f8, #fce7f3);'
          )
          memberHtml = memberHtml.replace(
            'border: 1px solid #e5e7eb;',
            'border: 2px solid #f472b6;'
          )
        }

        return memberHtml
      })
      .join('')

    // Replace the template block with compiled HTML
    return html.substring(0, templateStart) + crewMemberHtml + html.substring(templateEnd)
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
  private static applyGradientColors(html: string, colors: ColorScheme): string {
    const gradientMappings = [
      // Header gradients
      {
        from: 'background: linear-gradient(135deg, #059669 0%, #10b981 50%, #d946ef 100%);',
        to: `background: linear-gradient(135deg, ${colors.primaryColor} 0%, ${colors.secondaryColor} 50%, ${colors.primaryColor} 100%);`
      },
      // Footer gradients
      {
        from: 'background: linear-gradient(90deg, #059669 0%, #10b981 50%, #d946ef 100%);',
        to: `background: linear-gradient(90deg, ${colors.primaryColor} 0%, ${colors.secondaryColor} 50%, ${colors.primaryColor} 100%);`
      },
      // Boat silhouette gradients
      {
        from: 'background: linear-gradient(90deg, #059669, #10b981);',
        to: `background: linear-gradient(90deg, ${colors.primaryColor}, ${colors.secondaryColor});`
      },
      // Position badge gradients
      {
        from: 'background: linear-gradient(90deg, #059669, #d946ef);',
        to: `background: linear-gradient(90deg, ${colors.primaryColor}, ${colors.secondaryColor});`
      },
      {
        from: 'background: linear-gradient(90deg, #059669, #10b981);',
        to: `background: linear-gradient(90deg, ${colors.primaryColor}, ${colors.secondaryColor});`
      }
    ]

    let styledHtml = html
    gradientMappings.forEach(mapping => {
      styledHtml = styledHtml.replace(new RegExp(mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), mapping.to)
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
    solidColorMappings.forEach(mapping => {
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
        to: `border-left: 8px solid ${colors.primaryColor};`
      },
      {
        from: 'border: 2px solid #f472b6;',
        to: `border: 2px solid ${colors.secondaryColor};`
      }
    ]

    let styledHtml = html
    borderMappings.forEach(mapping => {
      styledHtml = styledHtml.replace(new RegExp(mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), mapping.to)
    })

    return styledHtml
  }

  /**
   * Apply special color effects and CSS customizations
   */
  private static applySpecialColors(html: string, colors: ColorScheme): string {
    let styledHtml = html

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
            NAME: name.replace(/^cox:\s*/i, '').trim()
          })
        } else {
          // Handle regular rowers
          const position = this.getPositionLabel(regularRowerIndex, crew.boatType?.seats || 8)
          crewMembers.push({
            POSITION: position,
            NAME: name.trim()
          })
          regularRowerIndex++
        }
      })
    }

    return {
      CLUB_NAME: crew.club?.name || crew.clubName || 'Rowing Club',
      CREW_NAME: crew.name || 'Crew',
      BOAT_TYPE: crew.boatType?.name || 'Eight',
      SEATS: crew.boatType?.seats || crewMembers.filter(m => m.POSITION !== 'Coxswain').length || 8,
      RACE_NAME: crew.raceName || 'Championship Race',
      BOAT_NAME: crew.boatName || `${crew.boatType?.name || 'Eight'} Shell`,
      COACH_NAME: crew.coachName || crew.coach?.name || 'Head Coach',
      CREW_MEMBERS: crewMembers
    }
  }

  /**
   * Get position label for rowing positions
   */
  private static getPositionLabel(seatNumber: number, totalSeats: number): string {
    if (seatNumber === 1) return 'Bow'
    if (seatNumber === totalSeats) return 'Stroke'
    return `Seat ${seatNumber}`
  }

  /**
   * Get predefined color schemes
   */
  static getPresetColorSchemes(): PresetColorScheme[] {
    return [
      {
        name: 'Classic Green',
        description: 'Traditional rowing club green and pink',
        primaryColor: '#15803d',
        secondaryColor: '#f9a8d4'
      },
      {
        name: 'Ocean Blue',
        description: 'Deep blue with light blue accents',
        primaryColor: '#1e40af',
        secondaryColor: '#60a5fa'
      },
      {
        name: 'Royal Purple',
        description: 'Rich purple with gold highlights',
        primaryColor: '#7c3aed',
        secondaryColor: '#fbbf24'
      },
      {
        name: 'Sunset Orange',
        description: 'Warm orange with coral accents',
        primaryColor: '#ea580c',
        secondaryColor: '#fb7185'
      },
      {
        name: 'Forest Green',
        description: 'Deep forest green with emerald',
        primaryColor: '#059669',
        secondaryColor: '#10b981'
      },
      {
        name: 'Cardinal Red',
        description: 'Bold cardinal red with cream',
        primaryColor: '#dc2626',
        secondaryColor: '#fef3c7'
      },
      {
        name: 'Navy Blue',
        description: 'Classic navy with silver accents',
        primaryColor: '#1e3a8a',
        secondaryColor: '#e5e7eb'
      },
      {
        name: 'Maroon Gold',
        description: 'Rich maroon with golden yellow',
        primaryColor: '#991b1b',
        secondaryColor: '#fde047'
      }
    ]
  }

  /**
   * Get a color scheme by name
   */
  static getColorSchemeByName(name: string): ColorScheme | null {
    const preset = this.getPresetColorSchemes().find(scheme => scheme.name === name)
    return preset ? { primaryColor: preset.primaryColor, secondaryColor: preset.secondaryColor } : null
  }
}