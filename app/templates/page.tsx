'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Grid, List, Crown, Star, Download } from 'lucide-react'
import Head from 'next/head'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import TemplateCard from '@/components/templates/TemplateCard'
import TemplatePreview from '@/components/templates/TemplatePreview'
import TemplateApplicator from '@/components/templates/TemplateApplicator'
import { templates, categories, getTemplatesByCategory, Template } from '@/data/templates'

export default function TemplatesPage() {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showPremiumOnly, setShowPremiumOnly] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isApplicatorOpen, setIsApplicatorOpen] = useState(false)
  
  // Mock user premium status - replace with real logic
  const isUserPremium = false // This should come from user subscription status

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesPremiumFilter = !showPremiumOnly || template.isPremium
    
    return matchesCategory && matchesSearch && matchesPremiumFilter
  })

  const handlePreview = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setPreviewTemplate(template)
      setIsPreviewOpen(true)
    }
  }

  const handleDownload = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    if (template.isPremium && !isUserPremium) {
      // Redirect to upgrade page
      router.push('/upgrade')
      return
    }

    // Open template applicator
    setSelectedTemplate(template)
    setIsApplicatorOpen(true)
  }

  const stats = {
    total: templates.length,
    free: templates.filter(t => !t.isPremium).length,
    premium: templates.filter(t => t.isPremium).length,
    downloads: templates.reduce((sum, t) => sum + t.downloads, 0)
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
        <div className="bg-[#000]/95 backdrop-blur-sm border-b border-gray-900 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-wider">TEMPLATE MARKETPLACE</h1>
                <p className="text-gray-500 mt-1">Professional resume templates designed by experts</p>
              </div>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm font-medium tracking-wide"
              >
                BACK TO DASHBOARD
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-900/50 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Templates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.free}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Free Templates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.premium}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Premium Templates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{stats.downloads.toLocaleString()}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Total Downloads</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:border-gray-700 focus:outline-none text-white placeholder-gray-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* View Options */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPremiumOnly(!showPremiumOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showPremiumOnly
                    ? 'bg-yellow-600 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Crown className="w-4 h-4" />
                Premium Only
              </button>
              
              <div className="flex items-center bg-gray-900 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400">
              Showing {filteredTemplates.length} of {templates.length} templates
            </p>
            
            {!isUserPremium && (
              <button
                onClick={() => router.push('/upgrade')}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transition-colors flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                UPGRADE FOR PREMIUM
              </button>
            )}
          </div>

          {/* Templates Grid */}
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TemplateCard
                  {...template}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  isUserPremium={isUserPremium}
                />
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold mb-2">No templates found</h3>
              <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                  setShowPremiumOnly(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Template Preview Modal */}
        <TemplatePreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          template={previewTemplate}
          onDownload={handleDownload}
          isUserPremium={isUserPremium}
        />

        {/* Template Applicator Modal */}
        <TemplateApplicator
          isOpen={isApplicatorOpen}
          onClose={() => setIsApplicatorOpen(false)}
          templateName={selectedTemplate?.templateFile || selectedTemplate?.id || ''}
          templateDisplayName={selectedTemplate?.name || ''}
        />
      </div>
    </>
  )
}
