'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface TemplateApplicatorProps {
  isOpen: boolean
  onClose: () => void
  templateName: string
  templateDisplayName: string
}

export default function TemplateApplicator({
  isOpen,
  onClose,
  templateName,
  templateDisplayName
}: TemplateApplicatorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string>('')
  const [downloadUrl, setDownloadUrl] = useState<string>('')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a PDF, DOCX, or TXT file')
        return
      }
      
      setFile(selectedFile)
      setError('')
      setStatus('idle')
    }
  }

  const handleApplyTemplate = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setIsProcessing(true)
    setStatus('uploading')
    setError('')

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)
      formData.append('templateName', templateName)

      setStatus('processing')

      // Call the API
      const response = await fetch('/api/apply-template', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // Get the file blob
      const blob = await response.blob()
      
      // Create download URL
      const url = window.URL.createObjectURL(blob)
      setDownloadUrl(url)
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `resume_${templateName}.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Auto-download the file
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setStatus('success')

    } catch (error) {
      console.error('Error applying template:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setStatus('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setStatus('idle')
    setError('')
    setDownloadUrl('')
    if (downloadUrl) {
      window.URL.revokeObjectURL(downloadUrl)
    }
    onClose()
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading your resume...'
      case 'processing':
        return 'AI is analyzing your resume and applying the template...'
      case 'success':
        return 'Template applied successfully! Your new resume is downloading.'
      case 'error':
        return 'Something went wrong. Please try again.'
      default:
        return 'Upload your current resume to apply the new template'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      default:
        return <Upload className="w-6 h-6 text-gray-400" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-[#0a0b1e] via-[#1a1b3a] to-[#2d3561] border border-cyan-500/20 text-white max-w-md w-[95vw] shadow-2xl shadow-cyan-500/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Apply {templateDisplayName} Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Display */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex justify-center mb-3"
            >
              {getStatusIcon()}
            </motion.div>
            <p className="text-gray-300">{getStatusMessage()}</p>
          </div>

          {/* File Upload */}
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-6 text-center hover:border-cyan-400/50 transition-all duration-300 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 hover:shadow-lg hover:shadow-cyan-500/10">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <FileText className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-200 mb-2">
                    Click to select your resume
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports PDF, DOCX, and TXT files • Output: Professional PDF
                  </p>
                </label>
              </div>

              {file && (
                <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-cyan-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-gradient-to-r from-red-900/20 to-pink-900/20 border border-red-500/30 rounded-lg p-3 shadow-lg shadow-red-500/10">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Processing Steps */}
          {(status === 'uploading' || status === 'processing') && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${status === 'uploading' ? 'bg-cyan-500 animate-pulse shadow-lg shadow-cyan-500/50' : 'bg-green-400 shadow-lg shadow-green-400/50'}`} />
                <span className="text-sm text-gray-300">Upload resume</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  status === 'processing' ? 'bg-purple-500 animate-pulse shadow-lg shadow-purple-500/50' : 'bg-gray-600'
                }`} />
                <span className="text-sm text-gray-300">AI analysis & template application</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full bg-gray-600`} />
                <span className="text-sm text-gray-300">Generate new resume</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="bg-gradient-to-r from-green-900/20 to-cyan-900/20 border border-green-500/30 rounded-lg p-4 text-center shadow-lg shadow-green-500/10">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-medium mb-2">PDF Template Applied Successfully!</p>
              <p className="text-sm text-gray-300 mb-3">
                Your professional PDF resume with the {templateDisplayName} template is ready.
              </p>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-green-500/20"
                >
                  <Download className="w-4 h-4" />
                  Download Again
                </a>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-gray-800 to-gray-700 text-gray-300 rounded-lg hover:from-gray-700 hover:to-gray-600 transition-all duration-300 border border-gray-600/30"
              disabled={isProcessing}
            >
              {status === 'success' ? 'Done' : 'Cancel'}
            </button>
            
            {status === 'idle' && file && (
              <button
                onClick={handleApplyTemplate}
                disabled={isProcessing}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-cyan-700 hover:via-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Apply Template
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
