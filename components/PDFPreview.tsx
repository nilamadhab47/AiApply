'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut, Download, X, RotateCcw, Maximize2, Minimize2 } from 'lucide-react'

interface PDFPreviewProps {
  isOpen: boolean
  onClose: () => void
  pdfData?: string | ArrayBuffer | number[] | null
  filename?: string
}

export default function PDFPreview({ isOpen, onClose, pdfData, filename }: PDFPreviewProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (isOpen && pdfData) {
      setIsLoading(true)
      createPdfUrl()
    }
    
    return () => {
      // Cleanup URL when component unmounts or closes
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [isOpen, pdfData])

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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const zoomIn = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current
      const currentScale = parseFloat(iframe.style.transform.replace(/scale\(([^)]+)\)/, '$1') || '1')
      const newScale = Math.min(3.0, currentScale + 0.2)
      iframe.style.transform = `scale(${newScale})`
      iframe.style.transformOrigin = 'top left'
    }
  }

  const zoomOut = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current
      const currentScale = parseFloat(iframe.style.transform.replace(/scale\(([^)]+)\)/, '$1') || '1')
      const newScale = Math.max(0.5, currentScale - 0.2)
      iframe.style.transform = `scale(${newScale})`
      iframe.style.transformOrigin = 'top left'
    }
  }

  const resetZoom = () => {
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

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#0f0f14] rounded-xl border border-gray-800 max-w-6xl max-h-[90vh] w-full mx-4 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white font-space">
                PDF Preview
              </h3>
              {filename && (
                <span className="text-sm text-gray-400 bg-[#1a1a1f] px-2 py-1 rounded">
                  {filename}
                </span>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-[#1a1a1f] rounded-lg p-1">
                <button
                  onClick={zoomOut}
                  className="p-2 hover:bg-[#2a2a2f] rounded transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} className="text-white" />
                </button>
                <button
                  onClick={resetZoom}
                  className="px-3 py-2 text-sm text-white font-space hover:bg-[#2a2a2f] rounded transition-colors"
                  title="Reset Zoom"
                >
                  100%
                </button>
                <button
                  onClick={zoomIn}
                  className="p-2 hover:bg-[#2a2a2f] rounded transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} className="text-white" />
                </button>
              </div>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-[#1a1a1f] hover:bg-[#2a2a2f] rounded-lg transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={16} className="text-white" /> : <Maximize2 size={16} className="text-white" />}
              </button>
              
              <button
                onClick={downloadPDF}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                title="Download PDF"
              >
                <Download size={16} className="text-white" />
              </button>

              <button
                onClick={onClose}
                className="p-2 bg-[#1a1a1f] hover:bg-[#2a2a2f] rounded-lg transition-colors"
                title="Close"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* PDF Content */}
          <div className={`flex-1 overflow-auto bg-gray-100 ${isFullscreen ? 'p-0' : 'p-4'}`}>
            <div className="flex justify-center h-full">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-gray-600 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Loading PDF...
                  </div>
                </div>
              ) : pdfUrl ? (
                <iframe
                  ref={iframeRef}
                  src={pdfUrl}
                  className={`w-full ${isFullscreen ? 'h-full' : 'h-[600px]'} border-0 rounded-lg shadow-lg`}
                  title="PDF Preview"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  style={{
                    transformOrigin: 'top left',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="text-gray-600 mb-2">No PDF data available</div>
                    <div className="text-sm text-gray-500">Please upload a PDF file to preview</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
