"""
Ollama-powered Resume Analyzer using Mistral 7B - Fixed Version
Handles both section extraction and ATS scoring with proper JSON parsing
"""

import ollama
import json
import re
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResumeSection(BaseModel):
    type: str
    title: str
    content: str
    confidence: float

class ATSScore(BaseModel):
    overall_score: int
    category_scores: Dict[str, int]
    suggestions: List[str]
    strengths: List[str]

class CompleteResumeAnalysis(BaseModel):
    success: bool
    filename: str
    sections: List[ResumeSection]
    ats_analysis: ATSScore
    raw_text: str
    processing_time: float

class OllamaResumeAnalyzer:
    def __init__(self, model_name: str = "mistral:7b"):
        self.model_name = model_name
        self.client = ollama.Client()
        
        # Verify model is available
        try:
            models = self.client.list()
            available_models = [model['name'] for model in models['models']]
            if model_name not in available_models:
                logger.warning(f"Model {model_name} not found. Available models: {available_models}")
        except Exception as e:
            logger.error(f"Error initializing Ollama client: {e}")
            raise

    def extract_sections_with_ollama(self, raw_text: str) -> List[ResumeSection]:
        """Extract resume sections using Mistral 7B with improved JSON parsing"""
        # Limit text length for efficiency
        text_sample = raw_text[:2000] if len(raw_text) > 2000 else raw_text
        
        prompt = f"""Extract resume sections from this text. Return ONLY valid JSON.

Text:
{text_sample}

Return JSON in this exact format:
{{"sections": [{{"type": "personal", "title": "Personal Information", "content": "name and contact info"}}, {{"type": "experience", "title": "Work Experience", "content": "job details"}}, {{"type": "education", "title": "Education", "content": "education details"}}, {{"type": "skills", "title": "Skills", "content": "technical skills"}}]}}"""

        try:
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    'temperature': 0.1,
                    'top_p': 0.9,
                    'num_predict': 1500,
                    'stop': ['\n\n\n']
                }
            )
            
            response_text = response['response'].strip()
            logger.info(f"Section extraction response: {response_text[:300]}...")
            
            # Multiple JSON extraction strategies
            parsed_data = None
            
            # Strategy 1: Direct JSON parsing
            try:
                parsed_data = json.loads(response_text)
                logger.info("Direct JSON parsing successful")
            except json.JSONDecodeError:
                pass
            
            # Strategy 2: Extract JSON with regex
            if not parsed_data:
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    try:
                        parsed_data = json.loads(json_str)
                        logger.info("Regex JSON extraction successful")
                    except json.JSONDecodeError as e:
                        logger.error(f"JSON decode error: {e}")
                        logger.error(f"Raw JSON: {json_str[:500]}")
            
            # Strategy 3: Clean and try again
            if not parsed_data:
                # Remove any markdown formatting
                clean_text = response_text.replace('```json', '').replace('```', '').strip()
                try:
                    parsed_data = json.loads(clean_text)
                    logger.info("Cleaned JSON parsing successful")
                except json.JSONDecodeError:
                    pass
            
            if parsed_data and 'sections' in parsed_data:
                sections = []
                for section_data in parsed_data['sections']:
                    sections.append(ResumeSection(
                        type=section_data.get('type', 'other'),
                        title=section_data.get('title', 'Unknown Section'),
                        content=section_data.get('content', ''),
                        confidence=0.9
                    ))
                
                logger.info(f"Successfully extracted {len(sections)} sections")
                return sections
            else:
                logger.warning("No valid sections found in response")
                return self._fallback_section_extraction(raw_text)
                
        except Exception as e:
            logger.error(f"Error in section extraction: {e}")
            return self._fallback_section_extraction(raw_text)

    def _fallback_section_extraction(self, raw_text: str) -> List[ResumeSection]:
        """Enhanced fallback section extraction with better logic"""
        logger.info("Using enhanced fallback section extraction")
        
        lines = raw_text.split('\n')
        sections = []
        
        # Find potential section headers
        section_headers = []
        for i, line in enumerate(lines):
            line_clean = line.strip().upper()
            if len(line_clean) < 50 and any(keyword in line_clean for keyword in [
                'OBJECTIVE', 'SUMMARY', 'EXPERIENCE', 'WORK', 'EMPLOYMENT', 
                'EDUCATION', 'SKILLS', 'PROJECTS', 'ACHIEVEMENTS', 'CERTIFICATIONS'
            ]):
                section_headers.append((i, line.strip()))
        
        if section_headers:
            # Create sections based on headers
            for i, (line_idx, header) in enumerate(section_headers):
                start_idx = line_idx + 1
                end_idx = section_headers[i + 1][0] if i + 1 < len(section_headers) else len(lines)
                
                content = '\n'.join(lines[start_idx:end_idx]).strip()
                if content:
                    section_type = self._classify_section_type(header)
                    sections.append(ResumeSection(
                        type=section_type,
                        title=header,
                        content=content,
                        confidence=0.8
                    ))
        else:
            # No clear headers, use percentage-based splitting
            total_lines = len(lines)
            
            # Personal info (first 15%)
            personal_end = max(5, int(total_lines * 0.15))
            personal_content = '\n'.join(lines[:personal_end]).strip()
            if personal_content:
                sections.append(ResumeSection(
                    type="personal",
                    title="Personal Information",
                    content=personal_content,
                    confidence=0.7
                ))
            
            # Experience (next 60%)
            exp_start = personal_end
            exp_end = exp_start + int(total_lines * 0.6)
            exp_content = '\n'.join(lines[exp_start:exp_end]).strip()
            if exp_content:
                sections.append(ResumeSection(
                    type="experience",
                    title="Work Experience",
                    content=exp_content,
                    confidence=0.6
                ))
            
            # Skills/Education (last 25%)
            skills_content = '\n'.join(lines[exp_end:]).strip()
            if skills_content:
                sections.append(ResumeSection(
                    type="skills",
                    title="Skills & Additional Information",
                    content=skills_content,
                    confidence=0.6
                ))
        
        return sections

    def _classify_section_type(self, header: str) -> str:
        """Classify section type based on header"""
        header_lower = header.lower()
        if any(word in header_lower for word in ['objective', 'summary', 'profile']):
            return 'summary'
        elif any(word in header_lower for word in ['experience', 'work', 'employment', 'career']):
            return 'experience'
        elif any(word in header_lower for word in ['education', 'academic', 'degree']):
            return 'education'
        elif any(word in header_lower for word in ['skills', 'technical', 'competencies']):
            return 'skills'
        elif any(word in header_lower for word in ['projects', 'portfolio']):
            return 'projects'
        else:
            return 'other'

    def score_ats_with_ollama(self, sections: List[ResumeSection]) -> ATSScore:
        """Score ATS compatibility using Mistral 7B with improved JSON parsing"""
        # Prepare resume content
        resume_content = "\n\n".join([f"{section.title}:\n{section.content}" for section in sections])
        
        prompt = f"""You are a senior hiring manager and ATS expert. Analyze this resume and return ONLY valid JSON.

Resume:
{resume_content}

Return JSON in this exact format:
{{"overall_score": 85, "category_scores": {{"format_structure": 20, "keywords_skills": 18, "experience_relevance": 22, "contact_info": 13, "education_credentials": 12}}, "suggestions": ["specific suggestion 1", "specific suggestion 2", "specific suggestion 3", "specific suggestion 4"], "strengths": ["strength 1", "strength 2"]}}"""

        try:
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    'temperature': 0.2,
                    'top_p': 0.9,
                    'num_predict': 800,
                    'stop': ['\n\n']
                }
            )
            
            response_text = response['response'].strip()
            logger.info(f"ATS scoring response: {response_text[:300]}...")
            
            # Multiple JSON extraction strategies (same as above)
            parsed_data = None
            
            # Strategy 1: Direct JSON parsing
            try:
                parsed_data = json.loads(response_text)
                logger.info("Direct ATS JSON parsing successful")
            except json.JSONDecodeError:
                pass
            
            # Strategy 2: Extract JSON with regex
            if not parsed_data:
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    try:
                        parsed_data = json.loads(json_str)
                        logger.info("Regex ATS JSON extraction successful")
                    except json.JSONDecodeError as e:
                        logger.error(f"ATS JSON decode error: {e}")
            
            # Strategy 3: Clean and try again
            if not parsed_data:
                clean_text = response_text.replace('```json', '').replace('```', '').strip()
                try:
                    parsed_data = json.loads(clean_text)
                    logger.info("Cleaned ATS JSON parsing successful")
                except json.JSONDecodeError:
                    pass
            
            if parsed_data:
                return ATSScore(
                    overall_score=parsed_data.get('overall_score', 75),
                    category_scores=parsed_data.get('category_scores', {
                        'format_structure': 18,
                        'keywords_skills': 16,
                        'experience_relevance': 20,
                        'contact_info': 12,
                        'education_credentials': 9
                    }),
                    suggestions=parsed_data.get('suggestions', [
                        'Optimize resume format for better ATS compatibility',
                        'Include more industry-specific keywords',
                        'Add quantifiable achievements to experience',
                        'Ensure contact information is complete'
                    ])[:4],
                    strengths=parsed_data.get('strengths', [
                        'Professional resume structure',
                        'Clear section organization'
                    ])[:3]
                )
            else:
                logger.warning("No valid ATS data found in response")
                return self._fallback_ats_scoring(sections)
                
        except Exception as e:
            logger.error(f"Error in ATS scoring: {e}")
            return self._fallback_ats_scoring(sections)

    def _fallback_ats_scoring(self, sections: List[ResumeSection]) -> ATSScore:
        """Enhanced fallback ATS scoring"""
        logger.info("Using enhanced fallback ATS scoring")
        
        # Analyze sections for scoring
        has_contact = any('email' in section.content.lower() or 'phone' in section.content.lower() 
                         for section in sections)
        has_experience = any('experience' in section.title.lower() or 'work' in section.title.lower() 
                            for section in sections)
        has_skills = any('skill' in section.title.lower() for section in sections)
        has_education = any('education' in section.title.lower() or 'degree' in section.content.lower() 
                           for section in sections)
        
        total_words = sum(len(section.content.split()) for section in sections)
        
        # Calculate scores based on content analysis
        contact_score = 13 if has_contact else 8
        experience_score = 22 if has_experience else 15
        skills_score = 18 if has_skills else 12
        education_score = 8 if has_education else 5
        format_score = 20 if total_words > 100 else 15
        
        overall_score = contact_score + experience_score + skills_score + education_score + format_score
        
        # Generate dynamic suggestions
        suggestions = []
        if not has_contact:
            suggestions.append("Add complete contact information including email and phone number")
        if not has_experience:
            suggestions.append("Include detailed work experience with quantifiable achievements")
        if not has_skills:
            suggestions.append("Add a dedicated skills section with relevant technical skills")
        if total_words < 200:
            suggestions.append("Expand content with more detailed descriptions")
        
        # Ensure we have 4 suggestions
        while len(suggestions) < 4:
            suggestions.extend([
                "Use action verbs and quantify achievements where possible",
                "Include industry-specific keywords for better ATS compatibility",
                "Ensure consistent formatting throughout the document",
                "Add relevant certifications or professional development"
            ])
        
        return ATSScore(
            overall_score=min(overall_score, 100),
            category_scores={
                'format_structure': format_score,
                'keywords_skills': skills_score,
                'experience_relevance': experience_score,
                'contact_info': contact_score,
                'education_credentials': education_score
            },
            suggestions=suggestions[:4],
            strengths=[
                'Resume follows standard professional format',
                'Content is well-organized and readable'
            ]
        )

    async def analyze_complete_resume(self, raw_text: str, filename: str) -> CompleteResumeAnalysis:
        """Complete resume analysis with improved error handling"""
        import time
        start_time = time.time()
        
        logger.info(f"Starting complete analysis for {filename}")
        
        try:
            # Step 1: Extract sections
            sections = self.extract_sections_with_ollama(raw_text)
            logger.info(f"Extracted {len(sections)} sections")
            
            # Step 2: Score ATS
            ats_analysis = self.score_ats_with_ollama(sections)
            logger.info(f"ATS score: {ats_analysis.overall_score}")
            
            processing_time = time.time() - start_time
            
            return CompleteResumeAnalysis(
                success=True,
                filename=filename,
                sections=sections,
                ats_analysis=ats_analysis,
                raw_text=raw_text,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error in complete analysis: {e}")
            processing_time = time.time() - start_time
            
            # Return fallback analysis
            fallback_sections = self._fallback_section_extraction(raw_text)
            fallback_ats = self._fallback_ats_scoring(fallback_sections)
            
            return CompleteResumeAnalysis(
                success=False,
                filename=filename,
                sections=fallback_sections,
                ats_analysis=fallback_ats,
                raw_text=raw_text,
                processing_time=processing_time
            )
