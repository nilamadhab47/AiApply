'use client'

import { motion } from 'framer-motion'
import { Eye, Download, Star, Crown, Lock } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import PlaceholderImage from '@/components/PlaceholderImage'

interface TemplateCardProps {
  id: string
  name: string
  description: string
  category: string
  isPremium: boolean
  rating: number
  downloads: number
  previewImage: string
  tags: string[]
  onPreview: (id: string) => void
  onDownload: (id: string) => void
  isUserPremium: boolean
}

export default function TemplateCard({
  id,
  name,
  description,
  category,
  isPremium,
  rating,
  downloads,
  previewImage,
  tags,
  onPreview,
  onDownload,
  isUserPremium
}: TemplateCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const canAccess = !isPremium || isUserPremium

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all duration-300 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Crown className="w-3 h-3" />
          PRO
        </div>
      )}

      {/* Preview Image */}
      <div className="relative h-64 bg-gray-900 overflow-hidden">
        <PlaceholderImage
          width={300}
          height={256}
          text={name}
          className="w-full h-full transition-transform duration-300 hover:scale-105"
        />
        
        {/* Overlay on Hover */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3"
          >
            <button
              onClick={() => onPreview(id)}
              className="bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-colors"
            >
              <Eye className="w-5 h-5" />
            </button>
            
            {canAccess ? (
              <button
                onClick={() => onDownload(id)}
                className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => onDownload(id)}
                className="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700 transition-colors"
              >
                <Lock className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-white truncate">{name}</h3>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm">{rating}</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{description}</p>

        {/* Category */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded-full">
            {category}
          </span>
          <span className="text-xs text-gray-500">{downloads.toLocaleString()} downloads</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 bg-gray-900 text-gray-400 rounded"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-gray-500">+{tags.length - 3} more</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(id)}
            className="flex-1 py-2 px-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          
          {canAccess ? (
            <button
              onClick={() => onDownload(id)}
              className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Use Template
            </button>
          ) : (
            <button
              onClick={() => onDownload(id)}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors text-sm font-bold flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
