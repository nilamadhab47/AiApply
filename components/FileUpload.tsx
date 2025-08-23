'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FileUploadProps {
  onUploadSuccess?: (data: any) => void
}

export default function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const allowedExtensions = ['pdf', 'docx', 'txt']
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      setUploadError('Please upload a PDF, DOCX, or TXT file')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use new Ollama-powered analyze-resume endpoint
      const response = await fetch('http://localhost:8000/analyze-resume', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Analysis failed')
      }

      // Store the complete analysis data (sections + ATS analysis + original file data)
      const fileArrayBuffer = await file.arrayBuffer()
      const fileDataBase64 = btoa(String.fromCharCode(...new Uint8Array(fileArrayBuffer)))
      
      const resumeData = {
        success: data.success,
        filename: data.filename,
        sections: data.sections,
        rawText: data.raw_text,
        atsAnalysis: data.ats_analysis,
        processingTime: data.processing_time,
        fileData: fileDataBase64, // Store as base64 for PDF viewer
        fileType: file.type // Store file type for PDF viewer
      }
      
      sessionStorage.setItem('resumeData', JSON.stringify(resumeData))
      
      if (onUploadSuccess) {
        onUploadSuccess(resumeData)
      }

      // Navigate to the results page
      router.push('/resume-sections')

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <motion.div
      whileHover={{ scale: isUploading ? 1 : 1.02 }}
      className={`bg-gray-900 border-2 border-dashed transition-all duration-300 cursor-pointer group relative overflow-hidden ${
        isDragging 
          ? 'border-blue-500 bg-blue-500/10' 
          : uploadError 
            ? 'border-red-500 hover:border-red-400' 
            : 'border-gray-700 hover:border-gray-600'
      } ${isUploading ? 'cursor-not-allowed' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={isUploading ? undefined : handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      
      <div className="aspect-[3/4] flex flex-col items-center justify-center p-8">
        {isUploading ? (
          <>
            <div className="w-16 h-16 flex items-center justify-center mb-4">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2 tracking-wide">Processing Resume...</h3>
            <p className="text-gray-400 text-sm text-center tracking-wide">Extracting and analyzing sections</p>
          </>
        ) : (
          <>
            <div className={`w-16 h-16 border-2 border-dashed flex items-center justify-center mb-4 transition-colors ${
              isDragging 
                ? 'border-blue-500' 
                : uploadError 
                  ? 'border-red-500' 
                  : 'border-gray-600 group-hover:border-white'
            }`}>
              {uploadError ? (
                <FileText size={24} className="text-red-500" />
              ) : (
                <Upload size={24} className={`transition-colors ${
                  isDragging 
                    ? 'text-blue-500' 
                    : 'text-gray-600 group-hover:text-white'
                }`} />
              )}
            </div>
            <h3 className={`font-semibold text-lg mb-2 tracking-wide ${
              uploadError ? 'text-red-400' : 'text-white'
            }`}>
              {uploadError ? 'Upload Failed' : isDragging ? 'Drop Your Resume' : 'Upload Your Resume'}
            </h3>
            <p className={`text-sm text-center tracking-wide ${
              uploadError ? 'text-red-400' : 'text-gray-400'
            }`}>
              {uploadError || (isDragging ? 'Release to upload' : 'PDF, DOCX, TXT')}
            </p>
            {!uploadError && !isDragging && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Click to browse or drag & drop
              </p>
            )}
          </>
        )}
      </div>

      {/* Animated background effect */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-blue-500/5 pointer-events-none"
        />
      )}
    </motion.div>
  )
}
