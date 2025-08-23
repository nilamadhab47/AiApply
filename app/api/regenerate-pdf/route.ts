import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface ResumeSection {
  title: string
  content: string
}

interface RegeneratePDFRequest {
  sections: ResumeSection[]
  filename: string
  applicantName?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sections, filename, applicantName }: RegeneratePDFRequest = await request.json()

    if (!sections || sections.length === 0) {
      return NextResponse.json({ error: 'Resume sections are required' }, { status: 400 })
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    // Prepare resume content for PDF generation
    const resumeContent = sections
      .map(section => `${section.title}:\n${section.content}`)
      .join('\n\n')

    const userName = applicantName || session.user?.name || 'Applicant'

    const pdfGenerationPrompt = `
You are an expert resume formatter. Convert the following resume content into a clean, professional HTML format that can be converted to PDF.

RESUME CONTENT:
${resumeContent}

APPLICANT NAME: ${userName}

Please generate clean, professional HTML with the following requirements:
1. Use modern, clean styling with proper typography
2. Include the applicant name as a header
3. Format each section with clear headings
4. Use bullet points for experience and skills where appropriate
5. Ensure the layout is professional and ATS-friendly
6. Use appropriate margins and spacing for PDF conversion
7. Include basic CSS styling within <style> tags

Return only the complete HTML document ready for PDF conversion.
`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'Resume Builder - PDF Generation'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: pdfGenerationPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500 // Reduced from 3000 to avoid credit issues
      })
    })

    if (!response.ok) {
      console.error('OpenRouter API error:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to generate PDF content' }, { status: 500 })
    }

    const data = await response.json()
    const htmlContent = data.choices[0]?.message?.content

    if (!htmlContent) {
      return NextResponse.json({ error: 'No HTML content generated' }, { status: 500 })
    }

    // For now, we'll return the HTML content and let the frontend handle PDF conversion
    // In a production environment, you might want to use a service like Puppeteer or similar
    return NextResponse.json({
      success: true,
      htmlContent,
      message: 'PDF content generated successfully'
    })

  } catch (error) {
    console.error('PDF regeneration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
