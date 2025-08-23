# Document Parser Service

A Python FastAPI microservice for parsing resume documents (PDF, DOCX, TXT) and extracting structured sections.

## Features

- **Multi-format Support**: PDF, DOCX, and TXT file parsing
- **Intelligent Section Detection**: Automatically identifies resume sections like:
  - Personal Information
  - Professional Summary
  - Work Experience
  - Education
  - Skills
  - Projects
  - Other sections
- **Robust Text Extraction**: Uses PyMuPDF for PDF parsing and python-docx for DOCX files
- **RESTful API**: FastAPI-based service with automatic documentation
- **Health Monitoring**: Built-in health check endpoint

## Installation

### Option 1: Virtual Environment (Recommended)

```bash
# Run the startup script
./start.sh
```

### Option 2: Manual Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 3: Docker

```bash
# Build the image
docker build -t document-parser .

# Run the container
docker run -p 8000:8000 document-parser
```

## API Endpoints

### Health Check
```
GET /health
```

### Parse Resume
```
POST /parse-resume
Content-Type: multipart/form-data

Parameters:
- file: Resume file (PDF, DOCX, or TXT)

Response:
{
  "success": true,
  "filename": "resume.pdf",
  "sections": [
    {
      "type": "personal",
      "title": "Contact Information",
      "content": "...",
      "confidence": 0.95
    }
  ],
  "metadata": {
    "file_type": "application/pdf",
    "file_size": 12345,
    "total_sections": 6,
    "word_count": 450,
    "processing_time": "2023-...",
    "section_types": ["personal", "experience", "education"]
  },
  "raw_text": "..."
}
```

## Integration with Next.js

The service is designed to work with the Next.js resume builder application. Set the environment variable:

```bash
PARSER_SERVICE_URL=http://localhost:8000
```

## Future Enhancements

- ML-based section classification
- Named Entity Recognition (NER)
- Resume quality scoring
- Advanced text preprocessing
- Support for additional file formats

## Development

The service uses:
- **FastAPI**: Modern Python web framework
- **PyMuPDF**: PDF text extraction
- **python-docx**: DOCX document parsing
- **chardet**: Text encoding detection
- **Pydantic**: Data validation and serialization
