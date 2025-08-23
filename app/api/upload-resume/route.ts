import { NextRequest, NextResponse } from 'next/server'

interface ResumeSection {
  title: string
  content: string
  type: 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'other'
  confidence?: number
}

interface ParseResponse {
  success: boolean
  filename: string
  sections: ResumeSection[]
  metadata: {
    file_type: string
    file_size: number
    total_sections: number
    word_count: number
    processing_time: string
    section_types: string[]
  }
  raw_text: string
}

const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || 'http://localhost:8000'

async function callParserService(file: File): Promise<ParseResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${PARSER_SERVICE_URL}/parse-resume`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Parser service error')
    }

    return await response.json()
  } catch (error) {
    console.error('Parser service error:', error)
    throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // Check if parser service is available
    try {
      const healthCheck = await fetch(`${PARSER_SERVICE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (!healthCheck.ok) {
        throw new Error('Parser service unavailable')
      }
    } catch (error) {
      console.error('Parser service health check failed:', error)
      return NextResponse.json({ 
        error: 'Document parsing service is currently unavailable. Please try again later.' 
      }, { status: 503 })
    }
    
    // Call the Python parser service
    const result = await callParserService(file)
    
    // Read file data for PDF preview (only for PDFs)
    let fileData = null
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer()
      fileData = Array.from(new Uint8Array(arrayBuffer))
    }
    
    // Transform the response to match the expected format
    return NextResponse.json({
      success: result.success,
      filename: result.filename,
      sections: result.sections.map(section => ({
        title: section.title,
        content: section.content,
        type: section.type
      })),
      rawText: result.raw_text,
      metadata: result.metadata,
      fileData: fileData,
      fileType: file.type
    })
    
  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    )
  }
}
