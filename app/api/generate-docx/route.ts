import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } from 'docx'

interface ResumeSection {
  title: string
  content: string
  type: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'other' | 'additional'
}

export async function POST(request: NextRequest) {
  try {
    const { sections, filename } = await request.json()

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'Invalid sections data' },
        { status: 400 }
      )
    }

    // Extract name for header
    const personalSection = sections.find(s => s.type === 'personal')
    const applicantName = personalSection ? personalSection.content.split('\n')[0] : ''

    // Create document with professional styling and minimal gaps
    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: "heading",
            name: "Heading",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 28,
              bold: true,
              color: "2B5797",
              font: "Calibri"
            },
            paragraph: {
              spacing: { 
                before: 200, 
                after: 100 
              }
            }
          },
          {
            id: "nameHeader",
            name: "Name Header",
            basedOn: "Normal",
            run: {
              size: 36,
              bold: true,
              color: "1F4E79",
              font: "Calibri"
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: { 
                before: 0, 
                after: 150 
              }
            }
          },
          {
            id: "normal",
            name: "Normal",
            run: {
              size: 22,
              font: "Calibri",
              color: "000000"
            },
            paragraph: {
              spacing: { 
                before: 0, 
                after: 80 
              }
            }
          }
        ]
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top: 576,    // 0.4 inch - reduced
              right: 576,  // 0.4 inch - reduced  
              bottom: 576, // 0.4 inch - reduced
              left: 576,   // 0.4 inch - reduced
            },
          },
        },
        children: createDocumentContent(sections, applicantName)
      }]
    })

    // Generate DOCX buffer
    const buffer = await Packer.toBuffer(doc)
    
    // Convert to base64 for frontend consumption
    const base64Docx = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64Docx}`

    return NextResponse.json({
      success: true,
      docxData: dataUrl,
      filename: filename ? filename.replace(/\.(pdf|txt)$/i, '.docx') : 'resume.docx'
    })

  } catch (error) {
    console.error('Error generating DOCX:', error)
    return NextResponse.json(
      { error: 'Failed to generate DOCX' },
      { status: 500 }
    )
  }
}

function createDocumentContent(sections: ResumeSection[], applicantName: string): Paragraph[] {
  const paragraphs: Paragraph[] = []

  // Add name header if available
  if (applicantName && applicantName.trim() !== '') {
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: applicantName.trim(),
          size: 36,
          bold: true,
          color: "1F4E79",
          font: 'Calibri',
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 150 }
    }))

    // Add a decorative line
    paragraphs.push(new Paragraph({
      children: [new TextRun("")],
      spacing: { before: 0, after: 100 },
      border: {
        bottom: {
          color: 'E74C3C',
          size: 12,
          style: 'single'
        }
      }
    }))
  }

  sections.forEach((section, index) => {
    if (!section.content || section.content.trim() === '') return

    // Skip personal section if we used the name as header
    if (section.type === 'personal' && applicantName) {
      // Add remaining contact info (skip first line which is the name)
      const contactLines = section.content.split('\n').slice(1).filter(line => line.trim())
      if (contactLines.length > 0) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: "CONTACT INFORMATION",
              bold: true,
              size: 26,
              color: "2B5797",
              font: 'Calibri',
            })
          ],
          spacing: { before: 150, after: 80 },
          border: {
            bottom: {
              color: '2B5797',
              size: 6,
              style: 'single'
            }
          }
        }))
        
        contactLines.forEach(line => {
          paragraphs.push(new Paragraph({
            children: [
              new TextRun({
                text: line.trim(),
                size: 22,
                font: 'Calibri',
              })
            ],
            spacing: { before: 0, after: 60 }
          }))
        })
      }
      return
    }

    // Add minimal spacing before sections
    if (paragraphs.length > 0) {
      paragraphs.push(new Paragraph({
        children: [new TextRun("")],
        spacing: { before: 120, after: 0 } // Reduced spacing
      }))
    }

    // Add section title with professional formatting
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: section.title.toUpperCase(),
          bold: true,
          size: 26, // Slightly larger
          color: "2B5797", // Professional blue
          font: 'Calibri',
        })
      ],
      spacing: { before: 100, after: 80 }, // Reduced spacing
      border: {
        bottom: {
          color: '2B5797',
          size: 6,
          style: 'single'
        }
      }
    }))

    // Process section content based on type
    const contentParagraphs = formatSectionContent(section)
    paragraphs.push(...contentParagraphs)
  })

  return paragraphs
}

function formatSectionContent(section: ResumeSection): Paragraph[] {
  const paragraphs: Paragraph[] = []
  
  // Handle undefined, null, or empty content
  let content = section.content
  if (!content || content === 'undefined' || content.trim() === '') {
    content = `[${section.title} section content not available]`
  }
  content = content.trim()

  if (section.type === 'personal') {
    // Format personal information as a clean block with minimal spacing
    const lines = content.split('\n').filter(line => line.trim())
    lines.forEach((line, index) => {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: line.trim(),
            size: 22,
            font: 'Calibri',
          })
        ],
        spacing: { before: 0, after: 40 } // Reduced spacing
      }))
    })
  } else if (section.type === 'experience') {
    // Format work experience with better structure and reduced gaps
    const lines = content.split('\n').filter(line => line.trim())
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return

      // Check if line looks like a job title/company (contains dates)
      const isJobTitle = /\d{4}|present|current|•|–|-/i.test(trimmedLine)
      const isBulletPoint = trimmedLine.startsWith('•') || trimmedLine.startsWith('-')
      
      if (isBulletPoint) {
        // Format bullet points with proper indentation
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22,
              font: 'Calibri',
            })
          ],
          spacing: { before: 0, after: 60 },
          indent: { left: 360 } // Indent bullet points
        }))
      } else {
        // Regular content or job titles
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22,
              font: 'Calibri',
              bold: isJobTitle && !isBulletPoint
            })
          ],
          spacing: { 
            before: isJobTitle && index > 0 ? 80 : 0, 
            after: isJobTitle ? 60 : 40 
          }
        }))
      }
    })
  } else if (section.type === 'skills') {
    // Format skills with better structure and minimal gaps
    let skillsText = content
    
    if (!skillsText || skillsText === 'undefined' || skillsText.trim() === '') {
      skillsText = 'Skills information not available'
    }
    
    // Handle different skill formats
    const lines = skillsText.split('\n').filter(line => line.trim())
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine.includes(':')) {
        // Category: skills format
        const [category, skills] = trimmedLine.split(':')
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: category.trim() + ': ',
              size: 22,
              font: 'Calibri',
              bold: true
            }),
            new TextRun({
              text: skills.trim(),
              size: 22,
              font: 'Calibri',
            })
          ],
          spacing: { before: 0, after: 60 }
        }))
      } else {
        // Regular skills line
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: trimmedLine,
              size: 22,
              font: 'Calibri',
            })
          ],
          spacing: { before: 0, after: 60 }
        }))
      }
    })
  } else {
    // Default formatting for other sections with minimal gaps
    const lines = content.split('\n').filter(line => line.trim())
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      const isBulletPoint = trimmedLine.startsWith('•') || trimmedLine.startsWith('-')
      
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: trimmedLine,
            size: 22,
            font: 'Calibri',
          })
        ],
        spacing: { 
          before: 0, 
          after: 60 
        },
        indent: isBulletPoint ? { left: 360 } : undefined
      }))
    })
  }

  return paragraphs
}
