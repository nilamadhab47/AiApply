'use client'

import { useState, useEffect } from 'react'
import { FileText, Download, Eye } from 'lucide-react'

interface DOCXViewerProps {
  sections: Array<{
    title: string
    content: string
    type: string
  }>
  filename?: string
  onDownload?: () => void
}

export default function DOCXViewer({ sections, filename, onDownload }: DOCXViewerProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    if (onDownload) {
      onDownload()
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections: sections,
          filename: filename
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Trigger download
        const link = document.createElement('a')
        link.href = result.docxData
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error downloading DOCX:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-[#0f0f14] rounded-xl border border-gray-800 overflow-hidden h-[800px]">
      {/* Header */}
      <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-white font-medium">DOCX Document Preview</h3>
              <p className="text-gray-400 text-sm">
                {filename || 'resume.docx'} • {sections.length} sections
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg transition-colors text-white"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download DOCX
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Preview */}
      <div className="p-6 h-full overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto bg-white" style={{ fontFamily: 'Calibri, sans-serif' }}>
          {sections.map((section, index) => (
            <div key={index} className="mb-6">
              {/* Section Title */}
              <div className="mb-3">
                <h2 className="text-lg font-bold text-black uppercase border-b border-black pb-1">
                  {section.title}
                </h2>
              </div>
              
              {/* Section Content */}
              <div className="text-black text-sm leading-relaxed">
                {section.content && section.content !== 'undefined' ? (
                  <div className="whitespace-pre-wrap">
                    {section.content}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    [{section.title} content not available]
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800/50 px-6 py-3 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview of DOCX content
          </div>
          <div>
            Click download to get the formatted document
          </div>
        </div>
      </div>
    </div>
  )
}
