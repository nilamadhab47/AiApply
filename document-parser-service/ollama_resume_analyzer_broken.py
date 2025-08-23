"""
Ollama-powered Resume Analyzer using Mistral 7B
Handles both section extraction and ATS scoring in a single, efficient workflow
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
        """Extract resume sections using Mistral 7B with optimized prompt"""
        # Limit text length for efficiency
        text_sample = raw_text[:3000] if len(raw_text) > 3000 else raw_text
        
        prompt = f"""Extract resume sections from this text. Return JSON only.

Example format:
{{"sections": [{{"type": "personal", "title": "Personal Information", "content": "John Doe\\nSoftware Engineer\\njohn@email.com"}}, {{"type": "experience", "title": "Work Experience", "content": "Google 2020-2024\\nSoftware Engineer"}}]}}

Section types: personal, summary, experience, education, skills, projects, additional

Text:
{text_sample}

Return JSON only:"""

        try:
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    'temperature': 0.1,
                    'top_p': 0.9,
                    'num_predict': 1000,
                    'stop': ['\\n\\n\\n']
                }
            )
            
            response_text = response['response'].strip()
            logger.info(f"Section extraction response: {response_text[:200]}...")
            
            # Try to extract JSON from response
            json_match = re.search(r'\\{.*\\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                parsed_data = json.loads(json_str)
                
                sections = []
                if 'sections' in parsed_data:
                    for section_data in parsed_data['sections']:
                        sections.append(ResumeSection(
                            type=section_data.get('type', 'other'),
                            title=section_data.get('title', 'Unknown Section'),
                            content=section_data.get('content', ''),
                            confidence=0.9
                        ))
                
                return sections
            else:
                logger.warning("No valid JSON found in section extraction response")
                return self._fallback_section_extraction(raw_text)
                
        except Exception as e:
            logger.error(f"Error in section extraction: {e}")
            return self._fallback_section_extraction(raw_text)

    def _fallback_section_extraction(self, raw_text: str) -> List[ResumeSection]:
        """Fallback rule-based section extraction if AI fails"""
        logger.info("Using fallback section extraction")
        
        lines = raw_text.split('\\n')
        sections = []
        
        # Take first 20% as personal info
        personal_end = max(10, len(lines) // 5)
        personal_content = '\\n'.join(lines[:personal_end])
        sections.append(ResumeSection(
            type="personal",
            title="Personal Information", 
            content=personal_content,
            confidence=0.7
        ))
        
        # Take middle 60% as experience
        exp_start = personal_end
        exp_end = exp_start + int(len(lines) * 0.6)
        exp_content = '\\n'.join(lines[exp_start:exp_end])
        if exp_content.strip():
            sections.append(ResumeSection(
                type="experience",
                title="Work Experience",
                content=exp_content,
                confidence=0.6
            ))
        
        # Take last 20% as skills/additional
        skills_content = '\\n'.join(lines[exp_end:])
        if skills_content.strip():
            sections.append(ResumeSection(
                type="skills",
                title="Skills & Additional Information",
                content=skills_content,
                confidence=0.6
            ))
        
        return sections

    def score_ats_with_ollama(self, sections: List[ResumeSection]) -> ATSScore:
        """Score ATS compatibility using Mistral 7B"""
        # Prepare resume content
        resume_content = "\\n\\n".join([f"{section.title}:\\n{section.content}" for section in sections])
        
        prompt = f"""You are a senior hiring manager and ATS system expert. Analyze the following resume and provide a structured ATS compatibility score with actionable feedback. Focus on structure, content quality, keyword relevance, and real-world hiring expectations.

Resume:
\"""
{resume_content}
\"""

Scoring Criteria:
- FORMAT_STRUCTURE (25): Clear headings, consistent layout, readable fonts, ATS-friendly (no tables/images)
- KEYWORDS_SKILLS (25): Use of industry-specific keywords, technical tools, and power verbs
- EXPERIENCE_RELEVANCE (25): Job alignment, measurable achievements, career progression
- CONTACT_INFO (15): Professional email, phone, location, LinkedIn
- EDUCATION_CREDENTIALS (10): Degrees, certifications, relevant coursework

Rules:
- Score each category individually, total must be out of 100
- Provide **exactly 4 actionable suggestions**
- Provide **2–3 genuine strengths**
- Be realistic, objective, and specific
- Output only valid JSON (no preamble, no explanation)

Respond with this format only:
{{"overall_score": 87, "category_scores": {{"format_structure": 20, "keywords_skills": 18, "experience_relevance": 24, "contact_info": 13, "education_credentials": 12}}, "suggestions": ["Add more industry-specific keywords related to frontend frameworks like React or Vue.", "Quantify achievements in experience using metrics or KPIs.", "Include a professional email address and location for better ATS visibility.", "Highlight certifications or relevant courses under education."], "strengths": ["Strong career progression with increasing responsibility.", "Experience section demonstrates impactful contributions.", "Layout is clean and easy to parse for automated systems."]}}"""

        try:
            response = self.client.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    'temperature': 0.2,
                    'top_p': 0.9,
                    'num_predict': 800,
                    'stop': ['\\n\\n']
                }
            )
            
            response_text = response['response'].strip()
            logger.info(f"ATS scoring response: {response_text[:200]}...")
            
            # Try to extract JSON from response
            json_match = re.search(r'\\{.*\\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                parsed_data = json.loads(json_str)
                
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
                logger.warning("No valid JSON found in ATS scoring response")
                return self._fallback_ats_scoring(sections)
                
        except Exception as e:
            logger.error(f"Error in ATS scoring: {e}")
            return self._fallback_ats_scoring(sections)

    def _fallback_ats_scoring(self, sections: List[ResumeSection]) -> ATSScore:
        """Fallback ATS scoring if AI fails"""
        logger.info("Using fallback ATS scoring")
        
        # Simple rule-based scoring
        has_contact = any('email' in section.content.lower() or 'phone' in section.content.lower() 
                         for section in sections)
        has_experience = any('experience' in section.title.lower() or 'work' in section.title.lower() 
                            for section in sections)
        has_skills = any('skill' in section.title.lower() for section in sections)
        has_education = any('education' in section.title.lower() or 'degree' in section.content.lower() 
                           for section in sections)
        
        total_words = sum(len(section.content.split()) for section in sections)
        
        # Calculate scores
        contact_score = 12 if has_contact else 8
        experience_score = 20 if has_experience else 15
        skills_score = 18 if has_skills else 12
        education_score = 8 if has_education else 5
        format_score = 20 if total_words > 100 else 15
        
        overall_score = contact_score + experience_score + skills_score + education_score + format_score
        
        return ATSScore(
            overall_score=min(overall_score, 100),
            category_scores={
                'format_structure': format_score,
                'keywords_skills': skills_score,
                'experience_relevance': experience_score,
                'contact_info': contact_score,
                'education_credentials': education_score
            },
            suggestions=[
                'Add more quantifiable achievements to experience section',
                'Include industry-specific keywords and technical skills',
                'Ensure complete contact information is provided',
                'Consider adding relevant certifications or education details'
            ],
            strengths=[
                'Resume follows standard professional format',
                'Content is well-organized and readable'
            ]
        )

    async def analyze_complete_resume(self, raw_text: str, filename: str) -> CompleteResumeAnalysis:
        """Complete resume analysis: extract sections and score ATS in one workflow"""
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
