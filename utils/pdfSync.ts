import jsPDF from 'jspdf'

interface ResumeSection {
  title: string
  content: string
}

export const generateUpdatedPDF = (sections: ResumeSection[], applicantName: string = 'Applicant'): string => {
  const pdf = new jsPDF()
  
  // Set up the document
  let yPosition = 20
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - (margin * 2)
  
  // Add applicant name as header
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text(applicantName, margin, yPosition)
  yPosition += 15
  
  // Add a line separator
  pdf.setLineWidth(0.5)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10
  
  // Process each section
  sections.forEach((section) => {
    // Check if we need a new page
    if (yPosition > 250) {
      pdf.addPage()
      yPosition = 20
    }
    
    // Section title
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(section.title, margin, yPosition)
    yPosition += 8
    
    // Section content
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    
    // Split content into lines that fit the page width
    const lines = pdf.splitTextToSize(section.content, maxWidth)
    
    lines.forEach((line: string) => {
      if (yPosition > 280) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.text(line, margin, yPosition)
      yPosition += 5
    })
    
    yPosition += 5 // Extra space between sections
  })
  
  // Return the PDF as a data URL
  return pdf.output('dataurlstring')
}

export const updatePDFViewer = (sections: ResumeSection[], applicantName: string = 'Applicant'): string => {
  try {
    return generateUpdatedPDF(sections, applicantName)
  } catch (error) {
    console.error('Error generating updated PDF:', error)
    throw error
  }
}
