'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Maximize2, Crown } from 'lucide-react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import PlaceholderImage from '@/components/PlaceholderImage'

interface TemplatePreviewProps {
  isOpen: boolean
  onClose: () => void
  template: {
    id: string
    name: string
    description: string
    category: string
    isPremium: boolean
    rating: number
    downloads: number
    previewImage: string
    fullPreview: string[]
    tags: string[]
    features: string[]
  } | null
  onDownload: (id: string) => void
  isUserPremium: boolean
}

export default function TemplatePreview({
  isOpen,
  onClose,
  template,
  onDownload,
  isUserPremium
}: TemplatePreviewProps) {
  if (!template) return null

  const canAccess = !template.isPremium || isUserPremium

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#000] border-gray-800 text-white max-w-6xl w-[95vw] h-[95vh] overflow-y-auto p-0">
        <div className="relative">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#000]/95 backdrop-blur-sm border-b border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold">{template.name}</h2>
                    {template.isPremium && (
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        PRO
                      </div>
                    )}
                  </div>
                  <p className="text-gray-400">{template.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{template.category}</span>
                    <span>•</span>
                    <span>⭐ {template.rating}</span>
                    <span>•</span>
                    <span>{template.downloads.toLocaleString()} downloads</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {canAccess ? (
                  <button
                    onClick={() => onDownload(template.id)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Use This Template
                  </button>
                ) : (
                  <button
                    onClick={() => onDownload(template.id)}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors font-bold flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Upgrade to Use
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Preview Images */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4">Template Preview</h3>
                <div className="space-y-4">
                  {template.fullPreview.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative bg-gray-900 rounded-lg overflow-hidden"
                    >
                      <PlaceholderImage
                        width={800}
                        height={1000}
                        text={`${template.name} Preview ${index + 1}`}
                        className="w-full h-auto"
                      />
                      
                      {!canAccess && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-center">
                            <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                            <p className="text-white font-semibold mb-2">Premium Template</p>
                            <p className="text-gray-300 text-sm mb-4">Upgrade to access this template</p>
                            <button
                              onClick={() => onDownload(template.id)}
                              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-lg font-bold"
                            >
                              Upgrade Now
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Template Info */}
              <div className="space-y-6">
                {/* Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Features</h3>
                  <div className="space-y-2">
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Best For */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Best For</h3>
                  <div className="text-sm text-gray-400">
                    This template is perfect for professionals in {template.category.toLowerCase()} 
                    looking to create a standout resume that gets noticed by employers and ATS systems.
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-gray-900 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Template Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rating</span>
                      <span className="text-white">⭐ {template.rating}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Downloads</span>
                      <span className="text-white">{template.downloads.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category</span>
                      <span className="text-white">{template.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type</span>
                      <span className="text-white">{template.isPremium ? 'Premium' : 'Free'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
