'use client'

import { useState, useEffect, useRef } from 'react'
import { ZoomIn, ZoomOut, Download, RotateCcw, Maximize2 } from 'lucide-react'

interface PDFInlineViewerProps {
  pdfData: string | ArrayBuffer | number[] | null
  filename?: string
}

export default function PDFInlineViewer({ pdfData, filename }: PDFInlineViewerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (pdfData) {
      setIsLoading(true)
      createPdfUrl()
    }
    
    // Listen for resume updates
    const handleResumeUpdate = () => {
      console.log('📄 Resume updated - refreshing PDF viewer')
      if (pdfData) {
        setIsLoading(true)
        // Force cleanup of old URL
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl)
          setPdfUrl(null)
        }
        // Create new PDF URL with delay to ensure data is ready
        setTimeout(() => {
          createPdfUrl()
        }, 100)
      }
    }
    
    // Listen for data change events with new resume data
    const handleResumeDataChange = (event: any) => {
      console.log('📊 Resume data changed - force refreshing PDF viewer', event.detail)
      setIsLoading(true)
      // Force cleanup of old URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }
      // Regenerate PDF with new data
      setTimeout(() => {
        createPdfUrl()
      }, 200)
    }
    
    window.addEventListener('resume-updated', handleResumeUpdate)
    window.addEventListener('resume-data-changed', handleResumeDataChange)
    
    return () => {
      // Cleanup URL when component unmounts
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
      window.removeEventListener('resume-updated', handleResumeUpdate)
      window.removeEventListener('resume-data-changed', handleResumeDataChange)
    }
  }, [pdfData])

  const createPdfUrl = () => {
    if (!pdfData) return

    try {
      let blob: Blob
      
      if (typeof pdfData === 'string') {
        // Handle base64 data
        const base64Data = pdfData.startsWith('data:application/pdf;base64,') 
          ? pdfData.split(',')[1] 
          : pdfData
        const binaryString = atob(base64Data)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        blob = new Blob([bytes], { type: 'application/pdf' })
      } else if (pdfData instanceof ArrayBuffer) {
        blob = new Blob([pdfData], { type: 'application/pdf' })
      } else if (Array.isArray(pdfData)) {
        blob = new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' })
      } else {
        console.error('Unsupported PDF data format')
        setIsLoading(false)
        return
      }

      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setIsLoading(false)
    } catch (error) {
      console.error('Error creating PDF URL:', error)
      setIsLoading(false)
    }
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  const handleIframeError = () => {
    console.error('Error loading PDF in iframe')
    setIsLoading(false)
  }

  const zoomIn = () => {
    const newZoom = Math.min(3.0, zoomLevel + 0.2)
    setZoomLevel(newZoom)
    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${newZoom})`
      iframeRef.current.style.transformOrigin = 'top left'
    }
  }

  const zoomOut = () => {
    const newZoom = Math.max(0.5, zoomLevel - 0.2)
    setZoomLevel(newZoom)
    if (iframeRef.current) {
      iframeRef.current.style.transform = `scale(${newZoom})`
      iframeRef.current.style.transformOrigin = 'top left'
    }
  }

  const resetZoom = () => {
    setZoomLevel(1)
    if (iframeRef.current) {
      iframeRef.current.style.transform = 'scale(1)'
    }
  }

  const downloadPDF = () => {
    if (!pdfUrl || !filename) return
    
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="w-full h-full bg-white rounded-lg overflow-hidden flex flex-col">
      {/* Mini Controls Bar */}
      <div className="flex items-center justify-between p-3 bg-[#f8f9fa] border-b border-gray-200">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-sm text-gray-600 font-medium truncate max-w-[200px]">
              {filename}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white rounded border border-gray-300">
            <button
              onClick={zoomOut}
              className="p-1.5 hover:bg-gray-100 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={14} className="text-gray-600" />
            </button>
            <button
              onClick={resetZoom}
              className="px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 transition-colors border-x border-gray-300"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="p-1.5 hover:bg-gray-100 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={14} className="text-gray-600" />
            </button>
          </div>
          
          <button
            onClick={downloadPDF}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            title="Download PDF"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 relative overflow-auto bg-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-600 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Loading PDF...
            </div>
          </div>
        ) : pdfUrl ? (
          <div className="p-4 flex justify-center">
            <iframe
              ref={iframeRef}
              src={pdfUrl}
              className="w-full h-[700px] border-0 rounded shadow-lg bg-white"
              title="PDF Viewer"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{
                transformOrigin: 'top left',
                transition: 'transform 0.2s ease-in-out'
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-600 mb-2">Failed to load PDF</div>
              <div className="text-sm text-gray-500">Please try uploading the file again</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
