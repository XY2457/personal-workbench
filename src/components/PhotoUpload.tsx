import { useRef, useState } from 'react'
import { compressImage } from '../lib/imageCompress'
import { uploadFile, uuid, now } from '../lib/db'

interface PhotoUploadProps {
  photos: string[]
  onChange: (photos: string[]) => void
  max?: number
}

export default function PhotoUpload({ photos, onChange, max = 9 }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  const handleFiles = async (files: FileList) => {
    if (!files.length) return
    setUploading(true)
    const remaining = max - photos.length
    const toUpload = Array.from(files).slice(0, remaining)
    const uploaded: string[] = []

    for (const file of toUpload) {
      try {
        const compressed = await compressImage(file)
        const url = await uploadFile(compressed, `photos/${uuid()}.webp`)
        uploaded.push(url)
      } catch (err) {
        console.error('Upload failed:', err)
      }
    }

    onChange([...photos, ...uploaded])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />
      <div className="photo-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {photos.map((photo, i) => (
          <div key={i} className="photo-grid-item" onClick={() => setViewerIndex(i)}>
            <img src={photo} alt="" />
            <button
              onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
              style={{
                position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)',
                color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20,
                fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >×</button>
          </div>
        ))}
        {photos.length < max && (
          <div
            onClick={() => inputRef.current?.click()}
            style={{
              aspectRatio: '1', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              color: 'var(--color-text-light)', fontSize: 24, background: 'rgba(255,255,255,0.5)'
            }}
          >
            {uploading ? '...' : '+'}
          </div>
        )}
      </div>

      {/* 全屏查看 */}
      {viewerIndex !== null && photos[viewerIndex] && (
        <div className="photo-viewer" onClick={() => setViewerIndex(null)}>
          <button className="photo-viewer-close" onClick={() => setViewerIndex(null)}>×</button>
          {photos.length > 1 && (
            <>
              <button
                className="photo-viewer-nav prev"
                onClick={(e) => { e.stopPropagation(); setViewerIndex((viewerIndex - 1 + photos.length) % photos.length) }}
              >‹</button>
              <button
                className="photo-viewer-nav next"
                onClick={(e) => { e.stopPropagation(); setViewerIndex((viewerIndex + 1) % photos.length) }}
              >›</button>
            </>
          )}
          <img src={photos[viewerIndex]} alt="" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
