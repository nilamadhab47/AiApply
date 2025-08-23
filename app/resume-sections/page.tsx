'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import { 
  ArrowLeft, FileText, User, Briefcase, GraduationCap, Code, FolderOpen, 
  Edit3, Download, Save, Eye, Target, TrendingUp, CheckCircle, AlertCircle,
  Loader2, Sparkles, BarChart3, Award, Zap, Star, X, FileSearch, Plus, Copy,
  MapPin, DollarSign, ExternalLink, Building2, Clock
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import PDFPreview to avoid SSR issues
const PDFPreview = dynamic(() => import('@/components/PDFPreview'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-gray-500 flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        Loading PDF viewer...
      </div>
    </div>
  )
})

// Import PDFInlineViewer for direct UI integration
import PDFInlineViewer from '@/components/PDFInlineViewer'

// Import DOCX viewer for optimized content
import DOCXViewer from '@/components/DOCXViewer'

// Import PDF sync utility
import { updatePDFViewer } from '@/utils/pdfSync'

// Import shadcn components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

// Icons already imported above

interface ResumeSection {
  title: string
  content: string
  type: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'other' | 'additional'
}

interface ResumeData {
  success: boolean
  filename: string
  sections: ResumeSection[]
  rawText: string
  atsAnalysis?: ATSScore
  processingTime?: number
  fileData?: string | ArrayBuffer
  fileType?: string
}

interface ATSScore {
  overall_score: number
  category_scores: {
    format_structure: number
    keywords_skills: number
    experience_relevance: number
    contact_info: number
    education_credentials: number
  }
  suggestions: string[]
  strengths: string[]
}

interface JobSuggestion {
  title: string
  company: string
  location: string
  matchScore: number
  keySkills: string[]
  salaryRange: string
  description: string
  requirements: string[]
  whyMatch: string
  applicationLink?: string
}

interface JobSuggestionsResponse {
  success: boolean
  jobSuggestions: JobSuggestion[]
  analysisDate: string
  resumeProfile: {
    primarySkills: string[]
    experienceLevel: string
    industry: string
  }
}

const sectionIcons = {
  personal: User,
  summary: FileText,
  experience: Briefcase,
  education: GraduationCap,
  skills: Code,
  projects: FolderOpen,
  other: FileText,
  additional: FileText
}

const sectionColors = {
  personal: 'bg-gray-800/20 border-gray-800/30 text-gray-300',
  summary: 'bg-gray-800/20 border-gray-800/30 text-gray-300',
  experience: 'bg-gray-800/20 border-gray-800/30 text-gray-300',
  education: 'bg-gray-800/20 border-gray-800/30 text-gray-300',
  skills: 'bg-gray-800/20 border-gray-800/30 text-gray-300',
  projects: 'bg-gray-800/20 border-gray-800/30 text-gray-300',
  other: 'bg-gray-800/20 border-gray-800/30 text-gray-300',
  additional: 'bg-gray-800/20 border-gray-800/30 text-gray-300'
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="relative"
    >
      <Loader2 className="w-8 h-8 text-gray-500" />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full border-2 border-gray-400/20"
      />
    </motion.div>
    <span className="ml-3 text-gray-300">Analyzing your resume...</span>
  </div>
)

const ScoreCircle = ({ score, size = 120 }: { score: number; size?: number }) => {
  const circumference = 2 * Math.PI * (size / 2 - 10)
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981' // green
    if (score >= 60) return '#F59E0B' // yellow
    return '#EF4444' // red
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-gray-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          stroke={getScoreColor(score)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-3xl font-bold text-white"
          >
            {score}
          </motion.div>
          <div className="text-sm text-gray-500">ATS Score</div>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedResumeSections() {
  const router = useRouter()
  const { data: session } = useSession()
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingATS, setIsLoadingATS] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'pdf' | 'sections'>('pdf') // Default to PDF view
  const [jobDescriptionModal, setJobDescriptionModal] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false)
  const [jobAnalysisResult, setJobAnalysisResult] = useState<any>(null)
  const [showOptimizations, setShowOptimizations] = useState(false)
  const [coverLetterModal, setCoverLetterModal] = useState(false)
  const [persistedCoverLetter, setPersistedCoverLetter] = useState<string | null>(null)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [coverLetterGenerated, setCoverLetterGenerated] = useState(false)
  const [showDOCXViewer, setShowDOCXViewer] = useState(false)
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const [jobSuggestions, setJobSuggestions] = useState<JobSuggestionsResponse | null>(null)
  const [isLoadingJobSuggestions, setIsLoadingJobSuggestions] = useState(false)
  const [showJobSuggestions, setShowJobSuggestions] = useState(false)
  const [optimizationChanges, setOptimizationChanges] = useState(new Map<string, any>())
  const [appliedOptimizations, setAppliedOptimizations] = useState(new Map<string, any>())
  const [recentChanges, setRecentChanges] = useState<any[]>([])
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0)
  const [isRegeneratingPDF, setIsRegeneratingPDF] = useState(false)

  // Load cached job suggestions on mount
  useEffect(() => {
    const cachedSuggestions = localStorage.getItem('jobSuggestions')
    if (cachedSuggestions) {
      try {
        const data = JSON.parse(cachedSuggestions)
        setJobSuggestions(data)
      } catch (error) {
        console.error('Error parsing cached job suggestions:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Check both sessionStorage and localStorage for resume data
    const sessionData = sessionStorage.getItem('resumeData')
    const localData = localStorage.getItem('resumeData')
    const data = sessionData || localData
    
    if (data) {
      const parsedData = JSON.parse(data)
      console.log(data, 'data from api')
      setResumeData(parsedData)
      
      // Use ATS analysis from Ollama backend if available, otherwise calculate
      if (parsedData.atsAnalysis) {
        console.log('Using ATS analysis from Ollama backend:', parsedData.atsAnalysis)
        calculateATSScore(parsedData.sections, parsedData.atsAnalysis)
      } else {
        console.log('No ATS analysis found, calculating with legacy API')
        calculateATSScore(parsedData.sections)
      }
      
      // Store in localStorage for persistence
      if (sessionData && !localData) {
        localStorage.setItem('resumeData', data)
      }
    }
    
    // Load persisted job analysis and cover letter data
    try {
      const persistedJobAnalysis = localStorage.getItem('jobAnalysisResult')
      const persistedCoverLetterData = localStorage.getItem('persistedCoverLetter')
      const lastJobDescription = localStorage.getItem('lastJobDescription')
      
      console.log('=== LOADING FROM LOCALSTORAGE ===')
      console.log('- Job analysis:', persistedJobAnalysis ? 'Found' : 'Not found')
      console.log('- Cover letter:', persistedCoverLetterData ? 'Found' : 'Not found')
      console.log('- Last job description:', lastJobDescription ? 'Found' : 'Not found')
      
      if (persistedJobAnalysis) {
        try {
          const parsedJobAnalysis = JSON.parse(persistedJobAnalysis)
          console.log('Parsed job analysis structure:')
          console.log('- Success:', parsedJobAnalysis.success)
          console.log('- Optimizations count:', parsedJobAnalysis.optimizations?.length || 0)
          console.log('- Cover letter exists:', !!parsedJobAnalysis.coverLetter)
          console.log('- Match score:', parsedJobAnalysis.matchScore)
          console.log('- Key insights count:', parsedJobAnalysis.keyInsights?.length || 0)
          console.log('- Suggested skills count:', parsedJobAnalysis.suggestedSkills?.length || 0)
          
          if (parsedJobAnalysis.optimizations?.length > 0) {
            console.log('First optimization:', parsedJobAnalysis.optimizations[0])
          }
          
          setJobAnalysisResult(parsedJobAnalysis)
          
          // If we have persisted data, show the optimizations modal
          if (parsedJobAnalysis.optimizations?.length > 0 || parsedJobAnalysis.coverLetter) {
            setShowOptimizations(true)
          }
          
        } catch (error) {
          console.error('Error parsing persisted job analysis:', error)
          console.error('Raw data:', persistedJobAnalysis)
          localStorage.removeItem('jobAnalysisResult') // Clean up corrupted data
        }
      }
      
      if (persistedCoverLetterData) {
        console.log('Loading persisted cover letter (length):', persistedCoverLetterData.length)
        console.log('Cover letter preview:', persistedCoverLetterData.substring(0, 200) + '...')
        setPersistedCoverLetter(persistedCoverLetterData)
      }
      
      if (lastJobDescription) {
        console.log('Loading last job description (length):', lastJobDescription.length)
        setJobDescription(lastJobDescription)
      }
      
    } catch (error) {
      console.error('Error accessing localStorage:', error)
    }
    
    setIsLoading(false)
  }, [])

  const calculateATSScore = async (sections: ResumeSection[], existingAtsAnalysis?: ATSScore) => {
    // If we already have ATS analysis from Ollama backend, use it directly
    if (existingAtsAnalysis) {
      setAtsScore(existingAtsAnalysis)
      setIsLoadingATS(false)
      return
    }

    setIsLoadingATS(true)
    try {
      // Fallback to legacy API if no ATS analysis provided
      const response = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      })
      
      if (response.ok) {
        const score = await response.json()
        setAtsScore(score)
      }
    } catch (error) {
      console.error('Failed to calculate ATS score:', error)
      // Fallback mock data
      setAtsScore({
        overall_score: 78,
        category_scores: {
          format_structure: 20,
          keywords_skills: 18,
          experience_relevance: 22,
          contact_info: 12,
          education_credentials: 6
        },
        suggestions: [
          "Add more industry-specific keywords to improve ATS compatibility",
          "Include quantifiable achievements in your experience section",
          "Add LinkedIn profile and professional social media links",
          "Consider adding relevant certifications or professional development"
        ],
        strengths: [
          "Clear contact information section",
          "Professional experience section present",
          "Strong technical keyword presence"
        ]
      })
    }
    setIsLoadingATS(false)
  }

  const regeneratePDF = async (sections: ResumeSection[], filename: string) => {
    console.log('🔄 Regenerating PDF from updated sections')
    setIsRegeneratingPDF(true)
    
    try {
      const response = await fetch('/api/generate-pdf', {
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
        console.log('✅ PDF regenerated successfully')
        return result.pdfData
      } else {
        console.error('❌ Failed to regenerate PDF:', response.statusText)
        return null
      }
    } catch (error) {
      console.error('❌ Error regenerating PDF:', error)
      return null
    } finally {
      setIsRegeneratingPDF(false)
    }
  }

  const generateDOCX = async (sections: ResumeSection[], filename: string) => {
    console.log('📄 Generating DOCX from updated sections')
    setIsRegeneratingPDF(true) // Reuse the same loading state
    
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
        console.log('✅ DOCX generated successfully')
        
        // Trigger download of DOCX file
        const link = document.createElement('a')
        link.href = result.docxData
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        return true
      } else {
        console.error('❌ Failed to generate DOCX:', response.statusText)
        return false
      }
    } catch (error) {
      console.error('❌ Error generating DOCX:', error)
      return false
    } finally {
      setIsRegeneratingPDF(false)
    }
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    // Ensure full content is displayed, not truncated
    const fullContent = resumeData?.sections[index].content || ''
    setEditContent(fullContent)
  }

  const clearOptimizationChanges = (sectionTitle?: string) => {
    if (sectionTitle) {
      // Clear changes for specific section
      const newOptimizationChanges = new Map(optimizationChanges)
      newOptimizationChanges.delete(sectionTitle)
      setOptimizationChanges(newOptimizationChanges)
    } else {
      // Clear all optimization changes
      setOptimizationChanges(new Map())
    }
  }

  const handleCancelEdit = (index: number) => {
    setEditingIndex(null)
    // Optionally clear optimization changes for this section when canceling
    if (resumeData?.sections[index]) {
      const sectionTitle = resumeData.sections[index].title
      clearOptimizationChanges(sectionTitle)
    }
  }

  const handleSave = async (index: number) => {
    if (resumeData) {
      const updatedSections = [...resumeData.sections]
      updatedSections[index].content = editContent
      
      // Update the data first
      const updatedData = { 
        ...resumeData, 
        sections: updatedSections
      }
      
      setResumeData(updatedData)
      localStorage.setItem('resumeData', JSON.stringify(updatedData))
      
      // Clear optimization changes for this section after saving
      const sectionTitle = updatedSections[index].title
      const newOptimizationChanges = new Map(optimizationChanges)
      newOptimizationChanges.delete(sectionTitle)
      setOptimizationChanges(newOptimizationChanges)
      
      // Clear highlighting for this section
      if (highlightedSection === sectionTitle) {
        setHighlightedSection(null)
      }
      
      // Ask user for their preference
      const choice = confirm(
        '✅ Section saved successfully!\n\n' +
        'Choose how to update your document:\n' +
        '• Click OK for DOCX download (preserves all formatting and content)\n' +
        '• Click Cancel to regenerate PDF (may lose some formatting)'
      )
      
      if (choice) {
        // User chose DOCX
        await generateDOCX(updatedSections, resumeData.filename)
      } else {
        // User chose PDF regeneration
        const newPdfData = await regeneratePDF(updatedSections, resumeData.filename)
        if (newPdfData) {
          const updatedDataWithPdf = { 
            ...updatedData, 
            fileData: newPdfData
          }
          setResumeData(updatedDataWithPdf)
          localStorage.setItem('resumeData', JSON.stringify(updatedDataWithPdf))
          
          // Force PDF refresh
          setPdfRefreshKey(prev => prev + 1)
          
          // Dispatch PDF refresh events
          setTimeout(() => {
            window.dispatchEvent(new Event('resume-updated'))
            window.dispatchEvent(new CustomEvent('resume-data-changed', { 
              detail: updatedDataWithPdf 
            }))
          }, 100)
        }
      }
      
      // Recalculate ATS score with updated sections
      calculateATSScore(updatedSections)
    }
    setEditingIndex(null)
  }

  const handleDownload = () => {
    if (!resumeData) return
    
    const content = resumeData.sections
      .map(section => `${section.title}\n${'='.repeat(section.title.length)}\n${section.content}\n`)
      .join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resumeData.filename.replace(/\.[^/.]+$/, '')}_parsed.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleJobSuggestions = async () => {
    if (!resumeData) return

    setIsLoadingJobSuggestions(true)
    try {
      const response = await fetch('/api/suggest-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections: resumeData.sections,
          rawText: resumeData.rawText
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get job suggestions')
      }

      const data: JobSuggestionsResponse = await response.json()
      setJobSuggestions(data)
      setShowJobSuggestions(true)
      
      // Store in localStorage for persistence
      localStorage.setItem('jobSuggestions', JSON.stringify(data))
      
    } catch (error) {
      console.error('Error getting job suggestions:', error)
      // You could add a toast notification here
    } finally {
      setIsLoadingJobSuggestions(false)
    }
  }

  const handleJobDescriptionSubmit = async () => {
    if (!jobDescription.trim() || !resumeData) return
    
    setIsAnalyzingJob(true)
    
    try {
      const response = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          resumeSections: resumeData.sections,
          resumeFilename: resumeData.filename
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze job description')
      }
      
      const result = await response.json()
      setJobAnalysisResult(result)
      
      // Persist job analysis result and cover letter
      try {
        // Save the complete job analysis result
        const dataToSave = {
          ...result,
          timestamp: new Date().toISOString(),
          resumeFilename: resumeData.filename
        }
        
        localStorage.setItem('jobAnalysisResult', JSON.stringify(dataToSave))
        console.log('Job analysis result saved to localStorage:')
        console.log('- Optimizations:', result.optimizations?.length || 0)
        console.log('- Cover letter:', !!result.coverLetter)
        console.log('- Match score:', result.matchScore)
        
        if (result.coverLetter) {
          setPersistedCoverLetter(result.coverLetter)
          localStorage.setItem('persistedCoverLetter', result.coverLetter)
          console.log('Cover letter saved to localStorage (length):', result.coverLetter.length)
        }
        
        // Also save the job description for reference
        localStorage.setItem('lastJobDescription', jobDescription)
        
      } catch (error) {
        console.error('Error saving to localStorage:', error)
        alert('Warning: Data could not be saved to browser storage. Your analysis may be lost if you refresh the page.')
      }
      
      setJobDescriptionModal(false)
      setShowOptimizations(true)
      
    } catch (error) {
      console.error('Job analysis error:', error)
      alert('Failed to analyze job description. Please try again.')
    } finally {
      setIsAnalyzingJob(false)
    }
  }

  const handleDownloadCoverLetter = async () => {
    // Get the cover letter text from either current analysis or persisted data
    const coverLetterText = jobAnalysisResult?.coverLetter || persistedCoverLetter
    
    console.log('Download cover letter clicked')
    console.log('Cover letter text available:', !!coverLetterText)
    console.log('Cover letter preview:', coverLetterText?.substring(0, 200))
    
    if (!coverLetterText) {
      alert('No cover letter available to download. Please generate one first.')
      return
    }
    
    // Clean the cover letter text to ensure it only contains the actual cover letter
    let cleanCoverLetter = coverLetterText
    
    // Remove any JSON formatting if present
    if (cleanCoverLetter.includes('{') && cleanCoverLetter.includes('}')) {
      try {
        const parsed = JSON.parse(cleanCoverLetter)
        cleanCoverLetter = parsed.coverLetter || cleanCoverLetter
      } catch {
        // If not valid JSON, continue with original text
      }
    }
    
    // Remove analysis markers and unwanted content
    cleanCoverLetter = cleanCoverLetter
      .replace(/\*\*[^*]+\*\*/g, '') // Remove **markers**
      .replace(/^\d+\..*/gm, '') // Remove numbered lists
      .replace(/\{[^}]*\}/g, '') // Remove JSON-like content
      .replace(/section:/gi, '') // Remove section markers
      .replace(/original content:/gi, '') // Remove analysis markers
      .replace(/suggested content:/gi, '') // Remove analysis markers
      .replace(/optimizations?:/gi, '') // Remove optimization markers
      .replace(/key insights?:/gi, '') // Remove insight markers
      .replace(/\n{3,}/g, '\n\n') // Clean up extra newlines
      .trim()
    
    console.log('Cleaned cover letter:', cleanCoverLetter.substring(0, 200))
    
    try {
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetterText: cleanCoverLetter,
          applicantName: session?.user?.name || 'Applicant',
          jobTitle: 'Position',
          companyName: 'Company'
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error:', errorText)
        throw new Error(`Server error: ${response.status}`)
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Cover_Letter_${new Date().toISOString().split('T')[0]}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('Cover letter downloaded successfully!')
      
    } catch (error) {
      console.error('Cover letter download error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to download cover letter: ${errorMessage}. Please try again.`)
    }
  }

  const handleCopyCoverLetter = () => {
    const coverLetterText = jobAnalysisResult?.coverLetter || persistedCoverLetter
    if (!coverLetterText) return
    
    navigator.clipboard.writeText(coverLetterText)
      .then(() => {
        alert('Cover letter copied to clipboard!')
      })
      .catch(() => {
        alert('Failed to copy cover letter to clipboard')
      })
  }

  // Removed applyOptimization function - users now copy suggestions manually
  const removedApplyOptimization = async (optimization: any) => {
    console.log('🔧 Applying optimization:', optimization)
    console.log('📄 Current resume data:', resumeData)
    
    if (!resumeData || !resumeData.sections) {
      console.log('❌ No resume data available')
      alert('❌ No resume data available to apply optimization.')
      return
    }
    
    // Close the optimization modal
    setShowOptimizations(false)
    
    // Find the section to update - try exact match first, then partial match
    let sectionIndex = resumeData.sections.findIndex(
      section => section.title.toLowerCase().trim() === optimization.section.toLowerCase().trim()
    )
    
    // If exact match not found, try partial matching with better logic
    if (sectionIndex === -1) {
      sectionIndex = resumeData.sections.findIndex(
        section => {
          const sectionTitle = section.title.toLowerCase().trim()
          const optimizationSection = optimization.section.toLowerCase().trim()
          
          // Check if either contains the other
          return sectionTitle.includes(optimizationSection) || 
                 optimizationSection.includes(sectionTitle) ||
                 // Check for common keywords
                 (sectionTitle.includes('experience') && optimizationSection.includes('experience')) ||
                 (sectionTitle.includes('education') && optimizationSection.includes('education')) ||
                 (sectionTitle.includes('skills') && optimizationSection.includes('skills')) ||
                 (sectionTitle.includes('summary') && optimizationSection.includes('summary'))
        }
      )
    }
    
    console.log('🎯 Found section at index:', sectionIndex)
    console.log('📋 Available sections:', resumeData.sections.map(s => s.title))
    console.log('🔍 Looking for section:', optimization.section)
    
    if (sectionIndex !== -1) {
      const updatedSections = [...resumeData.sections]
      const sectionTitle = updatedSections[sectionIndex].title
      
      console.log('📝 Original content:', optimization.originalContent)
      console.log('✨ Suggested content:', optimization.suggestedContent)
      
      // Try to find and replace the specific content
      let newContent = updatedSections[sectionIndex].content
      
      // Track changes for highlighting
      const currentChanges = optimizationChanges.get(sectionTitle) || { added: [], removed: [] }
      
      // Try exact replacement first
      if (newContent.includes(optimization.originalContent)) {
        newContent = newContent.replace(optimization.originalContent, optimization.suggestedContent)
        console.log('✅ Exact replacement successful')
        
        // Track the changes
        currentChanges.removed.push(optimization.originalContent)
        currentChanges.added.push(optimization.suggestedContent)
      } else {
        // Try fuzzy matching - look for similar content
        const originalWords = optimization.originalContent.toLowerCase().split(/\s+/)
        const contentLines = newContent.split('\n')
        
        let replacementMade = false
        for (let i = 0; i < contentLines.length; i++) {
          const line = contentLines[i].toLowerCase()
          // If line contains most of the original words, replace it
          const matchingWords = originalWords.filter((word: string) => line.includes(word))
          if (matchingWords.length >= Math.min(3, originalWords.length * 0.6)) {
            // Track the original line that will be replaced
            currentChanges.removed.push(contentLines[i])
            currentChanges.added.push(optimization.suggestedContent)
            
            contentLines[i] = optimization.suggestedContent
            replacementMade = true
            console.log('✅ Fuzzy replacement successful on line:', i)
            break
          }
        }
        
        if (replacementMade) {
          newContent = contentLines.join('\n')
        } else {
          // If no good match found, append the new content
          newContent = newContent + '\n\n' + optimization.suggestedContent
          console.log('✅ Appended new content')
          
          // Track the appended content as addition only
          currentChanges.added.push(optimization.suggestedContent)
        }
      }
      
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        content: newContent
      }
      
      const updatedResumeData: ResumeData = {
        ...resumeData,
        sections: updatedSections,
        success: true
      }
      
      console.log('💾 Saving updated resume data')
      setResumeData(updatedResumeData)
      
      // Update localStorage
      localStorage.setItem('resumeData', JSON.stringify(updatedResumeData))
      
      // Save optimization changes for highlighting
      const newOptimizationChanges = new Map(optimizationChanges)
      newOptimizationChanges.set(sectionTitle, currentChanges)
      setOptimizationChanges(newOptimizationChanges)
      
      // Activate edit view for the modified section
      const editingSectionIndex = updatedSections.findIndex(section => section.title === sectionTitle)
      setEditingIndex(editingSectionIndex)
      setEditContent(updatedSections[editingSectionIndex].content)
      
      // Highlight the section that was changed with enhanced visual feedback
      console.log('🎨 Highlighting section:', sectionTitle)
      // Clear any existing highlight first
      setHighlightedSection(null)
      // Then set the new highlight after a brief delay to ensure re-render
      setTimeout(() => {
        setHighlightedSection(sectionTitle)
        console.log('🎨 Section highlighted:', sectionTitle)
      }, 50)
      
      // Track applied optimizations
      const newAppliedOptimizations = new Map(appliedOptimizations)
      newAppliedOptimizations.set(`${optimization.section}-${optimization.originalContent.slice(0, 50)}`, true)
      setAppliedOptimizations(newAppliedOptimizations)
      
      // Force regeneration of PDF data and refresh viewer with enhanced styling
      console.log('🔄 Triggering PDF refresh and regeneration with enhanced styling')
      
      // First, trigger a state update to force re-render
      setResumeData({...updatedResumeData})
      
      // Update PDF refresh key to force re-render
      setPdfRefreshKey(prev => prev + 1)
      
      // Generate enhanced PDF with better styling
      const regenerateEnhancedPDF = async () => {
        try {
          console.log('📄 Regenerating PDF with enhanced styling')
          const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sections: updatedSections, 
              filename: resumeData.filename,
              preserveStyle: true // Request enhanced styling
            })
          })
          
          if (response.ok) {
            const pdfResult = await response.json()
            if (pdfResult.success && pdfResult.pdfData) {
              // Update the PDF data in resume data
              const updatedWithPDF = {
                ...updatedResumeData,
                pdfData: pdfResult.pdfData
              }
              setResumeData(updatedWithPDF)
              localStorage.setItem('resumeData', JSON.stringify(updatedWithPDF))
              
              // Dispatch refresh events with new PDF data
              window.dispatchEvent(new Event('resume-updated'))
              window.dispatchEvent(new CustomEvent('resume-data-changed', { 
                detail: updatedWithPDF 
              }))
              console.log('✅ PDF regenerated successfully with enhanced styling')
            }
          }
        } catch (error) {
          console.error('❌ Failed to regenerate PDF:', error)
          // Fallback to basic refresh
          window.dispatchEvent(new Event('resume-updated'))
          window.dispatchEvent(new CustomEvent('resume-data-changed', { 
            detail: updatedResumeData 
          }))
        }
      }
      
      // Regenerate PDF with delays to ensure UI is ready
      setTimeout(regenerateEnhancedPDF, 100)
      setTimeout(regenerateEnhancedPDF, 500) // Backup attempt
      
      // Highlight will persist until manually dismissed
      console.log('🎨 Highlight will persist until manually dismissed')
      
      // Track the change in UI instead of showing alert
      const changeRecord = {
        section: sectionTitle,
        change: optimization.reason,
        timestamp: Date.now()
      }
      setRecentChanges(prev => [changeRecord, ...prev.slice(0, 4)]) // Keep last 5 changes
    } else {
      console.log('❌ Section not found for optimization:', optimization.section)
      console.log('📋 Available sections:', resumeData.sections.map(s => s.title))
      // Log error without showing alert popup
      console.error(`❌ Could not find section "${optimization.section}" to apply optimization.`)
      console.error(`📋 Available sections: ${resumeData.sections.map(s => s.title).join(', ')}`)
    }
  }

  // Removed handleApplyAllOptimizations function - users now copy suggestions manually
  const removedHandleApplyAllOptimizations = async () => {
    console.log('🔧 Apply All Optimizations clicked')
    console.log('📄 Current resume data:', resumeData)
    
    if (!resumeData || !resumeData.sections || !jobAnalysisResult?.optimizations || jobAnalysisResult.optimizations.length === 0) {
      console.log('❌ No resume data or optimizations available')
      alert('❌ No optimizations available to apply.')
      return
    }
    
    // Close the optimization modal first
    setShowOptimizations(false)
    
    // Switch to sections view to show the edits
    setViewMode('sections')
    
    let updatedSections = [...resumeData.sections]
    let appliedCount = 0
    let firstModifiedSectionIndex = -1
    const allOptimizationChanges = new Map(optimizationChanges)
    
    console.log('📋 Current sections:', updatedSections.map(s => s.title))
    console.log('🔧 Processing', jobAnalysisResult.optimizations.length, 'optimizations')
    
    // Initialize changes tracking for ALL sections that have optimizations
    jobAnalysisResult.optimizations.forEach((optimization: any) => {
      const matchedSection = updatedSections.find(section => {
        const sectionTitle = section.title.toLowerCase().trim()
        const optimizationSection = optimization.section.toLowerCase().trim()
        
        return sectionTitle === optimizationSection ||
               sectionTitle.includes(optimizationSection) || 
               optimizationSection.includes(sectionTitle) ||
               (sectionTitle.includes('experience') && optimizationSection.includes('experience')) ||
               (sectionTitle.includes('education') && optimizationSection.includes('education')) ||
               (sectionTitle.includes('skills') && optimizationSection.includes('skills')) ||
               (sectionTitle.includes('summary') && optimizationSection.includes('summary'))
      })
      
      if (matchedSection && !allOptimizationChanges.has(matchedSection.title)) {
        allOptimizationChanges.set(matchedSection.title, { added: [], removed: [] })
      }
    })
    
    // Apply all optimizations using the same logic as individual optimizations
    for (const optimization of jobAnalysisResult.optimizations) {
      console.log('🔍 Processing optimization for section:', optimization.section)
      
      // Find the section to update - try exact match first, then partial match
      let sectionIndex = updatedSections.findIndex(
        section => section.title.toLowerCase().trim() === optimization.section.toLowerCase().trim()
      )
      
      // If exact match not found, try partial matching with better logic
      if (sectionIndex === -1) {
        sectionIndex = updatedSections.findIndex(
          section => {
            const sectionTitle = section.title.toLowerCase().trim()
            const optimizationSection = optimization.section.toLowerCase().trim()
            
            // Check if either contains the other
            return sectionTitle.includes(optimizationSection) || 
                   optimizationSection.includes(sectionTitle) ||
                   // Check for common keywords
                   (sectionTitle.includes('experience') && optimizationSection.includes('experience')) ||
                   (sectionTitle.includes('education') && optimizationSection.includes('education')) ||
                   (sectionTitle.includes('skills') && optimizationSection.includes('skills')) ||
                   (sectionTitle.includes('summary') && optimizationSection.includes('summary'))
          }
        )
      }
      
      console.log('🎯 Found section at index:', sectionIndex)
      
      if (sectionIndex !== -1) {
        const sectionTitle = updatedSections[sectionIndex].title
        
        // Track changes for highlighting - ALWAYS track changes even if no replacement
        const currentChanges = allOptimizationChanges.get(sectionTitle) || { added: [], removed: [] }
        
        console.log('📝 Original content:', optimization.originalContent)
        console.log('✨ Suggested content:', optimization.suggestedContent)
        
        // ALWAYS add the optimization to tracking, regardless of replacement success
        currentChanges.added.push(optimization.suggestedContent)
        
        // Try to find and replace the specific content
        let newContent = updatedSections[sectionIndex].content
        let replacementMade = false
        
        // Try exact replacement first
        if (newContent.includes(optimization.originalContent)) {
          newContent = newContent.replace(optimization.originalContent, optimization.suggestedContent)
          console.log('✅ Exact replacement successful')
          
          // Track the replaced content
          currentChanges.removed.push(optimization.originalContent)
          replacementMade = true
        } else {
          // Try fuzzy matching - look for similar content
          const originalWords = optimization.originalContent.toLowerCase().split(/\s+/)
          const contentLines = newContent.split('\n')
          
          for (let i = 0; i < contentLines.length; i++) {
            const line = contentLines[i].toLowerCase()
            // If line contains most of the original words, replace it
            const matchingWords = originalWords.filter((word: string) => line.includes(word))
            if (matchingWords.length >= Math.min(3, originalWords.length * 0.6)) {
              // Track the original line that will be replaced
              currentChanges.removed.push(contentLines[i])
              
              contentLines[i] = optimization.suggestedContent
              replacementMade = true
              console.log('✅ Fuzzy replacement successful on line:', i)
              break
            }
          }
          
          if (replacementMade) {
            newContent = contentLines.join('\n')
          } else {
            // If no good match found, append the new content but still track it
            newContent = newContent + '\n\n' + optimization.suggestedContent
            console.log('✅ Appended new content - still tracked for highlighting')
          }
        }
        
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          content: newContent
        }
        
        // Save optimization changes for highlighting
        allOptimizationChanges.set(sectionTitle, currentChanges)
        
        // Track the first modified section for edit view
        if (firstModifiedSectionIndex === -1) {
          firstModifiedSectionIndex = sectionIndex
        }
        
        appliedCount++
        console.log('✅ Applied optimization to:', sectionTitle)
      } else {
        console.log('❌ Section not found for optimization:', optimization.section)
        
        // Even if section not found, track the optimization for display
        const fallbackChanges = allOptimizationChanges.get('Unmatched Optimizations') || { added: [], removed: [] }
        fallbackChanges.added.push(`${optimization.section}: ${optimization.suggestedContent}`)
        allOptimizationChanges.set('Unmatched Optimizations', fallbackChanges)
      }
    }
    
    console.log('📊 Applied optimizations count:', appliedCount)
    
    if (appliedCount > 0) {
      // Update the data first
      const updatedResumeData: ResumeData = {
        ...resumeData,
        sections: updatedSections,
        success: true
      }
      
      console.log('💾 Saving updated resume data')
      setResumeData(updatedResumeData)
      
      // Update localStorage
      localStorage.setItem('resumeData', JSON.stringify(updatedResumeData))
      
      // Save all optimization changes for highlighting
      setOptimizationChanges(allOptimizationChanges)
      
      // Switch to sections view to show the edits immediately
      setViewMode('sections')
      
      // After optimizations, we'll switch to DOCX viewer
      setShowDOCXViewer(true)
      
      // Open edit view for the first modified section
      if (firstModifiedSectionIndex !== -1) {
        setEditingIndex(firstModifiedSectionIndex)
        setEditContent(updatedSections[firstModifiedSectionIndex].content)
        
        // Highlight the first modified section
        const firstSectionTitle = updatedSections[firstModifiedSectionIndex].title
        setHighlightedSection(null)
        setTimeout(() => {
          setHighlightedSection(firstSectionTitle)
          console.log('🎨 Section highlighted:', firstSectionTitle)
        }, 50)
      }
      
      // Force regeneration of PDF data and refresh viewer with enhanced styling
      console.log('🔄 Triggering PDF refresh and regeneration with enhanced styling')
      
      // Update PDF refresh key to force re-render
      setPdfRefreshKey(prev => prev + 1)
      
      // Generate enhanced PDF with better styling
      const regenerateEnhancedPDF = async () => {
        try {
          console.log('📄 Regenerating PDF with enhanced styling')
          const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sections: updatedSections, 
              filename: resumeData.filename,
              preserveStyle: true // Request enhanced styling
            })
          })
          
          if (response.ok) {
            const pdfResult = await response.json()
            if (pdfResult.success && pdfResult.pdfData) {
              // Update the PDF data in resume data
              const updatedWithPDF = {
                ...updatedResumeData,
                pdfData: pdfResult.pdfData
              }
              setResumeData(updatedWithPDF)
              localStorage.setItem('resumeData', JSON.stringify(updatedWithPDF))
              
              // Dispatch refresh events with new PDF data
              window.dispatchEvent(new Event('resume-updated'))
              window.dispatchEvent(new CustomEvent('resume-data-changed', { 
                detail: updatedWithPDF 
              }))
              console.log('✅ PDF regenerated successfully with enhanced styling')
            }
          }
        } catch (error) {
          console.error('❌ Failed to regenerate PDF:', error)
          // Fallback to basic refresh
          window.dispatchEvent(new Event('resume-updated'))
          window.dispatchEvent(new CustomEvent('resume-data-changed', { 
            detail: updatedResumeData 
          }))
        }
      }
      
      // Regenerate PDF with delays to ensure UI is ready
      setTimeout(regenerateEnhancedPDF, 100)
      setTimeout(regenerateEnhancedPDF, 500) // Backup attempt
      
      // Show success message and automatically download DOCX
      setTimeout(() => {
        const optimizedSections = Array.from(allOptimizationChanges.keys()).filter(key => key !== 'Unmatched Optimizations')
        const totalOptimizations = Array.from(allOptimizationChanges.values()).reduce((sum, changes) => sum + changes.added.length, 0)
        
        const downloadDocx = confirm(
          `✅ Successfully applied ${totalOptimizations} optimizations across ${optimizedSections.length} sections!\n\n` +
          `Sections updated: ${optimizedSections.join(', ')}\n\n` +
          'Your optimized resume is ready. All changes are highlighted in the edit view.\n\n' +
          'Click OK to download the DOCX file with all formatting preserved.'
        )
        
        if (downloadDocx) {
          // Generate and download DOCX with the updated sections
          console.log('📄 Generating DOCX with optimized sections:', updatedSections.map(s => ({ title: s.title, contentLength: s.content?.length || 0 })))
          generateDOCX(updatedSections, resumeData.filename)
        }
        
        // Switch to DOCX viewer to show the optimized content
        setViewMode('pdf') // Use PDF view mode but show DOCX viewer
        setShowDOCXViewer(true)
      }, 1500)
      
      // Track applied optimizations
      const newAppliedOptimizations = new Map(appliedOptimizations)
      jobAnalysisResult.optimizations.forEach((optimization: any) => {
        newAppliedOptimizations.set(`${optimization.section}-${optimization.originalContent.slice(0, 50)}`, true)
      })
      setAppliedOptimizations(newAppliedOptimizations)
      
      console.log(`✅ Successfully applied ${appliedCount} out of ${jobAnalysisResult.optimizations.length} optimizations!`)
    } else {
      console.log('❌ No optimizations could be applied')
      alert('❌ No optimizations could be applied. Please check that your resume sections match the optimization targets.')
    }
  }

  // Disabled auto-open - user should manually open job description modal
  // useEffect(() => {
  //   if (resumeData && !jobAnalysisResult) {
  //     const timer = setTimeout(() => {
  //       setJobDescriptionModal(true)
  //     }, 2000) // Open after 2 seconds
  //     
  //     return () => clearTimeout(timer)
  //   }
  // }, [resumeData, jobAnalysisResult])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-space">
        <LoadingSpinner />
      </div>
    )
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-space">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Resume Data Found</h2>
          <p className="text-gray-600 mb-6">Please upload a resume first.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-[#000]/95 backdrop-blur-sm border-b border-gray-900 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="tracking-wide">BACK TO DASHBOARD</span>
              </button>
              <div className="h-6 w-px bg-gray-700" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <span className="text-black font-bold text-lg">Ai</span>
                </div>
                <span className="text-white font-bold text-xl tracking-wider">Apply</span>
                <div className="h-6 w-px bg-gray-700 ml-2" />
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gray-500" />
                  <h1 className="text-xl font-semibold tracking-wide">NEURAL RESUME ARCHITECT</h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-gray-900">
                <button
                  onClick={() => setViewMode('pdf')}
                  disabled={!resumeData?.fileData || resumeData?.fileType !== 'application/pdf'}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
                    viewMode === 'pdf'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-500 hover:text-white hover:bg-[#0f0f0f]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Eye size={14} />
                  <span>PDF View</span>
                </button>
                <button
                  onClick={() => setViewMode('sections')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm ${
                    viewMode === 'sections'
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-500 hover:text-white hover:bg-[#0f0f0f]'
                  }`}
                >
                  <Edit3 size={14} />
                  <span>Edit Sections</span>
                </button>
              </div>
              
              {/* Temporarily disabled PDF preview modal */}
              {/* <button
                onClick={() => setPdfPreviewOpen(true)}
                disabled={!resumeData?.fileData || resumeData?.fileType !== 'application/pdf'}
                className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] hover:bg-[#0f0f0f] rounded-lg transition-colors border border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={16} />
                <span>Full Screen</span>
              </button> */}
              
              <button
                onClick={handleJobSuggestions}
                disabled={isLoadingJobSuggestions}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingJobSuggestions ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Briefcase size={16} />
                )}
                <span>{isLoadingJobSuggestions ? 'ANALYZING...' : 'JOB SUGGESTIONS'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'mr-96' : 'mr-0'}`}>
          <div className="max-w-4xl mx-auto p-6">
            {/* File Info Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {resumeData.filename}
                  </h2>
                  <p className="text-gray-500">
                    {viewMode === 'pdf' ? 'PDF Document View' : `${resumeData.sections.length} sections found • ${resumeData.rawText.split(' ').length} words`}
                  </p>
                </div>
                {viewMode === 'sections' && (
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{resumeData.sections.length}</div>
                      <div className="text-sm text-gray-500">Sections Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-500">{resumeData.rawText.split(' ').length}</div>
                      <div className="text-sm text-gray-500">Total Words</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-500">{new Set(resumeData.sections.map(s => s.type)).size}</div>
                      <div className="text-sm text-gray-500">Section Types</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Content based on view mode */}
            {viewMode === 'pdf' ? (
              /* PDF View */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#000] rounded-xl border border-gray-900 overflow-hidden"
              >
                {showDOCXViewer ? (
                  <DOCXViewer
                    sections={resumeData.sections}
                    filename={resumeData.filename}
                    onDownload={() => generateDOCX(resumeData.sections, resumeData.filename)}
                  />
                ) : resumeData?.fileData && resumeData?.fileType === 'application/pdf' ? (
                  <div className="h-[800px] bg-gray-100 rounded-lg overflow-hidden">
                    {/* Inline PDF Viewer - Shows Original Uploaded PDF */}
                    <PDFInlineViewer
                      pdfData={resumeData.fileData}
                      filename={resumeData.filename}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">PDF Not Available</h3>
                      <p className="text-gray-500 mb-4">
                        {resumeData?.fileType !== 'application/pdf' 
                          ? 'This file is not a PDF document'
                          : 'PDF data is not available for preview'
                        }
                      </p>
                      <button
                        onClick={() => setViewMode('sections')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        View Extracted Sections
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              /* Sections View */
              <div className="space-y-6">
                <AnimatePresence>
                {resumeData.sections.map((section, index) => {
                  const IconComponent = sectionIcons[section.type] || FileText
                  const colorClass = sectionColors[section.type] || sectionColors.other
                  const isEditing = editingIndex === index

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-[#000] backdrop-blur-sm rounded-xl border border-gray-900 overflow-hidden hover:border-gray-900 transition-all duration-300`}
                    >
                      {/* Section Header */}
                      <div className={`px-6 py-4 border-b border-gray-900 ${colorClass}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <IconComponent size={20} />
                            </motion.div>
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                              {section.title}

                            </h2>
                            <span className="text-xs px-2 py-1 bg-[#0a0a0a] rounded-full capitalize">
                              {section.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleSave(index)}
                                  className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                  <Save size={16} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleCancelEdit(index)}
                                  className="p-2 bg-[#0a0a0a] hover:bg-[#0f0f0f] rounded-lg transition-colors"
                                  title="Cancel editing and clear optimization highlights"
                                >
                                  <X size={16} />
                                </motion.button>
                              </>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEdit(index)}
                                className="p-2 bg-[#0a0a0a] hover:bg-[#0f0f0f] rounded-lg transition-colors"
                              >
                                <Edit3 size={16} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section Content */}
                      <div className={`p-6 transition-all duration-300 ${
                        isEditing ? 'bg-gray-500/5 border-t border-gray-500/30' : ''
                      } ${
                        highlightedSection === section.title ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10' : ''
                      }`}>
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-gray-300 font-medium uppercase tracking-wide">Editing Mode</span>
                              {optimizationChanges.has(section.title) && (
                                <div className="flex items-center gap-2 ml-4">
                                  <span className="text-xs px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 rounded-full">
                                    ✨ Optimized
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Changes highlighted below
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Content Display */}
                            {false ? (
                              <div className="space-y-4">
                                <div className="bg-[#0a0a0a] rounded-lg p-4 border-2 border-gray-500/50">
                                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                                    <span>Content with Changes:</span>
                                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">Added</span>
                                    <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded">Removed</span>
                                  </div>
                                  <div className="whitespace-pre-wrap text-gray-300 font-space leading-relaxed max-h-80 overflow-y-auto">
                                    {(() => {
                                      const changes = optimizationChanges.get(section.title)!
                                      let displayContent = editContent
                                      
                                      // Create comprehensive optimization summary
                                      const allOptimizations = changes.added || []
                                      const allRemovedContent = changes.removed || []
                                      
                                      // Highlight content that exists in the text
                                      let highlightedOptimizations = 0
                                      allOptimizations.forEach((added: any, index: number) => {
                                        if (added && added.length > 10) { // Only highlight substantial content
                                          const escapedAdded = added.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                                          if (displayContent.toLowerCase().includes(added.toLowerCase())) {
                                            displayContent = displayContent.replace(
                                              new RegExp(escapedAdded, 'gi'),
                                              `<span style="background-color: rgba(34, 197, 94, 0.4); color: rgb(187, 247, 208); padding: 3px 6px; border-radius: 6px; border: 2px solid rgba(34, 197, 94, 0.6); font-weight: 600;">${added}</span>`
                                            )
                                            highlightedOptimizations++
                                          }
                                        }
                                      })
                                      
                                      // Always show ALL optimizations summary
                                      const optimizationsSummary = (
                                        <div className="mt-4 space-y-3">
                                          {/* Summary header */}
                                          <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                                            <div className="text-sm font-semibold text-gray-300 mb-2">
                                              📊 Applied Optimizations Summary ({allOptimizations.length} total)
                                            </div>
                                            <div className="text-xs text-gray-200">
                                              ✅ {highlightedOptimizations} highlighted in content above
                                              {allOptimizations.length - highlightedOptimizations > 0 && (
                                                <span> | 📝 {allOptimizations.length - highlightedOptimizations} shown below</span>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {/* All optimizations list */}
                                          {allOptimizations.length > 0 && (
                                            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                              <div className="text-xs font-semibold text-green-300 mb-3">🎯 All Optimization Changes:</div>
                                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                                {allOptimizations.map((added: any, idx: number) => (
                                                  <div key={idx} className="text-green-200 text-xs bg-green-500/20 p-3 rounded border border-green-500/40">
                                                    <div className="font-medium text-green-100 mb-1">Change #{idx + 1}:</div>
                                                    <div className="whitespace-pre-wrap">{added}</div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Replaced content */}
                                          {allRemovedContent.length > 0 && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                              <div className="text-xs font-semibold text-red-300 mb-2">🗑️ Replaced Content:</div>
                                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                                {allRemovedContent.map((removed: any, idx: number) => (
                                                  <div key={idx} className="text-red-200 text-xs line-through opacity-75 bg-red-500/20 p-2 rounded">
                                                    {removed}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )
                                      
                                      return (
                                        <div>
                                          <div dangerouslySetInnerHTML={{ __html: displayContent }} />
                                          {optimizationsSummary}
                                        </div>
                                      )
                                    })()
                                    }
                                  </div>
                                </div>
                                
                                {/* Editable Textarea */}
                                <motion.textarea
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full h-40 bg-[#0a0a0a] text-white rounded-lg p-4 border-2 border-gray-500/50 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500/20 resize-none font-space shadow-lg shadow-gray-500/10 transition-all duration-200"
                                  placeholder="Edit section content..."
                                />
                              </div>
                            ) : (
                              <motion.textarea
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full h-40 bg-[#0a0a0a] text-white rounded-lg p-4 border-2 border-gray-500/50 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500/20 resize-none font-space shadow-lg shadow-gray-500/10 transition-all duration-200"
                                placeholder="Edit section content..."
                                autoFocus
                              />
                            )}
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Characters: {editContent.length}</span>
                              <span className="flex items-center gap-1">
                                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                                Auto-saved
                              </span>
                            </div>
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`prose prose-invert max-w-none transition-all duration-300 ${
                            ""}`}
                          >
                            <pre className="whitespace-pre-wrap text-gray-300 font-space leading-relaxed">
                              {section.content}
                            </pre>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
                </AnimatePresence>
              </div>
            )}
          </div>

        {/* ATS Scoring Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="fixed right-0 top-16 bottom-0 w-96 bg-[#000]/98 backdrop-blur-sm border-l border-gray-900/50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold">ATS Analysis</h3>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 hover:bg-[#0a0a0a] rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {isLoadingATS ? (
                  <LoadingSpinner />
                ) : atsScore ? (
                  <div className="space-y-6">
                    {/* Overall Score - Center Aligned */}
                    <div className="text-center flex flex-col items-center">
                      <ScoreCircle score={atsScore.overall_score} />
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="mt-4 text-gray-500 text-center"
                      >
                        {atsScore.overall_score >= 80 ? 'Excellent ATS compatibility!' :
                         atsScore.overall_score >= 60 ? 'Good ATS compatibility' :
                         'Needs improvement for ATS'}
                      </motion.p>
                    </div>

                    {/* Category Breakdown */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Score Breakdown
                      </h4>
                      {Object.entries(atsScore.category_scores).map(([category, score], index) => (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="space-y-2"
                        >
                          <div className="flex justify-between text-sm">
                            <span className="capitalize text-gray-300">
                              {category.replace('_', ' ')}
                            </span>
                            <span className="text-white font-medium">{score}/25</span>
                          </div>
                          <div className="w-full bg-[#0a0a0a] rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(score / 25) * 100}%` }}
                              transition={{ delay: index * 0.1, duration: 1 }}
                              className="bg-gray-600 h-2 rounded-full"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Improvements Accordion */}
                    <Accordion type="single" collapsible className="w-full">
                      {/* Strengths Section */}
                      {atsScore.strengths.length > 0 && (
                        <AccordionItem value="strengths" className="border-gray-800">
                          <AccordionTrigger className="text-white hover:text-gray-300 py-3">
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-green-400" />
                              <span>Strengths ({atsScore.strengths.length})</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3 pt-2">
                            {atsScore.strengths.map((strength, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
                              >
                                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-300">{strength}</span>
                              </motion.div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Recent Changes */}
                      {false && (
                        <AccordionItem value="recent-changes" className="border-gray-800">
                          <AccordionTrigger className="text-green-400 hover:text-green-300 py-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>Recent Changes ({recentChanges.length})</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-2 pt-2">
                            {recentChanges.map((change, index) => (
                              <motion.div 
                                key={change.timestamp}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                  <span className="font-medium text-green-300">{change.section}</span>
                                  <span className="text-xs text-gray-600">
                                    {new Date(change.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className="text-gray-300 text-xs">{change.change}</div>
                              </motion.div>
                            ))}
                            <Button
                              onClick={() => setRecentChanges([])}
                              variant="outline"
                              size="sm"
                              className="w-full mt-2 border-gray-600 text-gray-500 hover:bg-gray-800"
                            >
                              Clear History
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Suggestions Section */}
                      <AccordionItem value="suggestions" className="border-gray-800">
                        <AccordionTrigger className="text-yellow-400 hover:text-yellow-300 py-3">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            <span>Improvement Suggestions ({atsScore.suggestions.length})</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-2">
                          {atsScore.suggestions.map((suggestion, index) => (
                            <motion.div 
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                            >
                              <TrendingUp className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-300">{suggestion}</span>
                            </motion.div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Job Description Buttons */}
                    {jobAnalysisResult ? (
                      <div className="space-y-3">
                        <Button 
                          onClick={() => setShowOptimizations(true)}
                          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          See Results
                        </Button>
                        <Dialog open={jobDescriptionModal} onOpenChange={setJobDescriptionModal}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline"
                              className="w-full py-2 border-gray-600 text-gray-300 hover:bg-gray-700/20 font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              PASTE NEW JOB DESCRIPTION
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-[#000] border-gray-800 text-white max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <FileSearch className="w-5 h-5" />
                                JOB DESCRIPTION ANALYSIS
                              </DialogTitle>
                              <DialogDescription className="text-gray-500">
                                Paste the job description to get personalized Resume Optimizations and Cover Letter.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here..."
                                className="w-full h-64 p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                              />
                              <div className="flex gap-3 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setJobDescriptionModal(false)}
                                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleJobDescriptionSubmit}
                                  disabled={!jobDescription.trim() || isAnalyzingJob}
                                  className="bg-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isAnalyzingJob ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Analyzing...
                                    </>
                                  ) : (
                                    'ANALYZE JOB DESCRIPTION'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    ) : (
                      <Dialog open={jobDescriptionModal} onOpenChange={setJobDescriptionModal}>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full py-3 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <FileSearch className="w-4 h-4" />
                            PASTE YOUR JOB DESCRIPTION
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#000] border-gray-800 text-white max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <FileSearch className="w-5 h-5" />
                              Job Description Analysis
                            </DialogTitle>
                            <DialogDescription className="text-gray-500">
                              Paste the job description to get personalized Resume Optimizations and Cover Letter for this specific role.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <textarea
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                              placeholder="Paste the job description here..."
                              className="w-full h-64 p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                            />
                            <div className="flex gap-3 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setJobDescriptionModal(false)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleJobDescriptionSubmit}
                                disabled={!jobDescription.trim() || isAnalyzingJob}
                                className="bg-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isAnalyzingJob ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  'Analyze Job Description'
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Job Analysis Results Modal */}
        <Dialog open={showOptimizations} onOpenChange={(open) => {
          // Don't clear data when closing modal - just hide it
          setShowOptimizations(open)
        }}>
          <DialogContent className="bg-[#000] border-gray-900 text-white w-[98vw] h-[98vh] max-w-none overflow-y-auto p-8">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gray-500" />
                AI Resume Analysis & Suggestions
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Copy the suggestions below and manually apply them to your resume for better ATS compatibility. We also provide a personalized cover letter.
              </DialogDescription>
            </DialogHeader>
            
            {jobAnalysisResult && (
              <div className="space-y-6 mt-4">
                {/* Match Score */}
                <div className="text-center p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
                  <div className="text-3xl font-bold text-white mb-2">
                    {jobAnalysisResult.matchScore}%
                  </div>
                  <div className="text-gray-300">Job Match Score</div>
                </div>

                {/* Key Insights */}
                {jobAnalysisResult.keyInsights && jobAnalysisResult.keyInsights.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      Key Insights
                      {jobAnalysisResult.keyInsights.some((insight: string) => insight.includes('fallback') || insight.includes('AI service unavailable')) && (
                        <span className="ml-2 px-2 py-1 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs rounded-full animate-pulse">
                          ⚠️ Fallback Mode
                        </span>
                      )}
                    </h4>
                    {jobAnalysisResult.keyInsights.map((insight: string, index: number) => {
                      const isFallback = insight.includes('fallback') || insight.includes('AI service unavailable');
                      return (
                        <div key={index} className={`p-4 rounded-lg border ${
                          isFallback 
                            ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-400/50 shadow-lg shadow-orange-500/10' 
                            : 'bg-gray-500/10 border-gray-500/20'
                        }`}>
                          <div className="flex items-start gap-3">
                            {isFallback && (
                              <div className="flex-shrink-0 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-white text-xs font-bold">!</span>
                              </div>
                            )}
                            <span className={`text-sm ${
                              isFallback ? 'text-orange-200 font-medium' : 'text-gray-300'
                            }`}>{insight}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Suggested Skills */}
                {jobAnalysisResult.suggestedSkills && jobAnalysisResult.suggestedSkills.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Code className="w-4 h-4 text-green-400" />
                      Suggested Skills to Add
                      {jobAnalysisResult.keyInsights?.some((insight: string) => insight.includes('fallback') || insight.includes('AI service unavailable')) && (
                        <span className="ml-2 px-2 py-1 bg-green-500/20 border border-green-500/40 text-green-300 text-xs rounded-full">
                          ✨ Generated
                        </span>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {jobAnalysisResult.suggestedSkills.map((skill: string, index: number) => (
                        <span key={index} className="px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-full text-sm text-green-200 hover:bg-green-500/30 transition-all duration-200 cursor-pointer shadow-md hover:shadow-green-500/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume Optimizations */}
                {jobAnalysisResult.optimizations && jobAnalysisResult.optimizations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-yellow-400" />
                      Resume Optimizations
                    </h4>
                    {jobAnalysisResult.optimizations.map((optimization: any, index: number) => (
                      <div key={index} className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-white capitalize">{optimization.section}</h5>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(optimization.suggestedContent)
                              // Show a temporary feedback
                              const button = document.activeElement as HTMLButtonElement
                              const originalText = button.textContent
                              button.textContent = 'Copied!'
                              setTimeout(() => {
                                button.textContent = originalText
                              }, 1000)
                            }}
                            size="sm"
                            className="bg-gray-700 hover:bg-gray-800 text-white flex items-center gap-2"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </Button>
                        </div>
                        <div className="text-sm text-gray-500 mb-2">{optimization.reason}</div>
                        <div className="space-y-4">
                          <div>
                            <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide flex items-center gap-2">
                              Current Content
                            </div>
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-gray-300 relative group">
                              {optimization.originalContent}
                              <Button
                                onClick={() => {
                                  navigator.clipboard.writeText(optimization.originalContent)
                                  const button = document.activeElement as HTMLButtonElement
                                  const originalText = button.textContent
                                  button.textContent = 'Copied!'
                                  setTimeout(() => {
                                    if (button.textContent === 'Copied!') {
                                      button.textContent = originalText
                                    }
                                  }, 1000)
                                }}
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 border-gray-600 hover:bg-gray-700"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1 uppercase tracking-wide flex items-center gap-2">
                              ✨ Suggested Improvement
                            </div>
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-gray-200 relative group">
                              {optimization.suggestedContent}
                              <Button
                                onClick={() => {
                                  navigator.clipboard.writeText(optimization.suggestedContent)
                                  const button = document.activeElement as HTMLButtonElement
                                  const originalText = button.textContent
                                  button.textContent = 'Copied!'
                                  setTimeout(() => {
                                    if (button.textContent === 'Copied!') {
                                      button.textContent = originalText
                                    }
                                  }, 1000)
                                }}
                                size="sm"
                                variant="outline"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 border-gray-600 hover:bg-gray-700"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cover Letter Suggestion */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    Cover Letter Generation
                  </h4>
                  <div className="p-4 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                    <p className="text-gray-300 text-sm mb-4">
                      Generate a personalized, professional cover letter tailored to this job posting using your resume data.
                    </p>
                    <Button
                      onClick={async () => {
                        if (!jobDescription.trim()) {
                          alert('Please enter a job description first')
                          return
                        }
                        
                        setIsGeneratingCoverLetter(true)
                        try {
                          const response = await fetch('/api/generate-cover-letter-content', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              jobDescription,
                              resumeSections: resumeData,
                              applicantName: resumeData?.sections?.find((s: ResumeSection) => s.title === 'Personal Information')?.content?.split('\n')[0] || 'Applicant'
                            })
                          })
                          
                          if (response.ok) {
                            const result = await response.json()
                            setPersistedCoverLetter(result.coverLetter)
                            localStorage.setItem('persistedCoverLetter', result.coverLetter)
                            setCoverLetterGenerated(true)
                            
                            // Show success message
                            alert('Cover letter generated successfully! You can now copy or download it.')
                          } else {
                            throw new Error('Failed to generate cover letter')
                          }
                        } catch (error) {
                          console.error('Cover letter generation error:', error)
                          alert('Failed to generate cover letter. Please try again.')
                        } finally {
                          setIsGeneratingCoverLetter(false)
                        }
                      }}
                      className="bg-gray-700 hover:bg-gray-800 text-white"
                      disabled={isGeneratingCoverLetter || !jobDescription.trim()}
                    >
                      {isGeneratingCoverLetter ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Generate Cover Letter
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Generated Cover Letter Display - Only show after successful generation */}
                {coverLetterGenerated && persistedCoverLetter && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-400" />
                      Your Generated Cover Letter
                    </h4>
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <textarea
                        value={persistedCoverLetter}
                        onChange={(e) => {
                          const newCoverLetter = e.target.value
                          setPersistedCoverLetter(newCoverLetter)
                          localStorage.setItem('persistedCoverLetter', newCoverLetter)
                        }}
                        className="w-full h-64 bg-[#0a0a0a] text-gray-300 rounded-lg p-4 border border-gray-800 focus:border-green-500 focus:outline-none resize-none text-sm whitespace-pre-wrap mb-4"
                        placeholder="Your cover letter will appear here..."
                      />
                      <div className="flex gap-3">
                        <Button
                          onClick={handleCopyCoverLetter}
                          variant="outline"
                          className="border-green-500 text-green-300 hover:bg-green-500/20"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy to Clipboard
                        </Button>
                        <Button
                          onClick={handleDownloadCoverLetter}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Cover Letter
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setShowOptimizations(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Toggle Sidebar Button */}
        {!sidebarOpen && (
          <motion.button
            initial={{ x: 100 }}
            animate={{ x: 0 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed right-4 top-1/2 transform -translate-y-1/2 p-3 bg-gray-700 hover:bg-gray-800 rounded-full shadow-lg transition-colors z-50"
          >
            <Target className="w-5 h-5" />
          </motion.button>
        )}
      </div>
          {!sidebarOpen && (
            <motion.button
              initial={{ x: 100 }}
              animate={{ x: 0 }}
              onClick={() => setSidebarOpen(true)}
              className="fixed right-4 top-1/2 transform -translate-y-1/2 p-3 bg-gray-700 hover:bg-gray-800 rounded-full shadow-lg transition-colors z-50"
            >
              <Target className="w-5 h-5" />
            </motion.button>
          )}
        </div>

      {/* Job Suggestions Modal */}
      <Dialog open={showJobSuggestions} onOpenChange={setShowJobSuggestions}>
        <DialogContent className="bg-[#000] border-gray-900 text-white w-[99vw] h-[96vh] max-w-none overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Briefcase className="w-6 h-6 text-gray-500" />
              AI-POWERED JOB SUGGESTIONS
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Using Mistral 7B AI to analyze your resume and search across LinkedIn, Indeed, Glassdoor, ZipRecruiter, Monster, and Dice for genuine opportunities.
            </DialogDescription>
          </DialogHeader>

          {jobSuggestions && (
            <div className="mt-6 space-y-6">
              {/* Resume Profile Summary */}
              <div className="bg-[#0a0a0a] border border-gray-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  YOUR PROFILE SUMMARY
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-300">{jobSuggestions.resumeProfile.experienceLevel}</div>
                    <div className="text-sm text-gray-600">Experience Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-300">{jobSuggestions.resumeProfile.industry}</div>
                    <div className="text-sm text-gray-600">Primary Industry</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-300">{jobSuggestions.resumeProfile.primarySkills.length}</div>
                    <div className="text-sm text-gray-600">Key Skills</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Top Skills:</div>
                  <div className="flex flex-wrap gap-2">
                    {jobSuggestions.resumeProfile.primarySkills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-800/50 border border-gray-800 rounded text-xs text-gray-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Job Suggestions Grid */}
              <div className="grid gap-6">
                {jobSuggestions.jobSuggestions.map((job, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#0a0a0a] border border-gray-900 rounded-lg p-6 hover:border-gray-800 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Job Header */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-200 mb-1">{job.title}</h3>
                            <div className="flex items-center gap-4 text-gray-500 text-sm">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {job.company}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {job.salaryRange}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-300">{job.matchScore}%</div>
                            <div className="text-xs text-gray-600">Match Score</div>
                          </div>
                        </div>

                        {/* Job Description */}
                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">{job.description}</p>

                        {/* Why You Match */}
                        <div className="bg-gray-800/30 border border-gray-800 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Why You're A Great Match
                          </h4>
                          <p className="text-gray-400 text-sm">{job.whyMatch}</p>
                        </div>

                        {/* Skills & Requirements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Skills Required</h4>
                            <div className="flex flex-wrap gap-1">
                              {job.keySkills.map((skill, skillIndex) => (
                                <span key={skillIndex} className="px-2 py-1 bg-gray-700/50 border border-gray-700 rounded text-xs text-gray-300">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Requirements</h4>
                            <ul className="text-xs text-gray-400 space-y-1">
                              {job.requirements.slice(0, 3).map((req, reqIndex) => (
                                <li key={reqIndex} className="flex items-center gap-2">
                                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <div className="flex flex-col justify-center">
                        <button
                          onClick={() => window.open(job.applicationLink || '#', '_blank')}
                          className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-300 whitespace-nowrap"
                        >
                          <ExternalLink className="w-4 h-4" />
                          APPLY NOW
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Analysis Date */}
              <div className="text-center text-xs text-gray-600 mt-8">
                <Clock className="w-4 h-4 inline mr-1" />
                Analysis generated on {new Date(jobSuggestions.analysisDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Preview Modal - Temporarily disabled */}
      {/* <PDFPreview
        isOpen={pdfPreviewOpen}
        onClose={() => setPdfPreviewOpen(false)}
        pdfData={resumeData?.fileData}
        filename={resumeData?.filename}
      /> */}
    </div>
    </>
  )
}
