import { createFileRoute } from '@tanstack/react-router'
import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Configure multer for memory storage (we'll process with sharp)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

async function handleLogoUpload({ request }: { request: Request }) {
  try {
    // Convert Request to Node.js format for multer
    const formData = await request.formData()
    const file = formData.get('logo') as File

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Only image files are allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum size is 5MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate unique filename
    const filename = `${uuidv4()}.webp`
    const outputPath = path.join(process.cwd(), 'public', 'uploads', 'club-logos', filename)

    // Process image with sharp (resize and optimize)
    await sharp(buffer)
      .resize(200, 200, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .webp({ quality: 90 })
      .toFile(outputPath)

    // Return the public URL path
    const logoUrl = `/uploads/club-logos/${filename}`

    return new Response(
      JSON.stringify({
        success: true,
        logoUrl,
        message: 'Logo uploaded successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Logo upload error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to upload logo',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const Route = createFileRoute('/api/upload/club-logo')({
  server: {
    handlers: {
      POST: handleLogoUpload,
    },
  },
})