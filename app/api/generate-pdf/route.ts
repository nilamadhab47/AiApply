import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'

interface ResumeSection {
  title: string
  content: string
  type: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'other' | 'additional'
}

export async function POST(request: NextRequest) {
  try {
    const { sections, filename, preserveStyle } = await request.json()

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Invalid sections data' },
        { status: 400 }
      )
    }

    // Create new PDF document with enhanced styling
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Enhanced PDF styling configuration with reduced margins
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 12 // Reduced margin
    const contentWidth = pageWidth - (margin * 2)
    let currentY = margin

    // Color scheme for professional look
    const colors = {
      primary: [41, 128, 185], // Professional blue
      secondary: [52, 73, 94], // Dark gray
      accent: [231, 76, 60], // Red accent
      text: [44, 62, 80], // Dark text
      light: [236, 240, 241] // Light gray
    }

    // Enhanced helper function to add text with better styling
    const addText = (text: string, fontSize: number, isBold: boolean = false, isTitle: boolean = false, color: number[] = colors.text) => {
      pdf.setFontSize(fontSize)
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal')
      pdf.setTextColor(color[0], color[1], color[2])
      
      if (isTitle) {
        // Add decorative line for section titles
        if (currentY > margin + 10) {
          currentY += 6
        }
        
        // Add title with underline
        const titleWidth = pdf.getStringUnitWidth(text) * fontSize / pdf.internal.scaleFactor
        pdf.text(text, margin, currentY)
        
        // Add a subtle line under the title
        pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2])
        pdf.setLineWidth(0.5)
        pdf.line(margin, currentY + 2, margin + Math.min(titleWidth, contentWidth * 0.7), currentY + 2)
        
        currentY += 8
        return
      }
      
      // Split text into lines that fit within the content width
      const lines = pdf.splitTextToSize(text, contentWidth)
      
      // Check if we need a new page
      const lineHeight = fontSize * 0.35 // Reduced line height
      const textHeight = lines.length * lineHeight
      if (currentY + textHeight > pageHeight - margin - 8) {
        pdf.addPage()
        currentY = margin
      }
      
      // Add the text with proper line spacing
      lines.forEach((line: string, index: number) => {
        pdf.text(line, margin, currentY)
        currentY += lineHeight
      })
      
      currentY += (isTitle ? 3 : 1.5) // Reduced spacing after content
    }

    // Helper function to add bullet points
    const addBulletPoint = (text: string, fontSize: number = 10) => {
      const bulletX = margin + 5
      const textX = margin + 10
      
      // Add bullet point
      pdf.setFontSize(fontSize)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
      pdf.text('•', bulletX, currentY)
      
      // Add bullet text
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2])
      const lines = pdf.splitTextToSize(text, contentWidth - 10)
      lines.forEach((line: string) => {
        pdf.text(line, textX, currentY)
        currentY += fontSize * 0.35 // Reduced line height
      })
      currentY += 0.5 // Reduced spacing after bullet
    }

    // Extract name for header (if personal section exists)
    const personalSection = sections.find((s: ResumeSection) => s.type === 'personal')
    const applicantName = personalSection ? personalSection.content.split('\n')[0] : 'Professional Resume'

    // Add header with name
    if (applicantName && applicantName.trim() !== 'Professional Resume') {
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
      
      const nameWidth = pdf.getStringUnitWidth(applicantName) * 20 / pdf.internal.scaleFactor
      const nameX = (pageWidth - nameWidth) / 2 // Center the name
      pdf.text(applicantName, nameX, currentY)
      
      // Add decorative line under name
      pdf.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2])
      pdf.setLineWidth(0.8)
      pdf.line(margin, currentY + 2, pageWidth - margin, currentY + 2)
      
      currentY += 10 // Reduced spacing after name
    }

    // Process each section with enhanced formatting
    sections.forEach((section: ResumeSection, index: number) => {
      if (!section.content || section.content.trim() === '') return

      // Skip personal section if we already used it for header
      if (section.type === 'personal' && applicantName !== 'Professional Resume') {
        // Add remaining contact info (skip first line which is the name)
        const contactLines = section.content.split('\n').slice(1).filter(line => line.trim())
                  if (contactLines.length > 0) {
            addText('CONTACT INFORMATION', 12, true, true, colors.primary)
            contactLines.forEach(line => {
              if (line.trim()) {
                addText(line.trim(), 10, false, false)
              }
            })
            currentY += 2 // Reduced spacing
          }
        return
      }

      // Add section title with proper styling
      addText(section.title.toUpperCase(), 12, true, true, colors.primary)
      
      // Add section content with type-specific formatting
      const content = section.content.trim()
      
      if (section.type === 'experience') {
        // Format experience with better structure
        const lines = content.split('\n').filter(line => line.trim())
        lines.forEach(line => {
          if (line.trim()) {
            // Check if it's likely a job title/company line (contains dates or company indicators)
            if (line.includes('•') || line.startsWith('- ')) {
              addBulletPoint(line.replace(/^[•\-]\s*/, ''), 10)
            } else if (line.match(/\d{4}|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i)) {
              // Likely a job title with dates
              addText(line, 11, true, false, colors.secondary)
              currentY += 0.5 // Reduced spacing after job titles
            } else {
              addText(line, 10, false, false)
            }
          }
        })
      } else if (section.type === 'skills') {
        // Format skills in a more organized way
        const skillLines = content.split('\n').filter(line => line.trim())
        skillLines.forEach(line => {
          if (line.includes(':')) {
            // Category: skills format
            const [category, skills] = line.split(':')
            addText(category.trim() + ':', 10, true, false, colors.secondary)
            addText(skills.trim(), 10, false, false)
          } else if (line.includes('•') || line.includes(',')) {
            // Bullet points or comma-separated skills
            if (line.includes('•')) {
              addBulletPoint(line.replace(/^[•\-]\s*/, ''), 10)
            } else {
              addText(line, 10, false, false)
            }
          } else {
            addText(line, 10, false, false)
          }
        })
      } else if (section.type === 'education') {
        // Format education with structure
        const lines = content.split('\n').filter(line => line.trim())
        lines.forEach(line => {
          if (line.trim()) {
            if (line.match(/\b(Bachelor|Master|PhD|Certificate|Diploma|Associate)\b/i)) {
              addText(line, 11, true, false, colors.secondary)
              currentY += 0.5 // Reduced spacing after education titles
            } else if (line.includes('•') || line.startsWith('- ')) {
              addBulletPoint(line.replace(/^[•\-]\s*/, ''), 10)
            } else {
              addText(line, 10, false, false)
            }
          }
        })
      } else {
        // Regular content formatting with bullet point detection
        const lines = content.split('\n').filter(line => line.trim())
        lines.forEach(line => {
          if (line.trim()) {
            if (line.includes('•') || line.startsWith('- ')) {
              addBulletPoint(line.replace(/^[•\-]\s*/, ''), 10)
            } else {
              addText(line, 10, false, false)
            }
          }
        })
      }
      
      currentY += 3 // Reduced spacing between sections
    })

    // Generate PDF buffer
    const pdfBuffer = pdf.output('arraybuffer')
    
    // Convert to base64 for frontend consumption
    const base64Pdf = Buffer.from(pdfBuffer).toString('base64')
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`

    return NextResponse.json({
      success: true,
      pdfData: dataUrl,
      filename: filename || 'resume.pdf'
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
