"""
Ollama-powered Resume Analysis Service
Complete refactor using Mistral 7B for section extraction and ATS scoring
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Dict, Any, List
from pydantic import BaseModel
import fitz  # PyMuPDF
from docx import Document
import io
import chardet
import logging
import asyncio
from ollama_resume_analyzer import OllamaResumeAnalyzer, CompleteResumeAnalysis
from template_applicator import TemplateApplicator
from simple_pdf_generator import SimplePDFGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Ollama Resume Analyzer Service", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:3001", "http://127.0.0.1:3001"  # Frontend running on 3001
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Ollama analyzer
try:
    analyzer = OllamaResumeAnalyzer()
    logger.info("Ollama Resume Analyzer initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Ollama analyzer: {e}")
    analyzer = None

class DocumentParser:
    """Simplified document parser that only extracts raw text from files"""
    
    def parse_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF using PyMuPDF"""
        try:
            doc = fitz.open(stream=file_content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text.strip()
        except Exception as e:
            logger.error(f"Error parsing PDF: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    def parse_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX using python-docx"""
        try:
            doc = Document(io.BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error parsing DOCX: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse DOCX: {str(e)}")

    def parse_txt(self, file_content: bytes) -> str:
        """Extract text from TXT with encoding detection"""
        try:
            # Detect encoding
            detected = chardet.detect(file_content)
            encoding = detected['encoding'] or 'utf-8'
            
            # Decode text
            text = file_content.decode(encoding)
            return text.strip()
        except Exception as e:
            logger.error(f"Error parsing TXT: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse TXT: {str(e)}")

    async def parse_file(self, file: UploadFile) -> str:
        """Parse file and return raw text"""
        try:
            file_content = await file.read()
            
            if file.content_type == "application/pdf":
                return self.parse_pdf(file_content)
            elif file.content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                return self.parse_docx(file_content)
            elif file.content_type == "text/plain":
                return self.parse_txt(file_content)
            else:
                # Try to detect by filename extension
                filename = file.filename.lower()
                if filename.endswith('.pdf'):
                    return self.parse_pdf(file_content)
                elif filename.endswith('.docx'):
                    return self.parse_docx(file_content)
                elif filename.endswith('.txt'):
                    return self.parse_txt(file_content)
                else:
                    raise HTTPException(status_code=400, detail="Unsupported file type")
                    
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error parsing file: {e}")
            raise HTTPException(status_code=500, detail=f"File parsing failed: {str(e)}")

# Initialize parser and template systems
parser = DocumentParser()
template_applicator = TemplateApplicator()
pdf_generator = SimplePDFGenerator()

@app.get("/")
async def root():
    return {"message": "Ollama Resume Analyzer Service", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    ollama_status = "available" if analyzer else "unavailable"
    return {
        "status": "healthy",
        "ollama": ollama_status,
        "model": "mistral:7b" if analyzer else None
    }

@app.post("/analyze-resume", response_model=CompleteResumeAnalysis)
async def analyze_resume(file: UploadFile = File(...)):
    """
    Complete resume analysis endpoint
    Extracts raw text, then uses Ollama for section extraction and ATS scoring
    """
    if not analyzer:
        raise HTTPException(status_code=503, detail="Ollama analyzer not available")
    
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        "text/plain"
    ]
    
    if file.content_type not in allowed_types:
        filename = file.filename.lower() if file.filename else ""
        if not (filename.endswith('.pdf') or filename.endswith('.docx') or filename.endswith('.txt')):
            raise HTTPException(
                status_code=400, 
                detail="Only PDF, DOCX, and TXT files are supported"
            )
    
    try:
        logger.info(f"Starting analysis for file: {file.filename}")
        
        # Step 1: Extract raw text from file
        raw_text = await parser.parse_file(file)
        logger.info(f"Extracted {len(raw_text)} characters from {file.filename}")
        
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="No text content found in file")
        
        # Step 2: Complete analysis using Ollama
        analysis = await analyzer.analyze_complete_resume(raw_text, file.filename)
        
        logger.info(f"Analysis completed for {file.filename} in {analysis.processing_time:.2f}s")
        logger.info(f"Extracted {len(analysis.sections)} sections, ATS score: {analysis.ats_analysis.overall_score}")
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in resume analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Legacy endpoints for backward compatibility (deprecated)
@app.post("/parse-resume")
async def parse_resume_legacy(file: UploadFile = File(...)):
    """
    Legacy endpoint for backward compatibility
    Redirects to new analyze-resume endpoint
    """
    logger.warning("Legacy /parse-resume endpoint used, redirecting to /analyze-resume")
    analysis = await analyze_resume(file)
    
    # Convert to legacy format
    return {
        "success": analysis.success,
        "filename": analysis.filename,
        "sections": [
            {
                "type": section.type,
                "title": section.title,
                "content": section.content,
                "confidence": section.confidence
            }
            for section in analysis.sections
        ],
        "metadata": {
            "processing_time": analysis.processing_time,
            "ats_score": analysis.ats_analysis.overall_score
        },
        "raw_text": analysis.raw_text
    }

@app.post("/ats-score")
async def ats_score_legacy(request: dict):
    """
    Legacy ATS scoring endpoint (deprecated)
    Now handled automatically in /analyze-resume
    """
    logger.warning("Legacy /ats-score endpoint used")
    logger.info(f"Request data: {request}")
    
    if not analyzer:
        raise HTTPException(status_code=503, detail="Ollama analyzer not available")
    
    try:
        # Handle different request formats
        sections_data = request.get('sections', [])
        if not sections_data and isinstance(request, list):
            sections_data = request
        
        if not sections_data:
            raise HTTPException(status_code=400, detail="No sections provided")
        
        # Convert to ResumeSection objects
        resume_sections = []
        for section in sections_data:
            if isinstance(section, dict):
                resume_sections.append(ResumeSection(
                    type=section.get('type', 'other'),
                    title=section.get('title', 'Unknown'),
                    content=section.get('content', ''),
                    confidence=section.get('confidence', 0.8)
                ))
        
        if not resume_sections:
            raise HTTPException(status_code=400, detail="No valid sections found")
        
        # Score with Ollama
        ats_analysis = analyzer.score_ats_with_ollama(resume_sections)
        
        return {
            "overall_score": ats_analysis.overall_score,
            "category_scores": ats_analysis.category_scores,
            "suggestions": ats_analysis.suggestions,
            "strengths": ats_analysis.strengths
        }
        
    except Exception as e:
        logger.error(f"Error in legacy ATS scoring: {e}")
        raise HTTPException(status_code=500, detail=f"ATS scoring failed: {str(e)}")

# Template Application Endpoints

class ApplyTemplateRequest(BaseModel):
    template_name: str
    resume_analysis: Dict[str, Any]  # CompleteResumeAnalysis as dict

@app.get("/templates")
async def get_available_templates():
    """Get list of available PDF resume templates"""
    try:
        templates = pdf_generator.get_available_templates()
        
        # If no templates exist, create professional ones
        if not templates:
            pdf_generator.create_professional_templates()
            templates = pdf_generator.get_available_templates()
        
        return {
            "templates": templates,
            "count": len(templates),
            "format": "PDF"
        }
    except Exception as e:
        logger.error(f"Error getting templates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get templates: {str(e)}")

@app.post("/apply-template")
async def apply_template_to_resume(file: UploadFile = File(...), template_name: str = "professional"):
    """
    Complete workflow: Analyze resume and apply to PDF template
    """
    if not analyzer:
        raise HTTPException(status_code=503, detail="Ollama analyzer not available")
    
    try:
        logger.info(f"Applying PDF template '{template_name}' to {file.filename}")
        
        # Step 1: Analyze the resume
        analysis = await analyze_resume(file)
        
        # Step 2: Extract structured data
        resume_data = template_applicator.extract_resume_data(analysis)
        logger.info(f"Extracted data for: {resume_data.get('full_name', 'Unknown')}")
        
        # Step 3: Generate PDF with template
        pdf_bytes = pdf_generator.generate_pdf_resume(template_name, resume_data)
        
        # Step 4: Return the PDF resume
        filename = f"{resume_data.get('full_name', 'resume').replace(' ', '_')}_{template_name}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in PDF template application: {e}")
        raise HTTPException(status_code=500, detail=f"PDF template application failed: {str(e)}")

@app.post("/apply-template-from-analysis")
async def apply_template_from_existing_analysis(request: ApplyTemplateRequest):
    """
    Apply template to existing resume analysis
    """
    try:
        logger.info(f"Applying template '{request.template_name}' to existing analysis")
        
        # Convert dict back to CompleteResumeAnalysis object
        from ollama_resume_analyzer import ResumeSection, ATSScore
        
        # Reconstruct sections
        sections = []
        for section_data in request.resume_analysis.get('sections', []):
            sections.append(ResumeSection(
                type=section_data.get('type', 'other'),
                title=section_data.get('title', 'Unknown'),
                content=section_data.get('content', ''),
                confidence=section_data.get('confidence', 0.8)
            ))
        
        # Reconstruct ATS analysis
        ats_data = request.resume_analysis.get('ats_analysis', {})
        ats_analysis = ATSScore(
            overall_score=ats_data.get('overall_score', 75),
            category_scores=ats_data.get('category_scores', {}),
            suggestions=ats_data.get('suggestions', []),
            strengths=ats_data.get('strengths', [])
        )
        
        # Reconstruct complete analysis
        analysis = CompleteResumeAnalysis(
            success=request.resume_analysis.get('success', True),
            filename=request.resume_analysis.get('filename', 'resume'),
            sections=sections,
            ats_analysis=ats_analysis,
            raw_text=request.resume_analysis.get('raw_text', ''),
            processing_time=request.resume_analysis.get('processing_time', 0.0)
        )
        
        # Extract structured data
        resume_data = template_applicator.extract_resume_data(analysis)
        logger.info(f"Extracted data for: {resume_data.get('full_name', 'Unknown')}")
        
        # Generate PDF with template
        pdf_bytes = pdf_generator.generate_pdf_resume(request.template_name, resume_data)
        
        # Return the PDF resume
        filename = f"{resume_data.get('full_name', 'resume').replace(' ', '_')}_{request.template_name}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error applying template from analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Template application failed: {str(e)}")

@app.post("/create-sample-templates")
async def create_sample_templates():
    """Create professional PDF templates for testing"""
    try:
        pdf_generator.create_professional_templates()
        templates = pdf_generator.get_available_templates()
        
        return {
            "message": "Professional PDF templates created successfully",
            "templates": templates,
            "count": len(templates),
            "format": "PDF"
        }
    except Exception as e:
        logger.error(f"Error creating PDF templates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create PDF templates: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
