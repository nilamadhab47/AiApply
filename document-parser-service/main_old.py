from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import fitz  # PyMuPDF
from docx import Document
import io
import chardet
from datetime import datetime
import json
import logging
import asyncio
from ollama_resume_analyzer import OllamaResumeAnalyzer, CompleteResumeAnalysis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Ollama Resume Analyzer Service", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
    def __init__(self):
        pass
        self.openrouter_base_url = "https://openrouter.ai/api/v1"
        
        # Section keywords for classification
        self.section_keywords = {
            'personal': [
                'contact', 'personal information', 'personal details', 'profile',
                'address', 'phone', 'email', 'linkedin', 'github'
            ],
            'summary': [
                'summary', 'objective', 'profile summary', 'career objective', 
                'about', 'professional summary', 'overview', 'career summary'
            ],
            'experience': [
                'experience', 'work experience', 'employment', 'career history',
                'professional experience', 'work history', 'employment history',
                'professional background'
            ],
            'education': [
                'education', 'academic', 'qualifications', 'degrees', 
                'certifications', 'academic background', 'educational background',
                'university', 'college', 'school'
            ],
            'skills': [
                'skills', 'technical skills', 'competencies', 'expertise',
                'technologies', 'programming languages', 'tools', 'software'
            ],
            'projects': [
                'projects', 'portfolio', 'work samples', 'achievements',
                'personal projects', 'side projects', 'open source'
            ]
        }
        
        # Common section headers (regex patterns)
        self.section_patterns = [
            r'^(CONTACT|PERSONAL)\s*(INFORMATION|DETAILS)?',
            r'^(PROFESSIONAL\s*)?(SUMMARY|OBJECTIVE|PROFILE)',
            r'^(WORK\s*)?(EXPERIENCE|EMPLOYMENT|HISTORY)',
            r'^(EDUCATION|ACADEMIC|QUALIFICATIONS)',
            r'^(TECHNICAL\s*)?(SKILLS|COMPETENCIES|EXPERTISE)',
            r'^(PROJECTS|PORTFOLIO|ACHIEVEMENTS)',
            r'^(CERTIFICATIONS?|LICENSES?)',
            r'^(AWARDS?|HONORS?|RECOGNITION)',
            r'^(LANGUAGES?|LINGUISTIC)',
            r'^(REFERENCES?|RECOMMENDATIONS?)'
        ]

    def extract_text_from_pdf(self, file_content: bytes) -> str:
        """Extract text from PDF using PyMuPDF"""
        try:
            doc = fitz.open(stream=file_content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text.strip()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    def extract_text_from_docx(self, file_content: bytes) -> str:
        """Extract text from DOCX using python-docx"""
        try:
            doc = Document(io.BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse DOCX: {str(e)}")

    def extract_text_from_txt(self, file_content: bytes) -> str:
        """Extract text from TXT with encoding detection"""
        try:
            # Detect encoding
            detected = chardet.detect(file_content)
            encoding = detected['encoding'] or 'utf-8'
            
            # Decode with detected encoding
            text = file_content.decode(encoding)
            return text.strip()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse TXT: {str(e)}")

    def classify_section_type(self, text: str) -> str:
        """Classify section type based on content and keywords with improved accuracy"""
        text_lower = text.lower()
        
        # Score each section type based on keyword matches
        section_scores = {section_type: 0 for section_type in self.section_keywords.keys()}
        
        # Check for specific keywords and assign scores
        for section_type, keywords in self.section_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    # Give higher score for exact matches in title/header
                    if keyword in text_lower[:50]:  # First 50 chars (likely title)
                        section_scores[section_type] += 3
                    else:
                        section_scores[section_type] += 1
        
        # Additional pattern-based scoring
        patterns = {
            'personal': [
                r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',  # Phone numbers
                r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
                r'\b(linkedin|github)\.com\b',  # Social profiles
                r'\b\d{5}(-\d{4})?\b',  # ZIP codes
            ],
            'experience': [
                r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}\b',  # Dates
                r'\b\d{4}\s*[-–]\s*\d{4}\b',  # Year ranges
                r'\b(present|current)\b',  # Current position indicators
                r'\b(developed|created|built|managed|led|designed|implemented)\b',  # Action verbs
            ],
            'education': [
                r'\b(bachelor|master|phd|doctorate|diploma|certificate)\b',  # Degrees
                r'\b(university|college|institute|school)\b',  # Institutions
                r'\b(gpa|cgpa)\s*:?\s*\d+\.\d+\b',  # GPA
                r'\b\d{4}\s*[-–]\s*\d{4}\b',  # Year ranges
            ],
            'skills': [
                r'\b(python|javascript|java|react|node|html|css|sql|aws|docker)\b',  # Tech skills
                r'\b(programming|development|software|technical)\b',  # Tech terms
                r'\b(proficient|experienced|expert|familiar)\b',  # Skill levels
            ],
            'projects': [
                r'\b(project|built|developed|created|designed)\b',  # Project indicators
                r'\b(github|repository|demo|live)\b',  # Project links
                r'\b(technologies|stack|framework)\b',  # Tech stack
            ]
        }
        
        # Apply pattern-based scoring
        for section_type, pattern_list in patterns.items():
            for pattern in pattern_list:
                matches = len(re.findall(pattern, text_lower))
                section_scores[section_type] += matches * 2
        
        # Find the section type with the highest score
        max_score = max(section_scores.values())
        if max_score > 0:
            for section_type, score in section_scores.items():
                if score == max_score:
                    return section_type
        
        # Fallback heuristics if no clear winner
        if '@' in text or any(word in text_lower for word in ['phone', 'email', 'address']):
            return 'personal'
        
        if any(word in text_lower for word in ['university', 'degree', 'bachelor', 'master', 'phd']):
            return 'education'
        
        if any(word in text_lower for word in ['company', 'manager', 'developer', 'analyst', 'engineer']):
            return 'experience'
        
        if any(word in text_lower for word in ['python', 'javascript', 'java', 'react', 'node']):
            return 'skills'
        
        return 'other'

    def is_section_header(self, line: str) -> bool:
        """Check if a line is likely a section header"""
        line = line.strip()
        
        # Empty lines are not headers
        if not line:
            return False
        
        # Check against regex patterns first (most reliable)
        for pattern in self.section_patterns:
            if re.match(pattern, line.upper()):
                return True
        
        # Check if line contains section keywords
        line_lower = line.lower()
        for section_type, keywords in self.section_keywords.items():
            for keyword in keywords:
                if keyword in line_lower and len(line) < 80:
                    return True
        
        # Enhanced heuristics for section headers
        conditions = [
            len(line) < 60 and len(line) > 2,  # Reasonable length for headers
            line.isupper(),  # All uppercase
            line.endswith(':'),  # Ends with colon
            not any(char.isdigit() for char in line[:15]),  # No numbers at start
            line.count(' ') <= 4,  # Few spaces (not a long sentence)
            not line.startswith('•') and not line.startswith('-'),  # Not bullet points
            not any(word in line_lower for word in ['developed', 'created', 'built', 'managed', 'led']),  # Not action verbs
            line.count('.') <= 1,  # Not multiple sentences
        ]
        
        # If 3 or more conditions are met, likely a header
        return sum(conditions) >= 3

    def parse_resume_text(self, text: str) -> List[ResumeSection]:
        """Parse resume text into structured sections - simplified approach"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if not lines:
            return []
        
        return self._simple_section_parsing(lines)

    def _simple_section_parsing(self, lines: List[str]) -> List[ResumeSection]:
        """Improved resume parsing with proper structure and ordering"""
        if not lines:
            return []
        
        # Create a well-structured resume with proper sections
        sections = self._create_structured_resume(lines)
        
        return sections
    
    def _create_structured_resume(self, lines: List[str]) -> List[ResumeSection]:
        """Create a well-structured resume with proper section ordering and clean separation"""
        sections = []
        
        # Track what content has been used to avoid duplication
        used_lines = set()
        
        # 1. Personal Information (contact details, name, etc.)
        personal_content, personal_lines = self._extract_personal_info_with_tracking(lines)
        if personal_content:
            sections.append(ResumeSection(
                type='personal',
                title='Personal Information',
                content=personal_content,
                confidence=0.9
            ))
            used_lines.update(personal_lines)
        
        # 2. Professional Summary/Objective
        summary_content, summary_lines = self._extract_summary_with_tracking(lines, used_lines)
        if summary_content:
            sections.append(ResumeSection(
                type='summary',
                title='Professional Summary',
                content=summary_content,
                confidence=0.9
            ))
            used_lines.update(summary_lines)
        
        # 3. Work Experience (most important section) - extract ALL work-related content
        experience_content, experience_lines = self._extract_all_experience(lines, used_lines)
        if experience_content:
            sections.append(ResumeSection(
                type='experience',
                title='Work Experience',
                content=experience_content,
                confidence=0.9
            ))
            used_lines.update(experience_lines)
        
        # 4. Education
        education_content, education_lines = self._extract_education_with_tracking(lines, used_lines)
        if education_content:
            sections.append(ResumeSection(
                type='education',
                title='Education',
                content=education_content,
                confidence=0.9
            ))
            used_lines.update(education_lines)
        
        # 5. Technical Skills
        skills_content, skills_lines = self._extract_skills_with_tracking(lines, used_lines)
        if skills_content:
            sections.append(ResumeSection(
                type='skills',
                title='Technical Skills',
                content=skills_content,
                confidence=0.9
            ))
            used_lines.update(skills_lines)
        
        # 6. Projects (if any)
        projects_content, projects_lines = self._extract_projects_with_tracking(lines, used_lines)
        if projects_content:
            sections.append(ResumeSection(
                type='projects',
                title='Projects',
                content=projects_content,
                confidence=0.9
            ))
            used_lines.update(projects_lines)
        
        # Extract education from remaining content if not found earlier
        if not any(section.type == 'education' for section in sections):
            remaining_education_content, remaining_education_lines = self._extract_education_from_remaining(lines, used_lines)
            if remaining_education_content:
                sections.append(ResumeSection(
                    type='education',
                    title='Education',
                    content=remaining_education_content,
                    confidence=0.8
                ))
                used_lines.update(remaining_education_lines)
        
        # Extract skills from remaining content if not found earlier
        if not any(section.type == 'skills' for section in sections):
            remaining_skills_content, remaining_skills_lines = self._extract_skills_from_remaining(lines, used_lines)
            if remaining_skills_content:
                sections.append(ResumeSection(
                    type='skills',
                    title='Technical Skills',
                    content=remaining_skills_content,
                    confidence=0.8
                ))
                used_lines.update(remaining_skills_lines)
        
        # Extract additional information (remaining content)
        additional_content = self._extract_clean_additional_info(lines, used_lines)
        if additional_content:
            sections.append(ResumeSection(
                type='additional',
                title='Additional Information',
                content=additional_content,
                confidence=0.8
            ))
        
        return sections if sections else self._create_basic_sections(lines)
    
    def _extract_personal_info_with_tracking(self, lines: List[str]) -> tuple:
        """Extract personal information and return content + line indices"""
        personal_lines = []
        used_indices = []
        
        # Look for contact info patterns in first 10 lines
        for i, line in enumerate(lines[:10]):
            line_lower = line.lower()
            # Email, phone, location, LinkedIn, GitHub patterns
            if (any(pattern in line for pattern in ['@', '.com', '.org', '.net']) or
                any(pattern in line_lower for pattern in ['phone', 'mobile', 'tel', 'linkedin', 'github']) or
                any(char.isdigit() for char in line) and len(line) > 8 or
                any(location in line_lower for location in ['india', 'usa', 'uk', 'canada', 'city', 'state'])):
                personal_lines.append(line)
                used_indices.append(i)
            # Name (usually first line if it's short and has title case)
            elif i == 0 and len(line.split()) <= 4 and line.istitle():
                personal_lines.append(line)
                used_indices.append(i)
        
        return ('\n'.join(personal_lines) if personal_lines else '', used_indices)
    
    def _extract_summary_with_tracking(self, lines: List[str], used_lines: set) -> tuple:
        """Extract summary and return content + line indices"""
        summary_lines = []
        used_indices = []
        in_summary = False
        
        for i, line in enumerate(lines):
            if i in used_lines:
                continue
                
            line_lower = line.lower().strip()
            
            # Start of summary section
            if any(keyword in line_lower for keyword in ['objective', 'summary', 'profile', 'about']):
                in_summary = True
                if line_lower not in ['objective', 'summary', 'profile', 'about']:
                    summary_lines.append(line)
                    used_indices.append(i)
                continue
            
            # End of summary (next section starts)
            if in_summary and any(keyword in line_lower for keyword in 
                                ['experience', 'education', 'skills', 'projects']):
                break
            
            # Collect summary content
            if in_summary and line.strip():
                summary_lines.append(line)
                used_indices.append(i)
        
        return ('\n'.join(summary_lines) if summary_lines else '', used_indices)
    
    def _extract_all_experience(self, lines: List[str], used_lines: set) -> tuple:
        """Extract ALL work experience content aggressively"""
        experience_lines = []
        used_indices = []
        
        for i, line in enumerate(lines):
            if i in used_lines:
                continue
                
            line_lower = line.lower().strip()
            
            # Aggressive work experience detection
            is_work_content = (
                # Explicit experience keywords
                any(keyword in line_lower for keyword in ['experience', 'work', 'employment', 'career']) or
                # Job titles
                any(title in line_lower for title in ['developer', 'engineer', 'manager', 'analyst', 'consultant', 'lead', 'senior']) or
                # Company indicators
                any(company in line_lower for company in ['corp', 'inc', 'ltd', 'company', 'technologies', 'systems']) or
                # Work activities
                any(activity in line_lower for activity in ['led', 'managed', 'developed', 'built', 'implemented', 'delivered', 'improved']) or
                # Date patterns with work indicators
                (any(year in line for year in ['2020', '2021', '2022', '2023', '2024']) and 
                 any(indicator in line_lower for indicator in ['present', 'current', '-', 'to'])) or
                # Technical work indicators
                any(tech in line_lower for tech in ['agile', 'team', 'client', 'project', 'system', 'application'])
            )
            
            if is_work_content:
                experience_lines.append(line)
                used_indices.append(i)
        
        return ('\n'.join(experience_lines) if experience_lines else '', used_indices)
    
    def _extract_education_with_tracking(self, lines: List[str], used_lines: set) -> tuple:
        """Extract education and return content + line indices"""
        education_lines = []
        used_indices = []
        in_education = False
        
        for i, line in enumerate(lines):
            if i in used_lines:
                continue
                
            line_lower = line.lower().strip()
            
            # Start of education section
            if any(keyword in line_lower for keyword in ['education', 'academic', 'qualification', 'degree', 'university', 'college']):
                in_education = True
                if line_lower not in ['education', 'academic background', 'qualifications']:
                    education_lines.append(line)
                    used_indices.append(i)
                continue
            
            # End of education (next section starts)
            if in_education and any(keyword in line_lower for keyword in 
                                  ['skills', 'projects', 'experience', 'additional']):
                break
            
            # Collect education content
            if in_education and line.strip():
                education_lines.append(line)
                used_indices.append(i)
        
        return ('\n'.join(education_lines) if education_lines else '', used_indices)
    
    def _extract_skills_with_tracking(self, lines: List[str], used_lines: set) -> tuple:
        """Extract skills and return content + line indices"""
        skills_lines = []
        used_indices = []
        in_skills = False
        
        for i, line in enumerate(lines):
            if i in used_lines:
                continue
                
            line_lower = line.lower().strip()
            
            # Start of skills section
            if any(keyword in line_lower for keyword in ['skills', 'technical', 'competenc', 'technolog']):
                in_skills = True
                if line_lower not in ['skills', 'technical skills', 'competencies', 'technologies']:
                    skills_lines.append(line)
                    used_indices.append(i)
                continue
            
            # End of skills (next section starts)
            if in_skills and any(keyword in line_lower for keyword in 
                               ['projects', 'experience', 'education', 'additional']):
                break
            
            # Collect skills content
            if in_skills and line.strip():
                skills_lines.append(line)
                used_indices.append(i)
        
        return ('\n'.join(skills_lines) if skills_lines else '', used_indices)
    
    def _extract_projects_with_tracking(self, lines: List[str], used_lines: set) -> tuple:
        """Extract projects and return content + line indices"""
        projects_lines = []
        used_indices = []
        in_projects = False
        
        for i, line in enumerate(lines):
            if i in used_lines:
                continue
                
            line_lower = line.lower().strip()
            
            # Start of projects section
            if any(keyword in line_lower for keyword in ['projects', 'portfolio']):
                in_projects = True
                if line_lower not in ['projects', 'portfolio', 'key projects']:
                    projects_lines.append(line)
                    used_indices.append(i)
                continue
            
            # End of projects (next section starts)
            if in_projects and any(keyword in line_lower for keyword in 
                                 ['additional', 'other', 'leadership']):
                break
            
            # Collect projects content
            if in_projects and line.strip():
                projects_lines.append(line)
                used_indices.append(i)
        
        return ('\n'.join(projects_lines) if projects_lines else '', used_indices)
    
    def _extract_education_from_remaining(self, lines: List[str], used_lines: set) -> tuple:
        """Extract education content from remaining unused lines"""
        education_lines = []
        used_indices = []
        
        for i, line in enumerate(lines):
            if i in used_lines or not line.strip():
                continue
                
            line_lower = line.lower().strip()
            
            # Look for education indicators in remaining content
            if (line_lower in ['education', 'academic background', 'qualifications'] or
                any(edu_word in line_lower for edu_word in ['degree', 'university', 'college', 'bachelor', 'master', 'phd', 'diploma', 'certification', 'gpa'])):
                education_lines.append(line)
                used_indices.append(i)
        
        return ('\n'.join(education_lines) if education_lines else '', used_indices)
    
    def _extract_skills_from_remaining(self, lines: List[str], used_lines: set) -> tuple:
        """Extract skills content from remaining unused lines"""
        skills_lines = []
        used_indices = []
        
        for i, line in enumerate(lines):
            if i in used_lines or not line.strip():
                continue
                
            line_lower = line.lower().strip()
            
            # Look for skills indicators in remaining content
            if (line_lower in ['skills', 'technical skills', 'competencies', 'technologies'] or
                any(skill_word in line_lower for skill_word in ['programming', 'languages', 'frameworks', 'tools', 'software', 'database', 'cloud', 'aws', 'python', 'java', 'javascript', 'react', 'node'])):
                skills_lines.append(line)
                used_indices.append(i)
        
        return ('\n'.join(skills_lines) if skills_lines else '', used_indices)
    
    def _extract_clean_additional_info(self, lines: List[str], used_lines: set) -> str:
        """Extract only unused, non-work content for additional information"""
        additional_lines = []
        
        for i, line in enumerate(lines):
            if i in used_lines or not line.strip():
                continue
                
            line_lower = line.lower().strip()
            
            # Skip section headers that should be filtered out
            if line_lower in ['objective', 'education', 'skills', 'experience', 'projects', 'summary', 'work experience', 'technical skills', 'professional summary']:
                continue
            
            # Only include if it's clearly additional info and not work/education/skills related
            if (any(keyword in line_lower for keyword in ['leadership', 'additional', 'other', 'activities', 'interests', 'hobbies', 'http', 'www', '.com', 'portfolio', 'website']) or
                # Include remaining content that doesn't look like work/education/skills/headers
                (not any(excluded_indicator in line_lower for excluded_indicator in 
                       ['developer', 'engineer', 'manager', 'led', 'built', 'developed', 'implemented', 'delivered', 'improved', 'corp', 'inc', 'company', '2020', '2021', '2022', '2023', '2024',
                        'education', 'degree', 'university', 'college', 'skills', 'programming', 'languages', 'frameworks', 'objective', 'summary']) and
                 len(line.strip()) > 3)):
                additional_lines.append(line)
        
        return '\n'.join(additional_lines) if additional_lines else ''
    
    def _extract_personal_info(self, lines: List[str]) -> str:
        """Extract personal information from resume"""
        personal_lines = []
        
        # Look for contact info patterns in first 10 lines
        for i, line in enumerate(lines[:10]):
            line_lower = line.lower()
            # Email, phone, location, LinkedIn, GitHub patterns
            if (any(pattern in line for pattern in ['@', '.com', '.org', '.net']) or
                any(pattern in line_lower for pattern in ['phone', 'mobile', 'tel', 'linkedin', 'github']) or
                any(char.isdigit() for char in line) and len(line) > 8 or
                any(location in line_lower for location in ['india', 'usa', 'uk', 'canada', 'city', 'state'])):
                personal_lines.append(line)
            # Name (usually first line if it's short and has title case)
            elif i == 0 and len(line.split()) <= 4 and line.istitle():
                personal_lines.append(line)
        
        return '\n'.join(personal_lines) if personal_lines else ''
    
    def _extract_summary(self, lines: List[str]) -> str:
        """Extract professional summary/objective"""
        summary_lines = []
        in_summary = False
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Start of summary section
            if any(keyword in line_lower for keyword in ['objective', 'summary', 'profile', 'about']):
                in_summary = True
                if line_lower not in ['objective', 'summary', 'profile', 'about']:
                    summary_lines.append(line)
                continue
            
            # End of summary (next section starts)
            if in_summary and any(keyword in line_lower for keyword in 
                                ['experience', 'education', 'skills', 'projects']):
                break
            
            # Collect summary content
            if in_summary and line.strip():
                summary_lines.append(line)
        
        return '\n'.join(summary_lines) if summary_lines else ''
    
    def _extract_experience(self, lines: List[str]) -> str:
        """Extract work experience section with improved detection"""
        experience_lines = []
        in_experience = False
        
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            
            # Start of experience section - more robust detection
            if (any(keyword in line_lower for keyword in ['experience', 'work', 'employment', 'career']) or
                # Also detect job titles and company patterns
                any(title in line_lower for title in ['developer', 'engineer', 'manager', 'analyst', 'consultant']) or
                # Date patterns that indicate work experience
                any(year in line for year in ['2020', '2021', '2022', '2023', '2024']) and 'present' in line_lower):
                
                in_experience = True
                if line_lower not in ['experience', 'work experience', 'employment', 'career']:
                    experience_lines.append(line)
                continue
            
            # End of experience (next section starts) - but be more careful
            if in_experience and any(keyword in line_lower for keyword in 
                                   ['education', 'skills', 'projects']) and not any(work_indicator in line_lower for work_indicator in ['developer', 'engineer', 'company', '2020', '2021', '2022', '2023', '2024']):
                break
            
            # Collect experience content - include job-related content even if not explicitly in experience section
            if (in_experience and line.strip()) or (
                not in_experience and 
                (any(title in line_lower for title in ['developer', 'engineer', 'manager']) or
                 any(company in line_lower for company in ['corp', 'inc', 'ltd', 'company']) or
                 (any(year in line for year in ['2020', '2021', '2022', '2023', '2024']) and any(indicator in line_lower for indicator in ['present', 'current', '-'])))):
                
                in_experience = True  # Start collecting if we find work-related content
                experience_lines.append(line)
        
        return '\n'.join(experience_lines) if experience_lines else ''
    
    def _extract_education(self, lines: List[str]) -> str:
        """Extract education section"""
        education_lines = []
        in_education = False
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Start of education section
            if any(keyword in line_lower for keyword in ['education', 'academic', 'qualification', 'degree']):
                in_education = True
                if line_lower not in ['education', 'academic background', 'qualifications']:
                    education_lines.append(line)
                continue
            
            # End of education (next section starts)
            if in_education and any(keyword in line_lower for keyword in 
                                  ['skills', 'projects', 'experience', 'additional']):
                break
            
            # Collect education content
            if in_education and line.strip():
                education_lines.append(line)
        
        return '\n'.join(education_lines) if education_lines else ''
    
    def _extract_skills(self, lines: List[str]) -> str:
        """Extract skills section"""
        skills_lines = []
        in_skills = False
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Start of skills section
            if any(keyword in line_lower for keyword in ['skills', 'technical', 'competenc', 'technolog']):
                in_skills = True
                if line_lower not in ['skills', 'technical skills', 'competencies', 'technologies']:
                    skills_lines.append(line)
                continue
            
            # End of skills (next section starts)
            if in_skills and any(keyword in line_lower for keyword in 
                               ['projects', 'experience', 'education', 'additional']):
                break
            
            # Collect skills content
            if in_skills and line.strip():
                skills_lines.append(line)
        
        return '\n'.join(skills_lines) if skills_lines else ''
    
    def _extract_projects(self, lines: List[str]) -> str:
        """Extract projects section"""
        projects_lines = []
        in_projects = False
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Start of projects section
            if any(keyword in line_lower for keyword in ['projects', 'portfolio']):
                in_projects = True
                if line_lower not in ['projects', 'portfolio', 'key projects']:
                    projects_lines.append(line)
                continue
            
            # End of projects (next section starts)
            if in_projects and any(keyword in line_lower for keyword in 
                                 ['additional', 'other', 'leadership']):
                break
            
            # Collect projects content
            if in_projects and line.strip():
                projects_lines.append(line)
        
        return '\n'.join(projects_lines) if projects_lines else ''
    
    def _extract_additional_info(self, lines: List[str]) -> str:
        """Extract additional information (leadership, etc.) - exclude work experience"""
        additional_lines = []
        in_additional = False
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Start of additional section
            if any(keyword in line_lower for keyword in ['leadership', 'additional', 'other', 'activities']):
                in_additional = True
                if line_lower not in ['leadership', 'additional information', 'other', 'activities']:
                    # Skip if this looks like work experience content
                    if not any(work_indicator in line_lower for work_indicator in 
                             ['experience', 'developer', 'engineer', 'manager', 'corp', 'company', '2020', '2021', '2022', '2023', '2024']):
                        additional_lines.append(line)
                continue
            
            # Collect additional content - but exclude work experience patterns
            if in_additional and line.strip():
                # Skip work experience content that might have been misclassified
                if not (any(work_indicator in line_lower for work_indicator in 
                          ['experience', 'developer', 'engineer', 'manager', 'analyst', 'consultant']) or
                       any(company in line_lower for company in ['corp', 'inc', 'ltd', 'company']) or
                       (any(year in line for year in ['2020', '2021', '2022', '2023', '2024']) and 
                        any(indicator in line_lower for indicator in ['present', 'current', '-']))):
                    additional_lines.append(line)
        
        return '\n'.join(additional_lines) if additional_lines else ''
    
    def _find_section_boundaries(self, lines: List[str]) -> List[tuple]:
        """Find clear section boundaries in resume text"""
        boundaries = []
        
        # Look for clear section headers
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            
            # Check for clear section indicators
            if self._is_clear_section_header(line):
                section_type = self._determine_section_type(line)
                title = self._get_section_title(section_type)
                boundaries.append((i, section_type, title))
        
        # If no clear boundaries, create logical ones
        if not boundaries:
            boundaries = self._create_logical_boundaries(lines)
        
        return boundaries
    
    def _is_clear_section_header(self, line: str) -> bool:
        """Check if line is a clear section header"""
        line_lower = line.lower().strip()
        
        # Clear section headers
        clear_headers = [
            'experience', 'work experience', 'professional experience',
            'education', 'academic background', 'qualifications',
            'skills', 'technical skills', 'core competencies',
            'projects', 'key projects', 'notable projects',
            'summary', 'professional summary', 'objective',
            'contact', 'personal information', 'about'
        ]
        
        # Check if line matches clear headers
        for header in clear_headers:
            if line_lower == header or (len(line.split()) <= 3 and header in line_lower):
                return True
        
        # Check formatting patterns
        if (len(line) < 50 and 
            (line.isupper() or 
             line.endswith(':') or 
             (len(line.split()) <= 3 and any(keyword in line_lower for keyword in clear_headers)))):
            return True
        
        return False
    
    def _create_logical_boundaries(self, lines: List[str]) -> List[tuple]:
        """Create logical section boundaries when no clear headers exist"""
        boundaries = []
        
        # Start with personal info (usually first few lines)
        if lines:
            boundaries.append((0, 'personal', 'Personal Information'))
        
        # Look for experience indicators
        for i, line in enumerate(lines):
            line_lower = line.lower()
            
            # Experience section indicators
            if any(indicator in line_lower for indicator in 
                   ['developer', 'engineer', 'manager', 'analyst', 'consultant', 
                    '2020', '2021', '2022', '2023', '2024', 'present']):
                if not any(b[1] == 'experience' for b in boundaries):
                    boundaries.append((max(0, i-2), 'experience', 'Work Experience'))
                break
        
        # Look for skills section
        for i, line in enumerate(lines[len(lines)//2:], len(lines)//2):
            line_lower = line.lower()
            if any(skill in line_lower for skill in 
                   ['javascript', 'python', 'react', 'node', 'aws', 'docker', 'sql']):
                if not any(b[1] == 'skills' for b in boundaries):
                    boundaries.append((max(0, i-1), 'skills', 'Technical Skills'))
                break
        
        return sorted(boundaries, key=lambda x: x[0])
    
    def _determine_section_type(self, line: str) -> str:
        """Determine section type from header line"""
        line_lower = line.lower().strip()
        
        # Check for specific section types
        if any(keyword in line_lower for keyword in ['experience', 'work', 'employment', 'career']):
            return 'experience'
        elif any(keyword in line_lower for keyword in ['education', 'academic', 'qualification', 'degree']):
            return 'education'
        elif any(keyword in line_lower for keyword in ['skill', 'technical', 'competenc', 'technolog']):
            return 'skills'
        elif any(keyword in line_lower for keyword in ['project', 'portfolio']):
            return 'projects'
        elif any(keyword in line_lower for keyword in ['summary', 'objective', 'profile']):
            return 'summary'
        elif any(keyword in line_lower for keyword in ['contact', 'personal', 'about']):
            return 'personal'
        else:
            return 'other'
    
    def _get_section_title(self, section_type: str) -> str:
        """Get proper title for section type"""
        titles = {
            'personal': 'Personal Information',
            'summary': 'Professional Summary', 
            'experience': 'Work Experience',
            'education': 'Education',
            'skills': 'Technical Skills',
            'projects': 'Projects',
            'other': 'Additional Information'
        }
        return titles.get(section_type, 'Information')
    
    def _create_basic_sections(self, lines: List[str]) -> List[ResumeSection]:
        """Create basic sections when no clear structure is found"""
        sections = []
        
        # Split content into logical chunks
        total_lines = len(lines)
        
        # Personal info (first 20% or first 5 lines)
        personal_end = min(max(5, total_lines // 5), 10)
        if personal_end > 0:
            personal_content = '\n'.join(lines[:personal_end])
            sections.append(ResumeSection(
                type='personal',
                title='Personal Information',
                content=personal_content,
                confidence=0.8
            ))
        
        # Experience (middle 60%)
        exp_start = personal_end
        exp_end = min(total_lines, exp_start + int(total_lines * 0.6))
        if exp_end > exp_start:
            exp_content = '\n'.join(lines[exp_start:exp_end])
            sections.append(ResumeSection(
                type='experience',
                title='Work Experience',
                content=exp_content,
                confidence=0.7
            ))
        
        # Skills/Other (remaining 20%)
        if exp_end < total_lines:
            skills_content = '\n'.join(lines[exp_end:])
            sections.append(ResumeSection(
                type='skills',
                title='Skills & Additional Information',
                content=skills_content,
                confidence=0.7
            ))
        
        return sections
    
    def is_potential_section_start(self, line: str) -> bool:
        """Check if line could be the start of a new section"""
        line_lower = line.lower().strip()
        
        # Check for common section indicators
        section_starters = [
            'experience', 'education', 'skills', 'projects', 'summary', 'objective',
            'work experience', 'professional experience', 'technical skills',
            'personal projects', 'academic background', 'qualifications'
        ]
        
        # Check if line starts with or contains section keywords
        for starter in section_starters:
            if line_lower.startswith(starter) or (starter in line_lower and len(line) < 100):
                return True
        
        # Check for date patterns that might indicate experience entries
        date_patterns = [
            r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}\b',
            r'\b\d{4}\s*[-–]\s*(\d{4}|present|current)\b',
            r'\b(20\d{2})\s*[-–]\s*(20\d{2}|present)\b'
        ]
        
        for pattern in date_patterns:
            if re.search(pattern, line_lower):
                return True
        
        return False
    
    async def ai_post_process_sections(self, sections: List[ResumeSection], raw_text: str) -> List[ResumeSection]:
        """Use AI to analyze and correct any remaining parsing issues"""
        try:
            # Only post-process if we have sections to analyze
            if not sections or len(sections) < 2:
                return sections
            
            # Check if we have all expected sections
            section_titles = [s.title for s in sections]
            missing_sections = []
            if not any('Education' in title for title in section_titles):
                missing_sections.append('Education')
            if not any('Skills' in title or 'Technical' in title for title in section_titles):
                missing_sections.append('Technical Skills')
            if not any('Additional' in title or 'Other' in title for title in section_titles):
                missing_sections.append('Additional Information')
            
            # Create a concise summary of current sections for AI analysis
            section_summary = []
            for section in sections:
                content_preview = section.content[:200] + "..." if len(section.content) > 200 else section.content
                section_summary.append(f"**{section.title}:**\n{content_preview}")
            
            summary_text = "\n\n".join(section_summary)
            
            prompt = f"""Analyze these resume sections and identify any organizational issues or mistakes:

{summary_text}

Look for these specific issues:
1. Section headers (like "OBJECTIVE", "EDUCATION", "SKILLS") appearing as content instead of being filtered out
2. Content in "Additional Information" that belongs in other sections (education, skills, objective content)
3. Any content that should be moved to more appropriate sections
4. Duplicate or fragmented information
5. Missing important information that should be extracted

Pay special attention to the "Additional Information" section - move any content that belongs in other sections.

Provide corrections in this JSON format:
{{
  "issues_found": ["brief description of each issue"],
  "corrections": [
    {{
      "section_title": "exact section title to modify",
      "action": "remove_lines|move_content|add_content",
      "content": "specific content to remove/move/add",
      "target_section": "destination section if moving content"
    }}
  ]
}}

If no issues found, return: {{"issues_found": [], "corrections": []}}"""
            
            # Make API call with minimal token usage
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.openrouter_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "anthropic/claude-3-haiku",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 500,  # Minimal tokens for corrections
                        "temperature": 0.1
                    },
                    timeout=30.0
                )
            
            if response.status_code == 200:
                ai_response = response.json()
                corrections_text = ai_response['choices'][0]['message']['content']
                
                # Parse AI corrections and apply them
                import json
                try:
                    corrections_data = json.loads(corrections_text)
                    if corrections_data.get('corrections'):
                        sections = self._apply_ai_corrections(sections, corrections_data['corrections'])
                        print(f"AI post-processing applied {len(corrections_data['corrections'])} corrections")
                    else:
                        print("AI post-processing: No corrections needed")
                except json.JSONDecodeError:
                    print("AI post-processing: Could not parse corrections, using original sections")
            
            return sections
            
        except Exception as e:
            print(f"AI post-processing failed: {e}")
            return sections  # Return original sections if AI fails
    
    def _apply_ai_corrections(self, sections: List[ResumeSection], corrections: List[dict]) -> List[ResumeSection]:
        """Apply AI-suggested corrections to sections"""
        sections_dict = {section.title: section for section in sections}
        
        for correction in corrections:
            action = correction.get('action')
            section_title = correction.get('section_title')
            content = correction.get('content', '')
            
            if section_title not in sections_dict:
                continue
                
            section = sections_dict[section_title]
            
            if action == 'remove_lines':
                # Remove specific content lines
                lines = section.content.split('\n')
                filtered_lines = [line for line in lines if content.lower() not in line.lower()]
                section.content = '\n'.join(filtered_lines).strip()
            
            elif action == 'move_content':
                # Move content to target section
                target_section = correction.get('target_section')
                
                # Remove from current section
                lines = section.content.split('\n')
                content_lines = [line for line in lines if content.lower() in line.lower()]
                remaining_lines = [line for line in lines if content.lower() not in line.lower()]
                section.content = '\n'.join(remaining_lines).strip()
                
                # Add to target section (create if doesn't exist)
                if target_section in sections_dict:
                    target = sections_dict[target_section]
                    if target.content:
                        target.content += '\n' + '\n'.join(content_lines)
                    else:
                        target.content = '\n'.join(content_lines)
                else:
                    # Create new section if it doesn't exist
                    new_section = ResumeSection(
                        type=target_section.lower().replace(' ', '_'),
                        title=target_section,
                        content='\n'.join(content_lines),
                        confidence=0.8
                    )
                    sections.append(new_section)
                    sections_dict[target_section] = new_section
            
            elif action == 'add_content':
                # Add missing content
                if section.content:
                    section.content += '\n' + content
                else:
                    section.content = content
        
        # Filter out empty sections
        return [section for section in sections if section.content.strip()]
    
    def _create_optimized_prompt(self, text: str) -> str:
        """Create a token-optimized prompt for AI processing"""
        # Truncate text if too long to save tokens
        max_chars = 2000  # Limit input to ~500 tokens
        if len(text) > max_chars:
            text = text[:max_chars] + "..."
        
        prompt = f"""Extract resume sections from this text. Return ONLY a valid JSON array with objects containing 'type', 'title', 'content'.

Valid types: personal, summary, experience, education, skills, projects, other
Ensure each object has all three fields with non-empty string values.

Text: {text}

Return only the JSON array, no other text:"""
        
        return prompt
    
    async def _call_openrouter_api(self, prompt: str) -> List[ResumeSection]:
        """Call OpenRouter API with cost optimization"""
        try:
            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://aiappy.com",
                "X-Title": "AiAppy Resume Parser"
            }
            
            # Use cost-efficient model (Claude Haiku or GPT-3.5)
            payload = {
                "model": "anthropic/claude-3-haiku",  # Very cost-efficient
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 1000,  # Limit output tokens
                "temperature": 0.1,  # Low temperature for consistency
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.openrouter_base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result['choices'][0]['message']['content']
                    
                    # Parse JSON response
                    try:
                        print(f"AI Response: {content[:200]}...")  # Debug log
                        # Extract JSON from response (handle potential markdown formatting)
                        json_start = content.find('[')
                        json_end = content.rfind(']') + 1
                        if json_start >= 0 and json_end > json_start:
                            json_str = content[json_start:json_end]
                            print(f"Extracted JSON: {json_str[:200]}...")  # Debug log
                            sections_data = json.loads(json_str)
                            
                            # Convert to ResumeSection objects
                            enhanced_sections = []
                            for section_data in sections_data:
                                if isinstance(section_data, dict) and 'type' in section_data and 'content' in section_data:
                                    # Ensure all required fields have valid values
                                    section_type = section_data.get('type', 'other')
                                    section_title = section_data.get('title') or section_titles.get(section_type, 'Information')
                                    section_content = section_data.get('content', '').strip()
                                    
                                    if section_content:  # Only add sections with actual content
                                        enhanced_sections.append(ResumeSection(
                                            type=section_type,
                                            title=section_title,
                                            content=section_content,
                                            confidence=0.95  # High confidence for AI-enhanced
                                        ))
                            
                            return enhanced_sections
                    except json.JSONDecodeError:
                        print("Failed to parse AI response as JSON")
                        return None
                else:
                    print(f"OpenRouter API error: {response.status_code}")
                    return None
                    
        except Exception as e:
            print(f"OpenRouter API call failed: {e}")
            return None
        
        return None
    
    async def _smart_section_detection(self, raw_text: str) -> List[ResumeSection]:
        """Creative approach: Use AI only for section headers, preserve all content"""
        try:
            lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
            if not lines:
                return None
            
            # Step 1: Extract potential headers (first 50 chars of each line)
            header_candidates = []
            for i, line in enumerate(lines):
                if len(line) < 100 and (self.is_potential_section_start(line) or len(line.split()) <= 5):
                    header_candidates.append((i, line[:50]))  # Only first 50 chars
            
            if not header_candidates:
                return None
            
            # Step 2: Use AI to classify ONLY the headers (minimal tokens)
            header_classifications = await self._classify_headers_only(header_candidates)
            
            if not header_classifications:
                return None
            
            # Step 3: Build sections using AI classifications but preserve ALL content
            return self._build_sections_from_classifications(lines, header_classifications)
            
        except Exception as e:
            print(f"Smart section detection failed: {e}")
            return None
    
    async def _classify_headers_only(self, header_candidates: List[tuple]) -> dict:
        """Use AI to classify only the headers - ultra token efficient"""
        try:
            # Create minimal prompt with just headers
            headers_text = "\n".join([f"{i}: {header}" for i, header in header_candidates])
            
            prompt = f"""Classify these resume section headers. Return JSON object with line numbers as keys and section types as values.

Valid types: personal, summary, experience, education, skills, projects, other

Headers:
{headers_text}

JSON:"""
            
            # This uses ~100-200 tokens max instead of 500+
            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://aiappy.com",
                "X-Title": "AiAppy Resume Parser"
            }
            
            payload = {
                "model": "anthropic/claude-3-haiku",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 300,  # Even smaller output
                "temperature": 0.1,
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.openrouter_base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result['choices'][0]['message']['content']
                    print(f"Header Classification: {content[:100]}...")  # Debug
                    
                    # Parse JSON response
                    json_start = content.find('{')
                    json_end = content.rfind('}') + 1
                    if json_start >= 0 and json_end > json_start:
                        json_str = content[json_start:json_end]
                        return json.loads(json_str)
                        
        except Exception as e:
            print(f"Header classification failed: {e}")
            return None
        
        return None
    
    def _build_sections_from_classifications(self, lines: List[str], classifications: dict) -> List[ResumeSection]:
        """Build complete sections using AI header classifications but preserving ALL content"""
        try:
            # Convert string keys to integers and sort
            classified_headers = {}
            for key, section_type in classifications.items():
                try:
                    line_num = int(str(key).split(':')[0])  # Handle "0: Header" format
                    classified_headers[line_num] = section_type
                except (ValueError, IndexError):
                    continue
            
            if not classified_headers:
                return None
            
            # Sort header positions
            header_positions = sorted(classified_headers.keys())
            
            # Build sections with ALL content preserved
            sections = []
            for i, header_pos in enumerate(header_positions):
                section_type = classified_headers[header_pos]
                
                # Determine section boundaries
                start_line = header_pos
                end_line = header_positions[i + 1] if i + 1 < len(header_positions) else len(lines)
                
                # Extract ALL content for this section
                section_lines = lines[start_line:end_line]
                if section_lines:
                    content = '\n'.join(section_lines).strip()
                    if content:
                        sections.append(ResumeSection(
                            type=section_type,
                            title=section_titles.get(section_type, 'Information'),
                            content=content,
                            confidence=0.95
                        ))
            
            return sections if sections else None
            
        except Exception as e:
            print(f"Section building failed: {e}")
            return None

parser = DocumentParser()
ai_ats_scorer = AIATSScorer(api_key="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")

@app.get("/")
async def root():
    return {"message": "Document Parser Service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Document Parser Service"}

@app.post("/ats-score", response_model=ATSScore)
async def calculate_ats_score(sections: List[ResumeSection]):
    """Calculate ATS score using AI analysis for genuine insights"""
    try:
        # Use AI-powered ATS analysis for genuine insights
        return await ai_ats_scorer.analyze_resume(sections)
        
        # 1. Format & Structure (25 points)
        structure_score = 0
        if 'personal' in section_types:
            structure_score += 8
            strengths.append("Clear contact information section")
        else:
            suggestions.append("Add a dedicated contact information section")
            
        if 'experience' in section_types:
            structure_score += 10
            strengths.append("Professional experience section present")
        else:
            suggestions.append("Include detailed work experience section")
        if 'skills' in section_types:
            skills_section = next((s for s in sections if s.type == 'skills'), None)
            if skills_section and len(skills_section.content.split()) > 10:
                category_scores["keywords_skills"] += 15
        
        # Enhanced keyword detection
        tech_keywords = ['python', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 'git', 'java', 'c++', 'html', 'css']
        business_keywords = ['management', 'leadership', 'strategy', 'analysis', 'project', 'team', 'client', 'sales']
        all_keywords = tech_keywords + business_keywords
        
        keyword_count = sum(1 for keyword in all_keywords if keyword in all_text)
        category_scores["keywords_skills"] += min(10, keyword_count)
        
        # Experience Relevance (25 points) - Enhanced experience analysis
        if 'experience' in section_types:
            experience_section = next((s for s in sections if s.type == 'experience'), None)
            if experience_section:
                exp_content = experience_section.content.lower()
                
                # Check for time indicators
                if any(word in exp_content for word in ['years', 'year', 'months', '2020', '2021', '2022', '2023', '2024']):
                    category_scores["experience_relevance"] += 8
                
                # Check for action verbs and achievements
                action_verbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed', 'improved', 'increased']
                if any(verb in exp_content for verb in action_verbs):
                    category_scores["experience_relevance"] += 8
                
                # Check for quantifiable results
                if any(char in exp_content for char in ['%', '$', '#']) or any(word in exp_content for word in ['million', 'thousand', 'percent']):
                    category_scores["experience_relevance"] += 9
        
        # Contact Info (25 points) - Enhanced contact analysis
        personal_section = next((s for s in sections if s.type == 'personal'), None)
        if personal_section:
            contact_content = personal_section.content.lower()
            
            # Email check
            if '@' in contact_content and '.' in contact_content:
                category_scores["contact_info"] += 8
            
            # Phone check
            if any(char in contact_content for char in ['+', '(', '-']) or 'phone' in contact_content:
                category_scores["contact_info"] += 8
            
            # Professional profiles
            if 'linkedin' in contact_content:
                category_scores["contact_info"] += 5
            if any(platform in contact_content for platform in ['github', 'portfolio', 'website']):
                category_scores["contact_info"] += 4
        
        # Education Credentials (25 points) - Enhanced education analysis
        if 'education' in section_types:
            education_section = next((s for s in sections if s.type == 'education'), None)
            if education_section:
                edu_content = education_section.content.lower()
                
                # Degree level
                if any(degree in edu_content for degree in ['bachelor', 'master', 'phd', 'doctorate']):
                    category_scores["education_credentials"] += 15
                elif any(degree in edu_content for degree in ['associate', 'diploma', 'certificate']):
                    category_scores["education_credentials"] += 10
                
                # Institution quality indicators
                if any(word in edu_content for word in ['university', 'college', 'institute', 'school']):
                    category_scores["education_credentials"] += 5
                
                # GPA or honors
                if any(word in edu_content for word in ['gpa', 'honors', 'magna', 'summa', 'dean']):
                    category_scores["education_credentials"] += 5
        
        overall_score = sum(category_scores.values())
        
        # Generate intelligent suggestions based on gaps
        suggestions = []
        strengths = []
        
        # Targeted suggestions based on specific weaknesses
        if category_scores["contact_info"] < 15:
            suggestions.append("Add complete contact information including professional email, phone number, and LinkedIn profile")
        if category_scores["keywords_skills"] < 15:
            suggestions.append("Include more industry-relevant keywords and technical skills to improve ATS compatibility")
        if category_scores["experience_relevance"] < 15:
            suggestions.append("Add quantifiable achievements and results to your work experience (e.g., 'Increased sales by 25%')")
        if category_scores["format_structure"] < 15:
            suggestions.append("Improve resume structure with clear section headers and consistent formatting")
        if category_scores["education_credentials"] < 10 and 'education' not in section_types:
            suggestions.append("Consider adding an education section with your relevant qualifications")
        
        # Add strengths based on high scores
        if category_scores["contact_info"] >= 20:
            strengths.append("Complete and professional contact information")
        if category_scores["experience_relevance"] >= 20:
            strengths.append("Strong work experience with quantifiable achievements")
        if category_scores["keywords_skills"] >= 20:
            strengths.append("Good technical and industry keyword coverage")
        if category_scores["format_structure"] >= 20:
            strengths.append("Well-structured and organized resume format")
        if category_scores["education_credentials"] >= 15:
            strengths.append("Strong educational background")
        
        # Ensure minimum suggestions
        if len(suggestions) < 3:
            additional_suggestions = [
                "Use action verbs to start bullet points in your experience section",
                "Tailor your resume keywords to match the job description",
                "Consider adding a professional summary or objective statement",
                "Include relevant certifications or professional development"
            ]
            for suggestion in additional_suggestions:
                if suggestion not in suggestions:
                    suggestions.append(suggestion)
                    if len(suggestions) >= 4:
                        break
        
        return ATSScore(
            overall_score=min(100, overall_score),
            category_scores=category_scores,
            suggestions=suggestions[:4],
            strengths=strengths[:3] if strengths else ["Professional resume structure"]
        )
        
    except Exception as e:
        print(f"Error in ATS scoring: {e}")
        # Fallback to enhanced rule-based analysis if AI fails
        return await ai_ats_scorer._enhanced_fallback_analysis(sections)
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Extract text based on file type
        if file.content_type == 'application/pdf':
            raw_text = parser.extract_text_from_pdf(file_content)
        elif file.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            raw_text = parser.extract_text_from_docx(file_content)
        elif file.content_type == 'text/plain':
            raw_text = parser.extract_text_from_txt(file_content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Parse into sections
        sections = parser.parse_resume_text(raw_text)
        
        # AI post-processing disabled due to issues - using reliable rule-based approach
        # sections = await parser.ai_post_process_sections(sections, raw_text)
        
        # Create metadata
        metadata = {
            "file_type": file.content_type,
            "file_size": len(file_content),
            "total_sections": len(sections),
            "word_count": len(raw_text.split()),
            "processing_time": datetime.now().isoformat(),
            "section_types": list(set(section.type for section in sections))
        }
        
        return ParseResponse(
            success=True,
            filename=file.filename or "unknown",
            sections=sections,
            metadata=metadata,
            raw_text=raw_text
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/parse-resume", response_model=ParseResponse)
async def parse_resume(file: UploadFile = File(...)):
    """Parse resume file and extract sections"""
    
    # Validate file type
    allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, DOCX, or TXT files.")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Extract text based on file type
        if file.content_type == 'application/pdf':
            raw_text = parser.extract_text_from_pdf(file_content)
        elif file.content_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            raw_text = parser.extract_text_from_docx(file_content)
        elif file.content_type == 'text/plain':
            raw_text = parser.extract_text_from_txt(file_content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Parse into sections
        sections = parser.parse_resume_text(raw_text)
        
        # AI post-processing disabled due to issues - using reliable rule-based approach
        # sections = await parser.ai_post_process_sections(sections, raw_text)
        
        # Create metadata
        metadata = {
            "file_type": file.content_type,
            "file_size": len(file_content),
            "sections_count": len(sections),
            "word_count": len(raw_text.split()),
            "character_count": len(raw_text)
        }
        
        return ParseResponse(
            success=True,
            filename=file.filename or "unknown",
            sections=sections,
            metadata=metadata,
            raw_text=raw_text
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
