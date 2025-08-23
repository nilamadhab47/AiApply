import { NextRequest, NextResponse } from 'next/server'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const templateName = formData.get('templateName') as string || 'professional'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`Applying template "${templateName}" to file: ${file.name}`)

    // Create FormData for Python service
    const pythonFormData = new FormData()
    pythonFormData.append('file', file)
    pythonFormData.append('template_name', templateName)

    // Call Python service
    const response = await fetch(`${PYTHON_SERVICE_URL}/apply-template`, {
      method: 'POST',
      body: pythonFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Python service error:', errorText)
      return NextResponse.json(
        { error: 'Template application failed', details: errorText },
        { status: response.status }
      )
    }

    // Get the generated PDF file
    const pdfBuffer = await response.arrayBuffer()
    
    // Extract filename from response headers
    const contentDisposition = response.headers.get('content-disposition')
    let filename = 'resume_with_template.pdf'
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }

    console.log(`Template applied successfully, returning file: ${filename}`)

    // Return the PDF file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Error in template application:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get available templates from Python service
    const response = await fetch(`${PYTHON_SERVICE_URL}/templates`)
    
    if (!response.ok) {
      throw new Error(`Python service error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error getting templates:', error)
    return NextResponse.json(
      { error: 'Failed to get templates', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
