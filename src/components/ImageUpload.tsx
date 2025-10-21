import { useState, useRef } from 'react'

interface ImageUploadProps {
  onUpload: (imageUrl: string) => void
  currentImage?: string
  label?: string
  accept?: string
  maxSize?: number // in MB
}

export function ImageUpload({
  onUpload,
  currentImage,
  label = "Upload Image",
  accept = "image/*",
  maxSize = 5
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/upload/club-logo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      onUpload(result.logoUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreview(currentImage || null) // Reset preview on error
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setError(null)
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#374151'
      }}>
        {label}
      </label>

      <div style={{
        border: '2px dashed #d1d5db',
        borderRadius: '8px',
        padding: '1.5rem',
        textAlign: 'center',
        backgroundColor: '#f9fafb',
        position: 'relative'
      }}>
        {preview ? (
          <div style={{ position: 'relative' }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxWidth: '200px',
                maxHeight: '200px',
                objectFit: 'contain',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            />
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                onClick={handleClick}
                disabled={uploading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1
                }}
              >
                {uploading ? 'Uploading...' : 'Change Image'}
              </button>
              <button
                onClick={handleRemove}
                disabled={uploading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.5 : 1
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div>
            <svg
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 1rem',
                color: '#9ca3af'
              }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p style={{ margin: '0 0 0.5rem', color: '#374151', fontSize: '0.875rem' }}>
              Click to upload or drag and drop
            </p>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.75rem' }}>
              PNG, JPG, GIF up to {maxSize}MB
            </p>
            <button
              onClick={handleClick}
              disabled={uploading}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '0.875rem',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.5 : 1
              }}
            >
              {uploading ? 'Uploading...' : 'Select Image'}
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '4px',
          color: '#dc2626',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}