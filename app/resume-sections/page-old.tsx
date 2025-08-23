'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, FileText, User, Briefcase, GraduationCap, Code, FolderOpen, 
  Edit3, Download, Save, Eye, Target, TrendingUp, CheckCircle, AlertCircle,
  Loader2, Sparkles, BarChart3, Award, Zap, Star
} from 'lucide-react'

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
  personal: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  summary: 'bg-green-500/10 border-green-500/20 text-green-400',
  experience: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  education: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  skills: 'bg-red-500/10 border-red-500/20 text-red-400',
  projects: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  other: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
  additional: 'bg-gray-500/10 border-gray-500/20 text-gray-400'
}

export default function ResumeSections() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [editingSection, setEditingSection] = useState<number | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const router = useRouter()

  useEffect(() => {
    const data = sessionStorage.getItem('resumeData')
    if (data) {
      setResumeData(JSON.parse(data))
    } else {
      router.push('/dashboard')
    }
  }, [router])

  const handleEditSection = (index: number, content: string) => {
    setEditingSection(index)
    setEditedContent(content)
  }

  const handleSaveSection = (index: number) => {
    if (resumeData) {
      const updatedSections = [...resumeData.sections]
      updatedSections[index].content = editedContent
      const updatedData = { ...resumeData, sections: updatedSections }
      setResumeData(updatedData)
      sessionStorage.setItem('resumeData', JSON.stringify(updatedData))
    }
    setEditingSection(null)
    setEditedContent('')
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
    setEditedContent('')
  }

  const handleDownload = () => {
    if (!resumeData) return
    
    const content = resumeData.sections
      .map(section => `${section.title}\n${'='.repeat(section.title.length)}\n\n${section.content}\n\n`)
      .join('')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resumeData.filename.replace(/\.[^/.]+$/, '')}_extracted.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading resume data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-700"></div>
              <div>
                <h1 className="text-xl font-semibold">Resume Sections</h1>
                <p className="text-sm text-gray-400">{resumeData.filename}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          {resumeData.sections.map((section, index) => {
            const IconComponent = sectionIcons[section.type]
            const colorClass = sectionColors[section.type]
            const isEditing = editingSection === index

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Section Header */}
                <div className={`px-6 py-4 border-b border-gray-700 ${colorClass}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent size={20} />
                      <h2 className="text-lg font-semibold">{section.title}</h2>
                      <span className="text-xs px-2 py-1 bg-gray-800 rounded-full capitalize">
                        {section.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveSection(index)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                          >
                            <Save size={14} />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditSection(index, section.content)}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Content */}
                <div className="p-6">
                  {isEditing ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-40 bg-gray-800 border border-gray-600 rounded-lg p-4 text-white resize-none focus:outline-none focus:border-blue-500"
                      placeholder="Edit section content..."
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                      {section.content.trim() || (
                        <span className="text-gray-500 italic">No content available</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{resumeData.sections.length}</div>
            <div className="text-sm text-gray-400">Sections Found</div>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {resumeData.rawText.split(' ').length}
            </div>
            <div className="text-sm text-gray-400">Total Words</div>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {new Set(resumeData.sections.map(s => s.type)).size}
            </div>
            <div className="text-sm text-gray-400">Section Types</div>
          </div>
        </div>
      </div>
    </div>
  )
}
