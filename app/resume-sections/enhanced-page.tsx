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

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="relative"
    >
      <Loader2 className="w-8 h-8 text-blue-400" />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full border-2 border-blue-400/20"
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
          <div className="text-sm text-gray-400">ATS Score</div>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedResumeSections() {
  const router = useRouter()
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingATS, setIsLoadingATS] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showPDFPreview, setShowPDFPreview] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const data = localStorage.getItem('resumeData')
    if (data) {
      const parsedData = JSON.parse(data)
      setResumeData(parsedData)
      calculateATSScore(parsedData.sections)
    }
    setIsLoading(false)
  }, [])

  const calculateATSScore = async (sections: ResumeSection[]) => {
    setIsLoadingATS(true)
    try {
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

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditContent(resumeData?.sections[index].content || '')
  }

  const handleSave = (index: number) => {
    if (resumeData) {
      const updatedSections = [...resumeData.sections]
      updatedSections[index].content = editContent
      const updatedData = { ...resumeData, sections: updatedSections }
      setResumeData(updatedData)
      localStorage.setItem('resumeData', JSON.stringify(updatedData))
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Resume Data Found</h2>
          <p className="text-gray-400 mb-6">Please upload a resume first.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-600" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h1 className="text-xl font-semibold">Resume Analysis</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPDFPreview(!showPDFPreview)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <Eye size={16} />
                <span>PDF Preview</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
                  <p className="text-gray-400">
                    {resumeData.sections.length} sections found • {resumeData.rawText.split(' ').length} words
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{resumeData.sections.length}</div>
                    <div className="text-sm text-gray-400">Sections Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{resumeData.rawText.split(' ').length}</div>
                    <div className="text-sm text-gray-400">Total Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{resumeData.sections.length}</div>
                    <div className="text-sm text-gray-400">Section Types</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Resume Sections */}
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
                      className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300 ${colorClass.split(' ')[0]}/5`}
                    >
                      {/* Section Header */}
                      <div className={`px-6 py-4 border-b border-gray-700 ${colorClass}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <IconComponent size={20} />
                            </motion.div>
                            <h2 className="text-lg font-semibold">{section.title}</h2>
                            <span className="text-xs px-2 py-1 bg-gray-800 rounded-full capitalize">
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
                                  onClick={() => setEditingIndex(null)}
                                  className="p-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                  ×
                                </motion.button>
                              </>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEdit(index)}
                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                              >
                                <Edit3 size={16} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section Content */}
                      <div className="p-6">
                        {isEditing ? (
                          <motion.textarea
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full h-40 bg-gray-700 text-white rounded-lg p-4 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                            placeholder="Edit section content..."
                          />
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="prose prose-invert max-w-none"
                          >
                            <pre className="whitespace-pre-wrap text-gray-300 font-sans leading-relaxed">
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
          </div>
        </div>

        {/* ATS Scoring Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="fixed right-0 top-16 bottom-0 w-96 bg-gray-800/95 backdrop-blur-sm border-l border-gray-700 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold">ATS Analysis</h3>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>

                {isLoadingATS ? (
                  <LoadingSpinner />
                ) : atsScore ? (
                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className="text-center">
                      <ScoreCircle score={atsScore.overall_score} />
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="mt-4 text-gray-400"
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
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(score / 25) * 100}%` }}
                              transition={{ delay: index * 0.1, duration: 1 }}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Strengths */}
                    {atsScore.strengths.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-green-400" />
                          Strengths
                        </h4>
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
                      </div>
                    )}

                    {/* Suggestions */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        Improvement Suggestions
                      </h4>
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
                    </div>

                    {/* Refresh Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => calculateATSScore(resumeData.sections)}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Recalculate Score
                    </motion.button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Sidebar Button */}
        {!sidebarOpen && (
          <motion.button
            initial={{ x: 100 }}
            animate={{ x: 0 }}
            onClick={() => setSidebarOpen(true)}
            className="fixed right-4 top-1/2 transform -translate-y-1/2 p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors z-50"
          >
            <Target className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </div>
  )
}
