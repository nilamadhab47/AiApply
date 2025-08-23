'use client'

interface PlaceholderImageProps {
  width: number
  height: number
  text: string
  className?: string
}

export default function PlaceholderImage({ width, height, text, className = '' }: PlaceholderImageProps) {
  return (
    <div 
      className={`flex items-center justify-center bg-gray-800 text-gray-400 ${className}`}
      style={{ width, height }}
    >
      <div className="text-center p-4">
        <div className="text-4xl mb-2">📄</div>
        <div className="text-sm font-medium">{text}</div>
        <div className="text-xs text-gray-500 mt-1">{width}x{height}</div>
      </div>
    </div>
  )
}
