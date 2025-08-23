export interface Template {
  id: string
  name: string
  description: string
  category: string
  isPremium: boolean
  rating: number
  downloads: number
  previewImage: string
  fullPreview: string[]
  templateFile?: string  // Backend template identifier
  tags: string[]
  features: string[]
  structure: {
    sections: string[]
    layout: 'single-column' | 'two-column' | 'creative'
    colors: string[]
  }
}

export const templates: Template[] = [
  // FREE TEMPLATES
  {
    id: 'classic-professional',
    name: 'Classic Professional',
    description: 'Clean, traditional resume template perfect for corporate environments',
    category: 'Professional',
    isPremium: false,
    rating: 4.5,
    downloads: 12547,
    previewImage: '/templates/classic-professional-preview.jpg',
    fullPreview: [
      '/templates/classic-professional-full-1.jpg',
      '/templates/classic-professional-full-2.jpg'
    ],
    templateFile: 'professional',  // Maps to PDF template
    tags: ['Corporate', 'Traditional', 'ATS-Friendly', 'Clean'],
    features: [
      'ATS-optimized format',
      'Clean typography',
      'Professional layout',
      'Easy to customize',
      'PDF export ready'
    ],
    structure: {
      sections: ['Header', 'Summary', 'Experience', 'Education', 'Skills'],
      layout: 'single-column',
      colors: ['#000000', '#333333', '#666666']
    }
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Sleek, minimalist design that stands out while remaining professional',
    category: 'Modern',
    isPremium: false,
    rating: 4.3,
    downloads: 8934,
    previewImage: '/templates/modern-minimal-preview.jpg',
    fullPreview: [
      '/templates/modern-minimal-full-1.jpg'
    ],
    templateFile: 'modern',  // Maps to PDF template
    tags: ['Minimal', 'Clean', 'Modern', 'Simple'],
    features: [
      'Minimalist design',
      'Modern typography',
      'Plenty of white space',
      'Easy to read',
      'Professional look'
    ],
    structure: {
      sections: ['Header', 'About', 'Experience', 'Education', 'Skills', 'Projects'],
      layout: 'single-column',
      colors: ['#2c3e50', '#34495e', '#7f8c8d']
    }
  },

  // PREMIUM TEMPLATES
  {
    id: 'executive-premium',
    name: 'Executive Premium',
    description: 'Sophisticated template designed for C-level executives and senior management',
    category: 'Executive',
    isPremium: true,
    rating: 4.9,
    downloads: 3421,
    previewImage: '/templates/executive-premium-preview.jpg',
    fullPreview: [
      '/templates/executive-premium-full-1.jpg',
      '/templates/executive-premium-full-2.jpg'
    ],
    tags: ['Executive', 'Leadership', 'Premium', 'Sophisticated', 'C-Level'],
    features: [
      'Executive-focused sections',
      'Leadership achievements highlight',
      'Premium typography',
      'Professional color scheme',
      'Board experience section',
      'Strategic accomplishments format'
    ],
    templateFile: 'executive',  // Maps to PDF template
    structure: {
      sections: ['Executive Summary', 'Leadership Experience', 'Strategic Achievements', 'Board Positions', 'Education', 'Certifications'],
      layout: 'two-column',
      colors: ['#1a365d', '#2d3748', '#4a5568']
    }
  },
  {
    id: 'tech-engineer',
    name: 'Tech Engineer Pro',
    description: 'Cutting-edge template specifically designed for software engineers and developers',
    category: 'Technology',
    isPremium: true,
    rating: 4.8,
    downloads: 5632,
    previewImage: '/templates/tech-engineer-preview.jpg',
    fullPreview: [
      '/templates/tech-engineer-full-1.jpg',
      '/templates/tech-engineer-full-2.jpg'
    ],
    tags: ['Tech', 'Engineering', 'Developer', 'Programming', 'GitHub'],
    features: [
      'GitHub integration styling',
      'Technical skills matrix',
      'Project showcase section',
      'Code contribution highlights',
      'Tech stack visualization',
      'Open source contributions'
    ],
    structure: {
      sections: ['Profile', 'Technical Skills', 'Experience', 'Projects', 'Open Source', 'Education'],
      layout: 'two-column',
      colors: ['#0d1117', '#21262d', '#30363d']
    }
  },
  {
    id: 'creative-designer',
    name: 'Creative Designer',
    description: 'Vibrant, creative template perfect for designers, artists, and creative professionals',
    category: 'Creative',
    isPremium: true,
    rating: 4.7,
    downloads: 4156,
    previewImage: '/templates/creative-designer-preview.jpg',
    fullPreview: [
      '/templates/creative-designer-full-1.jpg',
      '/templates/creative-designer-full-2.jpg'
    ],
    tags: ['Creative', 'Design', 'Artistic', 'Portfolio', 'Colorful'],
    features: [
      'Creative layout design',
      'Portfolio integration',
      'Color customization',
      'Visual elements',
      'Design tool proficiency',
      'Creative project showcase'
    ],
    templateFile: 'creative',  // Maps to PDF template
    structure: {
      sections: ['Creative Profile', 'Design Experience', 'Portfolio', 'Skills', 'Education', 'Awards'],
      layout: 'creative',
      colors: ['#e53e3e', '#38a169', '#3182ce']
    }
  },
  {
    id: 'healthcare-medical',
    name: 'Healthcare Professional',
    description: 'Specialized template for healthcare workers, doctors, and medical professionals',
    category: 'Healthcare',
    isPremium: true,
    rating: 4.6,
    downloads: 2843,
    previewImage: '/templates/healthcare-preview.jpg',
    fullPreview: [
      '/templates/healthcare-full-1.jpg'
    ],
    tags: ['Healthcare', 'Medical', 'Doctor', 'Nurse', 'Clinical'],
    features: [
      'Medical credentials section',
      'Clinical experience format',
      'Certification highlights',
      'Patient care focus',
      'Research publications',
      'Medical specializations'
    ],
    structure: {
      sections: ['Professional Summary', 'Medical Experience', 'Certifications', 'Education', 'Research', 'Specializations'],
      layout: 'single-column',
      colors: ['#2b6cb0', '#3182ce', '#4299e1']
    }
  },
  {
    id: 'finance-banking',
    name: 'Finance & Banking Pro',
    description: 'Professional template tailored for finance professionals and banking executives',
    category: 'Finance',
    isPremium: true,
    rating: 4.8,
    downloads: 3967,
    previewImage: '/templates/finance-preview.jpg',
    fullPreview: [
      '/templates/finance-full-1.jpg',
      '/templates/finance-full-2.jpg'
    ],
    tags: ['Finance', 'Banking', 'Investment', 'Analysis', 'CFA'],
    features: [
      'Financial achievements focus',
      'Quantified results emphasis',
      'Investment experience',
      'Risk management section',
      'Financial certifications',
      'Deal experience highlight'
    ],
    structure: {
      sections: ['Executive Summary', 'Professional Experience', 'Key Achievements', 'Certifications', 'Education', 'Technical Skills'],
      layout: 'two-column',
      colors: ['#1a202c', '#2d3748', '#4a5568']
    }
  },
  {
    id: 'marketing-digital',
    name: 'Digital Marketing Expert',
    description: 'Dynamic template for marketing professionals and digital marketing specialists',
    category: 'Marketing',
    isPremium: true,
    rating: 4.7,
    downloads: 4521,
    previewImage: '/templates/marketing-preview.jpg',
    fullPreview: [
      '/templates/marketing-full-1.jpg'
    ],
    tags: ['Marketing', 'Digital', 'Social Media', 'Analytics', 'Growth'],
    features: [
      'Campaign results showcase',
      'Digital metrics emphasis',
      'Social media expertise',
      'Growth achievements',
      'Marketing tools proficiency',
      'ROI-focused content'
    ],
    structure: {
      sections: ['Marketing Profile', 'Campaign Experience', 'Key Metrics', 'Digital Skills', 'Education', 'Certifications'],
      layout: 'two-column',
      colors: ['#d53f8c', '#e53e3e', '#fd9801']
    }
  },
  {
    id: 'sales-executive',
    name: 'Sales Executive Pro',
    description: 'Results-driven template highlighting sales achievements and revenue growth',
    category: 'Sales',
    isPremium: true,
    rating: 4.9,
    downloads: 3287,
    previewImage: '/templates/sales-preview.jpg',
    fullPreview: [
      '/templates/sales-full-1.jpg'
    ],
    tags: ['Sales', 'Revenue', 'Growth', 'B2B', 'Enterprise'],
    features: [
      'Revenue achievements focus',
      'Sales metrics emphasis',
      'Client relationship highlights',
      'Territory management',
      'Deal closure statistics',
      'CRM proficiency'
    ],
    structure: {
      sections: ['Sales Profile', 'Revenue Achievements', 'Sales Experience', 'Key Accounts', 'Skills', 'Education'],
      layout: 'single-column',
      colors: ['#38a169', '#48bb78', '#68d391']
    }
  },
  {
    id: 'startup-founder',
    name: 'Startup Founder',
    description: 'Entrepreneurial template perfect for startup founders and business leaders',
    category: 'Entrepreneurship',
    isPremium: true,
    rating: 4.8,
    downloads: 2156,
    previewImage: '/templates/startup-preview.jpg',
    fullPreview: [
      '/templates/startup-full-1.jpg'
    ],
    tags: ['Startup', 'Founder', 'Entrepreneur', 'Leadership', 'Innovation'],
    features: [
      'Startup experience focus',
      'Funding achievements',
      'Team building highlights',
      'Innovation showcase',
      'Growth metrics',
      'Exit strategy experience'
    ],
    structure: {
      sections: ['Founder Profile', 'Startup Experience', 'Funding & Growth', 'Leadership', 'Skills', 'Education'],
      layout: 'creative',
      colors: ['#805ad5', '#9f7aea', '#b794f6']
    }
  }
]

export const categories = [
  'All',
  'Professional',
  'Modern',
  'Executive',
  'Technology',
  'Creative',
  'Healthcare',
  'Finance',
  'Marketing',
  'Sales',
  'Entrepreneurship'
]

export const getTemplateById = (id: string): Template | undefined => {
  return templates.find(template => template.id === id)
}

export const getTemplatesByCategory = (category: string): Template[] => {
  if (category === 'All') return templates
  return templates.filter(template => template.category === category)
}

export const getFreeTemplates = (): Template[] => {
  return templates.filter(template => !template.isPremium)
}

export const getPremiumTemplates = (): Template[] => {
  return templates.filter(template => template.isPremium)
}
