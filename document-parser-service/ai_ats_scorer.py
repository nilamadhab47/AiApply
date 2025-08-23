"""
AI-powered ATS scoring module using OpenRouter API for genuine resume analysis
"""

import json
import httpx
import os
from typing import List, Dict, Any
from pydantic import BaseModel

class ATSScore(BaseModel):
    overall_score: int
    category_scores: Dict[str, int]
    suggestions: List[str]
    strengths: List[str]

class ResumeSection(BaseModel):
    title: str
    content: str
    type: str

class AIATSScorer:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY") or "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"
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        
    async def analyze_resume(self, sections: List[ResumeSection]) -> ATSScore:
        """
        Analyze resume using AI for genuine ATS scoring and suggestions
        """
        if not self.api_key:
            print("Warning: No OpenRouter API key found, using enhanced fallback analysis")
            return await self._enhanced_fallback_analysis(sections)
        
        try:
            # Prepare resume content for AI analysis
            resume_content = "\n\n".join([
                f"**{section.title}**\n{section.content}"
                for section in sections
            ])
            
            # Create comprehensive ATS analysis prompt
            prompt = f"""You are an expert ATS (Applicant Tracking System) analyst and HR professional with 10+ years of experience. Analyze this resume and provide a detailed, honest assessment based on real ATS compatibility factors.

RESUME CONTENT:
{resume_content}

Provide a comprehensive ATS analysis considering:

1. **ATS Parsing Ability**: How well will automated systems read this resume?
2. **Keyword Optimization**: Industry-relevant terms and technical skills
3. **Format & Structure**: Professional layout, clear sections, readability
4. **Content Quality**: Quantifiable achievements, action verbs, relevance
5. **Completeness**: All essential sections and contact information

**SCORING CRITERIA:**
- Overall Score: 0-100 (be honest and realistic)
- Category Scores (each 0-25 points):
  * format_structure: Layout, sections, ATS-friendly formatting
  * keywords_skills: Industry keywords, technical skills, relevance
  * experience_relevance: Work history quality, achievements, impact
  * contact_info: Complete professional contact details
  * education_credentials: Educational background relevance

**ANALYSIS REQUIREMENTS:**
- Be specific and actionable in suggestions
- Consider current job market standards
- Focus on ATS compatibility issues
- Provide genuine insights, not generic advice
- Limit to 4 most impactful suggestions
- Highlight 2-3 genuine strengths

Respond ONLY in this exact JSON format:
{{
  "overall_score": <number 0-100>,
  "category_scores": {{
    "format_structure": <number 0-25>,
    "keywords_skills": <number 0-25>,
    "experience_relevance": <number 0-25>,
    "contact_info": <number 0-25>,
    "education_credentials": <number 0-25>
  }},
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>", "<actionable suggestion 4>"]
}}"""

            # Make API call to OpenRouter
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://aiappy.com",
                "X-Title": "AiAppy Resume Builder"
            }
            
            payload = {
                "model": "anthropic/claude-3.5-sonnet",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 2500,
                "temperature": 0.2  # Lower temperature for more consistent analysis
            }
            
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.post(
                    self.base_url,
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    result = response.json()
                    ai_response = result['choices'][0]['message']['content']
                    
                    # Parse AI response
                    try:
                        # Extract JSON from AI response
                        import re
                        
                        # Try to find JSON block
                        json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                        if json_match:
                            json_str = json_match.group()
                            ai_analysis = json.loads(json_str)
                            
                            # Validate and sanitize the response
                            return ATSScore(
                                overall_score=max(0, min(100, ai_analysis.get('overall_score', 70))),
                                category_scores={
                                    "format_structure": max(0, min(25, ai_analysis.get('category_scores', {}).get('format_structure', 15))),
                                    "keywords_skills": max(0, min(25, ai_analysis.get('category_scores', {}).get('keywords_skills', 15))),
                                    "experience_relevance": max(0, min(25, ai_analysis.get('category_scores', {}).get('experience_relevance', 15))),
                                    "contact_info": max(0, min(25, ai_analysis.get('category_scores', {}).get('contact_info', 12))),
                                    "education_credentials": max(0, min(25, ai_analysis.get('category_scores', {}).get('education_credentials', 13)))
                                },
                                suggestions=ai_analysis.get('suggestions', [
                                    "Add more quantifiable achievements with specific metrics",
                                    "Include more industry-specific keywords and technical skills",
                                    "Ensure all contact information is complete and professional",
                                    "Use action verbs to start each bullet point in experience section"
                                ])[:4],  # Limit to 4 suggestions
                                strengths=ai_analysis.get('strengths', [
                                    "Professional resume structure",
                                    "Clear section organization"
                                ])[:3]  # Limit to 3 strengths
                            )
                            
                    except (json.JSONDecodeError, KeyError, ValueError) as e:
                        print(f"Error parsing AI response: {e}")
                        print(f"AI Response: {ai_response[:500]}...")
                        
                else:
                    print(f"OpenRouter API error: {response.status_code}")
                    if response.status_code == 401:
                        print("API key authentication failed")
                    elif response.status_code == 429:
                        print("Rate limit exceeded")
                    else:
                        print(f"Response: {response.text[:200]}...")
        
        except Exception as e:
            print(f"Error in AI ATS analysis: {e}")
        
        # Fallback to enhanced rule-based analysis
        print("Using enhanced fallback analysis")
        return await self._enhanced_fallback_analysis(sections)
    
    async def _enhanced_fallback_analysis(self, sections: List[ResumeSection]) -> ATSScore:
        """
        Enhanced rule-based analysis when AI is unavailable
        """
        try:
            category_scores = {
                "format_structure": 0,
                "keywords_skills": 0,
                "experience_relevance": 0,
                "contact_info": 0,
                "education_credentials": 0
            }
            
            section_types = [section.type for section in sections]
            all_text = ' '.join([section.content.lower() for section in sections])
            
            # Format & Structure (25 points)
            if 'personal' in section_types:
                category_scores["format_structure"] += 8
            if any(t in section_types for t in ['summary', 'objective']):
                category_scores["format_structure"] += 7
            if 4 <= len(sections) <= 8:
                category_scores["format_structure"] += 10
            
            # Keywords & Skills (25 points)
            if 'skills' in section_types:
                skills_section = next((s for s in sections if s.type == 'skills'), None)
                if skills_section and len(skills_section.content.split()) > 10:
                    category_scores["keywords_skills"] += 15
            
            # Enhanced keyword detection
            tech_keywords = ['python', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 'git', 'java', 'c++', 'html', 'css', 'api', 'rest', 'agile', 'scrum']
            business_keywords = ['management', 'leadership', 'strategy', 'analysis', 'project', 'team', 'client', 'sales', 'marketing', 'operations']
            
            keyword_count = sum(1 for keyword in tech_keywords + business_keywords if keyword in all_text)
            category_scores["keywords_skills"] += min(10, keyword_count)
            
            # Experience Relevance (25 points)
            if 'experience' in section_types:
                experience_section = next((s for s in sections if s.type == 'experience'), None)
                if experience_section:
                    exp_content = experience_section.content.lower()
                    
                    # Time indicators
                    if any(word in exp_content for word in ['years', 'year', 'months', '2020', '2021', '2022', '2023', '2024']):
                        category_scores["experience_relevance"] += 8
                    
                    # Action verbs
                    action_verbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed', 'improved', 'increased', 'delivered', 'built']
                    if any(verb in exp_content for verb in action_verbs):
                        category_scores["experience_relevance"] += 8
                    
                    # Quantifiable results
                    if any(char in exp_content for char in ['%', '$', '#']) or any(word in exp_content for word in ['million', 'thousand', 'percent', 'increased', 'reduced', 'improved']):
                        category_scores["experience_relevance"] += 9
            
            # Contact Info (25 points)
            personal_section = next((s for s in sections if s.type == 'personal'), None)
            if personal_section:
                contact_content = personal_section.content.lower()
                
                if '@' in contact_content and '.' in contact_content:
                    category_scores["contact_info"] += 8
                if any(char in contact_content for char in ['+', '(', '-']) or 'phone' in contact_content:
                    category_scores["contact_info"] += 8
                if 'linkedin' in contact_content:
                    category_scores["contact_info"] += 5
                if any(platform in contact_content for platform in ['github', 'portfolio', 'website']):
                    category_scores["contact_info"] += 4
            
            # Education Credentials (25 points)
            if 'education' in section_types:
                education_section = next((s for s in sections if s.type == 'education'), None)
                if education_section:
                    edu_content = education_section.content.lower()
                    
                    if any(degree in edu_content for degree in ['bachelor', 'master', 'phd', 'doctorate']):
                        category_scores["education_credentials"] += 15
                    elif any(degree in edu_content for degree in ['associate', 'diploma', 'certificate']):
                        category_scores["education_credentials"] += 10
                    
                    if any(word in edu_content for word in ['university', 'college', 'institute']):
                        category_scores["education_credentials"] += 5
                    
                    if any(word in edu_content for word in ['gpa', 'honors', 'magna', 'summa', 'dean']):
                        category_scores["education_credentials"] += 5
            
            overall_score = sum(category_scores.values())
            
            # Generate targeted suggestions
            suggestions = []
            strengths = []
            
            if category_scores["contact_info"] < 15:
                suggestions.append("Add complete contact information including professional email, phone number, and LinkedIn profile")
            if category_scores["keywords_skills"] < 15:
                suggestions.append("Include more industry-relevant keywords and technical skills to improve ATS compatibility")
            if category_scores["experience_relevance"] < 15:
                suggestions.append("Add quantifiable achievements with specific metrics (e.g., 'Increased sales by 25%', 'Led team of 8')")
            if category_scores["format_structure"] < 15:
                suggestions.append("Improve resume structure with clear section headers and consistent formatting")
            
            # Add strengths
            if category_scores["contact_info"] >= 20:
                strengths.append("Complete and professional contact information")
            if category_scores["experience_relevance"] >= 20:
                strengths.append("Strong work experience with quantifiable achievements")
            if category_scores["keywords_skills"] >= 20:
                strengths.append("Good technical and industry keyword coverage")
            if category_scores["format_structure"] >= 20:
                strengths.append("Well-structured and organized resume format")
            
            # Ensure minimum content
            if len(suggestions) < 3:
                additional_suggestions = [
                    "Use action verbs to start bullet points in your experience section",
                    "Tailor your resume keywords to match specific job descriptions",
                    "Consider adding a professional summary highlighting your key strengths",
                    "Include relevant certifications or professional development courses"
                ]
                for suggestion in additional_suggestions:
                    if suggestion not in suggestions:
                        suggestions.append(suggestion)
                        if len(suggestions) >= 4:
                            break
            
            if not strengths:
                strengths = ["Professional resume structure", "Clear section organization"]
            
            return ATSScore(
                overall_score=min(100, overall_score),
                category_scores=category_scores,
                suggestions=suggestions[:4],
                strengths=strengths[:3]
            )
            
        except Exception as e:
            print(f"Error in fallback analysis: {e}")
            return ATSScore(
                overall_score=70,
                category_scores={
                    "format_structure": 15,
                    "keywords_skills": 15,
                    "experience_relevance": 15,
                    "contact_info": 12,
                    "education_credentials": 13
                },
                suggestions=[
                    "Optimize resume format for better ATS compatibility",
                    "Include more relevant industry keywords and technical skills",
                    "Add quantifiable achievements to your experience section",
                    "Ensure all contact information is complete and professional"
                ],
                strengths=["Professional resume structure", "Clear section organization"]
            )
