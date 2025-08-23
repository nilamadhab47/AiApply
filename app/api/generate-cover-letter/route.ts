import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx'

interface CoverLetterRequest {
  coverLetterText: string
  applicantName?: string
  jobTitle?: string
  companyName?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { coverLetterText, applicantName, jobTitle, companyName }: CoverLetterRequest = await request.json()

    if (!coverLetterText) {
      return NextResponse.json({ error: 'Cover letter text is required' }, { status: 400 })
    }

    // Extract user name from session or use provided name
    const userName = applicantName || session.user?.name || 'Applicant'
    
    // Clean the cover letter text - remove any analysis markers or unwanted content
    let cleanCoverLetter = coverLetterText
    
    // Remove any analysis markers like **Optimizations**, **Key Insights**, etc.
    cleanCoverLetter = cleanCoverLetter.replace(/\*\*[^*]+\*\*/g, '')
    
    // Replace [Your Name] placeholder with actual user name
    cleanCoverLetter = cleanCoverLetter.replace(/\[Your Name\]/g, userName)
    
    // Also replace any other common placeholders
    cleanCoverLetter = cleanCoverLetter.replace(/\[Applicant\]/g, userName)
    cleanCoverLetter = cleanCoverLetter.replace(/\[Name\]/g, userName)
    
    // Remove JSON-like content if present
    cleanCoverLetter = cleanCoverLetter.replace(/\{[^}]*\}/g, '')
    
    // Remove numbered lists that might be analysis content
    cleanCoverLetter = cleanCoverLetter.replace(/^\d+\..*/gm, '')
    
    // Clean up extra whitespace and newlines
    cleanCoverLetter = cleanCoverLetter.replace(/\n{3,}/g, '\n\n').trim()
    
    // Split cover letter into paragraphs
    const paragraphs = cleanCoverLetter.split('\n\n').filter(p => p.trim().length > 0 && !p.includes('section') && !p.includes('Original Content'))

    // Create document with better formatting
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              right: 720,  // 0.5 inch
              bottom: 720, // 0.5 inch
              left: 720,   // 0.5 inch
            },
          },
        },
        children: [
          // Header with applicant name
          new Paragraph({
            children: [
              new TextRun({
                text: userName,
                bold: true,
                size: 32,
                font: 'Calibri',
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: {
              after: 200,
            },
          }),

          // Date
          new Paragraph({
            children: [
              new TextRun({
                text: new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                size: 24,
                font: 'Calibri',
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: {
              after: 300,
            },
          }),

          // Job title and company (if provided)
          ...(jobTitle || companyName ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Re: ${jobTitle || 'Position'} ${companyName ? `at ${companyName}` : ''}`,
                  bold: true,
                  size: 22, // Reduced from 24
                }),
              ],
              alignment: AlignmentType.LEFT,
              spacing: {
                after: 240, // Reduced from 400
              },
            })
          ] : []),

          // Cover letter paragraphs
          ...paragraphs.map((paragraph, index) => 
            new Paragraph({
              children: [
                new TextRun({
                  text: paragraph.trim(),
                  size: 24,
                  font: 'Calibri',
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
              spacing: {
                after: 200,
                line: 360, // 1.5 line spacing
              },
              indent: {
                firstLine: index === 0 ? 0 : 360, // Indent first line of paragraphs except the first
              },
            })
          ),

          // Closing
          new Paragraph({
            children: [
              new TextRun({
                text: 'Sincerely,',
                size: 24,
                font: 'Calibri',
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: {
              before: 400,
              after: 600,
            },
          }),

          // Signature line
          new Paragraph({
            children: [
              new TextRun({
                text: userName,
                size: 24,
                font: 'Calibri',
                bold: true,
              }),
            ],
            alignment: AlignmentType.LEFT,
          }),
        ],
      }],
    })

    // Generate the document buffer
    const buffer = await Packer.toBuffer(doc)

    // Create filename
    const filename = `Cover_Letter_${jobTitle ? jobTitle.replace(/[^a-zA-Z0-9]/g, '_') : 'Application'}_${new Date().toISOString().split('T')[0]}.docx`

    // Return the file as a download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('Cover letter generation error:', error)
    return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 })
  }
}
