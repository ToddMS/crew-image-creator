import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer'
import { TemplateCompiler } from './templateCompiler'

interface Crew {
  id: string
  name: string
  raceName?: string | null
  crewNames: Array<string>
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

interface GenerateImageOptions {
  crew: Crew
  template: Template
  colors: {
    primaryColor: string
    secondaryColor: string
  }
}

export class ImageGenerationService {
  /**
   * Generate a crew image using HTML templates and Puppeteer
   */
  static async generateCrewImage(
    crew: Crew,
    template: Template,
    colors?: { primaryColor: string; secondaryColor: string },
  ): Promise<GeneratedImage> {
    console.log('🎯 DEBUG: ImageGeneration.generateCrewImage called with:')
    console.log('  - Crew ID:', crew.id, 'Crew Name:', crew.name)
    console.log('  - Template ID:', template.id, 'Template Name:', template.name)
    console.log('  - Template Type:', template.templateType)
    console.log('  - Template Metadata:', JSON.stringify(template.metadata, null, 2))

    const filename = `${crew.name.toLowerCase().replace(/\s+/g, '-')}-${template.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`
    console.log('  - Generated filename:', filename)
    const outputPath = path.join(process.cwd(), 'public', 'uploads', filename)

    // Ensure output directory exists
    await this.ensureOutputDirectory(outputPath)

    // Use club colors if no custom colors provided
    const finalColors = colors || {
      primaryColor: crew.club?.primaryColor || '#15803d',
      secondaryColor: crew.club?.secondaryColor || '#f9a8d4',
    }

    // Generate image
    await this.generateImageFromTemplate({
      crew,
      template,
      colors: finalColors,
      outputPath,
    })

    return {
      imageUrl: `/uploads/${filename}`,
      filename,
      width: 1080,
      height: 1080,
    }
  }

  /**
   * Generate image from HTML template
   */
  private static async generateImageFromTemplate(options: {
    crew: Crew
    template: Template
    colors: { primaryColor: string; secondaryColor: string }
    outputPath: string
  }): Promise<void> {
    const { crew, template, colors, outputPath } = options

    // Load and compile template
    const templateHtml = await this.loadTemplate(template, crew, colors)

    // Generate image using Puppeteer
    await this.convertHtmlToImage(templateHtml, outputPath)
  }

  /**
   * Load and compile template with crew data and colors
   */
  private static async loadTemplate(
    template: Template,
    crew: Crew,
    colors: { primaryColor: string; secondaryColor: string },
  ): Promise<string> {
    // Use template metadata to get file paths, or fallback to name mapping
    let htmlPath: string
    let cssPath: string
    let templateName: string

    if (template.metadata?.htmlFile && template.metadata?.cssFile) {
      // Use paths from template metadata
      htmlPath = path.join(process.cwd(), 'public', template.metadata.htmlFile)
      cssPath = path.join(process.cwd(), 'public', template.metadata.cssFile)
      templateName = path.basename(path.dirname(template.metadata.htmlFile))
    } else {
      // Fallback to legacy mapping for older templates
      const templateMap: Record<string, string> = {
        'Diagonal Professional': 'templates/template1',
        'Corner Brackets Modern': 'templates/template2',
        'Template 1': 'templates/template1',
        'Template 2': 'templates/template2',
      }

      const templateDir = templateMap[template.name] || 'templates/template1'
      const templateName = path.basename(templateDir)

      htmlPath = path.join(process.cwd(), 'public', templateDir, `${templateName}.html`)
      cssPath = path.join(process.cwd(), 'public', templateDir, `${templateName}.css`)
    }

    let htmlContent = await fs.readFile(htmlPath, 'utf-8')
    const cssContent = await fs.readFile(cssPath, 'utf-8')

    // Embed CSS into HTML first
    const cssTag = `<style>${cssContent}</style>`
    htmlContent = htmlContent.replace('</head>', `${cssTag}</head>`)

    // Remove external CSS link
    htmlContent = htmlContent.replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '')

    // Use TemplateCompiler for advanced placeholders if the template supports them
    if (htmlContent.includes('{{') || htmlContent.includes('{{#')) {
      const templateData = TemplateCompiler.formatCrewData(crew, template)
      const templateMetadata = template.metadata ? template.metadata : undefined

      htmlContent = TemplateCompiler.compileTemplate(
        htmlContent,
        templateData,
        colors,
        templateMetadata,
      )
    } else {
      // Fallback to legacy method for simple templates
      htmlContent = this.applyColorsToTemplate(
        htmlContent,
        cssContent,
        templateName,
        colors,
      )
      htmlContent = this.applyCrewDataToTemplate(htmlContent, crew)
    }

    return htmlContent
  }

  /**
   * Apply colors to template based on template type
   */
  private static applyColorsToTemplate(
    html: string,
    css: string,
    templateName: string,
    colors: { primaryColor: string; secondaryColor: string },
  ): string {
    let modifiedCss = css

    if (templateName === 'template1') {
      // Template 1: Corner brackets
      // Primary color: top-left and bottom-right (pink class)
      // Secondary color: top-right and bottom-left (green class)
      modifiedCss = modifiedCss.replace(
        /\.pink\s*{[^}]*}/g,
        `.pink { background-color: ${colors.primaryColor}; }`,
      )
      modifiedCss = modifiedCss.replace(
        /\.green\s*{[^}]*}/g,
        `.green { background-color: ${colors.secondaryColor}; }`,
      )
    } else if (templateName === 'template2') {
      // Template 2: Diagonal split
      // Primary color: green triangles
      // Secondary color: pink background
      html = html.replace(/fill="#f9a8d4"/g, `fill="${colors.secondaryColor}"`)
      html = html.replace(/fill="#15803d"/g, `fill="${colors.primaryColor}"`)
    }

    // Embed CSS into HTML
    const cssTag = `<style>${modifiedCss}</style>`
    html = html.replace('</head>', `${cssTag}</head>`)

    // Remove external CSS link
    html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '')

    return html
  }

  /**
   * Apply crew data to template
   */
  private static applyCrewDataToTemplate(html: string, crew: Crew): string {
    // Create crew content HTML
    const crewContentHtml = this.generateCrewContentHtml(crew)

    // Insert crew content into the content area
    html = html.replace(
      '<!-- Content will be dynamically inserted here -->',
      crewContentHtml,
    )

    return html
  }

  /**
   * Generate HTML for crew content
   */
  private static generateCrewContentHtml(crew: Crew): string {
    const crewNames = crew.crewNames || []
    const clubName = crew.club?.name || 'Rowing Club'
    const crewName = crew.name || 'Crew'
    const boatType = crew.boatType.name || 'Eight'
    const raceName = crew.raceName || 'Championship Race'
    const raceCategory = crew.raceCategory || null

    return `
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: black;
        font-family: 'Arial', sans-serif;
        width: 80%;
        z-index: 10;
      ">
        <h1 style="font-size: 36px; margin: 0 0 20px 0; font-weight: bold;">
          ${clubName}
        </h1>
        <h2 style="font-size: 28px; margin: 0 0 15px 0; font-weight: 600;">
          ${crewName}
        </h2>
        <h3 style="font-size: 22px; margin: 0 0 25px 0; font-weight: 500;">
          ${boatType} • ${raceName}${raceCategory ? ` • ${raceCategory}` : ''}
        </h3>
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
          max-width: 600px;
          margin: 0 auto;
        ">
          ${crewNames
            .map((name: string, index: number) => {
              const position = this.getPositionLabel(
                index + 1,
                crewNames.length,
              )
              return `
              <div style="
                background: rgba(255, 255, 255, 0.9);
                padding: 8px;
                border-radius: 8px;
                border: 2px solid rgba(0, 0, 0, 0.1);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              ">
                <div style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">
                  ${position}
                </div>
                <div style="font-size: 14px; font-weight: 500;">
                  ${name.replace(/^cox:\s*/i, '')}
                </div>
              </div>
            `
            })
            .join('')}
        </div>
      </div>
    `
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
   * Convert HTML to image using Puppeteer with base64 images embedded
   */
  private static async convertHtmlToImage(
    html: string,
    outputPath: string,
  ): Promise<void> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    try {
      const page = await browser.newPage()

      // Set viewport for consistent image size
      await page.setViewport({ width: 1080, height: 1080 })

      // Load HTML content with embedded base64 images
      await page.setContent(html, { waitUntil: 'networkidle0' })

      // Additional wait to ensure all images (including base64) are rendered
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Take screenshot
      await page.screenshot({
        path: outputPath,
        type: 'png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 1080, height: 1080 },
      })
    } finally {
      await browser.close()
    }
  }

  /**
   * Ensure output directory exists
   */
  private static async ensureOutputDirectory(filePath: string): Promise<void> {
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
  }

  /**
   * Validate that a crew and template are compatible for image generation
   */
  static validateGenerationInput(
    crew: Crew,
    template: Template,
  ): { valid: boolean; error?: string } {
    if (!crew.crewNames || crew.crewNames.length === 0) {
      return { valid: false, error: 'Crew must have at least one rower' }
    }

    if (crew.crewNames.some((name) => !name.trim())) {
      return { valid: false, error: 'All rowers must have names' }
    }

    if (!crew.name.trim()) {
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
  generatedImage: GeneratedImage,
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
