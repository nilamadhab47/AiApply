"""
Simple PDF Template Generator
Creates beautiful, professional PDF resumes using reportlab (no system dependencies)
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import Color, black, white, HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Frame, PageTemplate
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.platypus.tableofcontents import TableOfContents
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimplePDFGenerator:
    """Generates professional PDF resumes using reportlab"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
        
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        
        # Header name style
        self.styles.add(ParagraphStyle(
            name='ResumeHeader',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#2d3748'),
            alignment=TA_CENTER,
            spaceAfter=6,
            fontName='Helvetica-Bold'
        ))
        
        # Contact info style
        self.styles.add(ParagraphStyle(
            name='ContactInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=HexColor('#718096'),
            alignment=TA_CENTER,
            spaceAfter=20,
            fontName='Helvetica'
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=HexColor('#2d3748'),
            fontName='Helvetica-Bold',
            spaceAfter=8,
            spaceBefore=15,
            borderWidth=1,
            borderColor=HexColor('#e2e8f0'),
            borderPadding=5
        ))
        
        # Job title style
        self.styles.add(ParagraphStyle(
            name='JobTitle',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=HexColor('#2d3748'),
            fontName='Helvetica-Bold',
            spaceAfter=2
        ))
        
        # Company style
        self.styles.add(ParagraphStyle(
            name='Company',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=HexColor('#4a5568'),
            fontName='Helvetica-Bold',
            spaceAfter=4
        ))
        
        # Duration style
        self.styles.add(ParagraphStyle(
            name='Duration',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=HexColor('#718096'),
            fontName='Helvetica',
            alignment=TA_RIGHT,
            spaceAfter=6
        ))
        
        # Description style
        self.styles.add(ParagraphStyle(
            name='Description',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=HexColor('#4a5568'),
            fontName='Helvetica',
            spaceAfter=12,
            alignment=TA_JUSTIFY
        ))
        
        # Skills style
        self.styles.add(ParagraphStyle(
            name='Skills',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=HexColor('#4a5568'),
            fontName='Helvetica',
            spaceAfter=8
        ))
        
        # Summary style
        self.styles.add(ParagraphStyle(
            name='Summary',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=HexColor('#4a5568'),
            fontName='Helvetica',
            spaceAfter=15,
            alignment=TA_JUSTIFY,
            leftIndent=10,
            rightIndent=10
        ))
    
    def generate_pdf_resume(self, template_name: str, resume_data: Dict[str, Any]) -> bytes:
        """Generate PDF resume from template and data"""
        try:
            if template_name == 'modern':
                return self._generate_modern_pdf(resume_data)
            elif template_name == 'executive':
                return self._generate_executive_pdf(resume_data)
            elif template_name == 'creative':
                return self._generate_creative_pdf(resume_data)
            else:  # Default to professional
                return self._generate_professional_pdf(resume_data)
                
        except Exception as e:
            logger.error(f"Error generating PDF with template {template_name}: {e}")
            # Fallback to basic template
            return self._generate_basic_pdf(resume_data)
    
    def _generate_professional_pdf(self, data: Dict[str, Any]) -> bytes:
        """Generate professional template PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=72, leftMargin=72, 
                              topMargin=72, bottomMargin=18)
        
        story = []
        
        # Header
        story.append(Paragraph(data.get('full_name', 'Your Name'), self.styles['ResumeHeader']))
        
        # Contact Info
        contact_parts = []
        if data.get('email'): contact_parts.append(data['email'])
        if data.get('phone'): contact_parts.append(data['phone'])
        if data.get('address'): contact_parts.append(data['address'])
        if data.get('linkedin'): contact_parts.append(data['linkedin'])
        
        if contact_parts:
            contact_text = ' • '.join(contact_parts)
            story.append(Paragraph(contact_text, self.styles['ContactInfo']))
        
        # Professional Summary
        if data.get('summary'):
            story.append(Paragraph('PROFESSIONAL SUMMARY', self.styles['SectionHeader']))
            story.append(Paragraph(data['summary'], self.styles['Summary']))
        
        # Experience
        experience = data.get('experience', [])
        if experience:
            story.append(Paragraph('PROFESSIONAL EXPERIENCE', self.styles['SectionHeader']))
            
            for exp in experience:
                # Create table for job header (title/company on left, duration on right)
                job_data = [
                    [Paragraph(f"<b>{exp.get('title', '')}</b>", self.styles['JobTitle']),
                     Paragraph(exp.get('duration', ''), self.styles['Duration'])]
                ]
                
                job_table = Table(job_data, colWidths=[4*inch, 2*inch])
                job_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                    ('TOPPADDING', (0, 0), (-1, -1), 0),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                ]))
                story.append(job_table)
                
                # Company
                if exp.get('company'):
                    story.append(Paragraph(exp['company'], self.styles['Company']))
                
                # Description
                if exp.get('description'):
                    story.append(Paragraph(exp['description'], self.styles['Description']))
        
        # Education
        education = data.get('education', [])
        if education:
            story.append(Paragraph('EDUCATION', self.styles['SectionHeader']))
            
            for edu in education:
                edu_text = f"<b>{edu.get('degree', '')}</b>"
                if edu.get('school'):
                    edu_text += f" - {edu['school']}"
                if edu.get('year'):
                    edu_text += f" ({edu['year']})"
                
                story.append(Paragraph(edu_text, self.styles['Description']))
        
        # Skills
        skills = data.get('skills', [])
        if skills:
            story.append(Paragraph('TECHNICAL SKILLS', self.styles['SectionHeader']))
            skills_text = ' • '.join(skills[:15])  # Limit to 15 skills
            story.append(Paragraph(skills_text, self.styles['Skills']))
        
        doc.build(story)
        buffer.seek(0)
        
        logger.info("Generated professional PDF resume")
        return buffer.getvalue()
    
    def _generate_modern_pdf(self, data: Dict[str, Any]) -> bytes:
        """Generate modern template with blue accents"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=72, leftMargin=72, 
                              topMargin=72, bottomMargin=18)
        
        # Modern color scheme
        blue_accent = HexColor('#4299e1')
        
        # Custom styles for modern template
        modern_header = ParagraphStyle(
            name='ModernHeader',
            parent=self.styles['ResumeHeader'],
            textColor=blue_accent,
            fontSize=26
        )
        
        modern_section = ParagraphStyle(
            name='ModernSection',
            parent=self.styles['SectionHeader'],
            textColor=blue_accent,
            fontSize=13,
            borderColor=blue_accent
        )
        
        story = []
        
        # Header with modern styling
        story.append(Paragraph(data.get('full_name', 'Your Name'), modern_header))
        story.append(Paragraph('<i>Modern Professional</i>', self.styles['ContactInfo']))
        
        # Contact Info
        contact_parts = []
        if data.get('email'): contact_parts.append(data['email'])
        if data.get('phone'): contact_parts.append(data['phone'])
        if data.get('address'): contact_parts.append(data['address'])
        
        if contact_parts:
            contact_text = ' | '.join(contact_parts)
            story.append(Paragraph(contact_text, self.styles['ContactInfo']))
        
        # About section
        if data.get('summary'):
            story.append(Paragraph('ABOUT ME', modern_section))
            story.append(Paragraph(data['summary'], self.styles['Summary']))
        
        # Experience
        experience = data.get('experience', [])
        if experience:
            story.append(Paragraph('EXPERIENCE', modern_section))
            
            for exp in experience:
                job_data = [
                    [Paragraph(f"<b>{exp.get('title', '')}</b>", self.styles['JobTitle']),
                     Paragraph(f"<i>{exp.get('duration', '')}</i>", self.styles['Duration'])]
                ]
                
                job_table = Table(job_data, colWidths=[4*inch, 2*inch])
                job_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ]))
                story.append(job_table)
                
                if exp.get('company'):
                    company_style = ParagraphStyle(
                        name='ModernCompany',
                        parent=self.styles['Company'],
                        textColor=blue_accent
                    )
                    story.append(Paragraph(exp['company'], company_style))
                
                if exp.get('description'):
                    story.append(Paragraph(exp['description'], self.styles['Description']))
        
        # Skills and Education
        skills = data.get('skills', [])
        education = data.get('education', [])
        
        if skills:
            story.append(Paragraph('CORE SKILLS', modern_section))
            skills_text = ' • '.join(skills[:12])
            story.append(Paragraph(skills_text, self.styles['Skills']))
        
        if education:
            story.append(Paragraph('EDUCATION', modern_section))
            for edu in education:
                edu_text = f"<b>{edu.get('degree', '')}</b> - {edu.get('school', '')}"
                story.append(Paragraph(edu_text, self.styles['Description']))
        
        doc.build(story)
        buffer.seek(0)
        
        logger.info("Generated modern PDF resume")
        return buffer.getvalue()
    
    def _generate_executive_pdf(self, data: Dict[str, Any]) -> bytes:
        """Generate executive template with gold accents"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=72, leftMargin=72, 
                              topMargin=72, bottomMargin=18)
        
        # Executive color scheme
        gold_accent = HexColor('#d69e2e')
        dark_text = HexColor('#1a202c')
        
        # Executive styles
        exec_header = ParagraphStyle(
            name='ExecutiveHeader',
            parent=self.styles['ResumeHeader'],
            textColor=dark_text,
            fontSize=28,
            fontName='Helvetica-Bold'
        )
        
        exec_title = ParagraphStyle(
            name='ExecutiveTitle',
            parent=self.styles['ContactInfo'],
            fontSize=12,
            textColor=HexColor('#4a5568'),
            fontName='Helvetica-Bold'
        )
        
        exec_section = ParagraphStyle(
            name='ExecutiveSection',
            parent=self.styles['SectionHeader'],
            textColor=dark_text,
            fontSize=15,
            borderColor=gold_accent,
            borderWidth=2
        )
        
        story = []
        
        # Executive header
        story.append(Paragraph(data.get('full_name', 'Executive Name'), exec_header))
        story.append(Paragraph('SENIOR EXECUTIVE', exec_title))
        
        # Contact with elegant formatting
        contact_parts = []
        if data.get('email'): contact_parts.append(data['email'])
        if data.get('phone'): contact_parts.append(data['phone'])
        if data.get('address'): contact_parts.append(data['address'])
        
        if contact_parts:
            contact_text = ' • '.join(contact_parts)
            story.append(Paragraph(contact_text, self.styles['ContactInfo']))
        
        # Executive Summary
        if data.get('summary'):
            story.append(Paragraph('EXECUTIVE SUMMARY', exec_section))
            exec_summary_style = ParagraphStyle(
                name='ExecutiveSummary',
                parent=self.styles['Summary'],
                fontSize=12,
                leftIndent=20,
                rightIndent=20
            )
            story.append(Paragraph(data['summary'], exec_summary_style))
        
        # Leadership Experience
        experience = data.get('experience', [])
        if experience:
            story.append(Paragraph('LEADERSHIP EXPERIENCE', exec_section))
            
            for exp in experience:
                # Executive job styling
                job_title_style = ParagraphStyle(
                    name='ExecutiveJobTitle',
                    parent=self.styles['JobTitle'],
                    fontSize=13,
                    textColor=dark_text
                )
                
                company_style = ParagraphStyle(
                    name='ExecutiveCompany',
                    parent=self.styles['Company'],
                    textColor=gold_accent,
                    fontSize=12
                )
                
                job_data = [
                    [Paragraph(f"<b>{exp.get('title', '')}</b>", job_title_style),
                     Paragraph(exp.get('duration', ''), self.styles['Duration'])]
                ]
                
                job_table = Table(job_data, colWidths=[4*inch, 2*inch])
                job_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 0),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ]))
                story.append(job_table)
                
                if exp.get('company'):
                    story.append(Paragraph(exp['company'], company_style))
                
                if exp.get('description'):
                    story.append(Paragraph(exp['description'], self.styles['Description']))
        
        # Education and Core Competencies
        education = data.get('education', [])
        skills = data.get('skills', [])
        
        if education:
            story.append(Paragraph('EDUCATION', exec_section))
            for edu in education:
                edu_text = f"<b>{edu.get('degree', '')}</b> - {edu.get('school', '')}"
                if edu.get('year'):
                    edu_text += f" ({edu['year']})"
                story.append(Paragraph(edu_text, self.styles['Description']))
        
        if skills:
            story.append(Paragraph('CORE COMPETENCIES', exec_section))
            skills_text = ' • '.join(skills[:10])
            story.append(Paragraph(skills_text, self.styles['Skills']))
        
        doc.build(story)
        buffer.seek(0)
        
        logger.info("Generated executive PDF resume")
        return buffer.getvalue()
    
    def _generate_creative_pdf(self, data: Dict[str, Any]) -> bytes:
        """Generate creative template with vibrant colors"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=72, leftMargin=72, 
                              topMargin=72, bottomMargin=18)
        
        # Creative color scheme
        purple_accent = HexColor('#667eea')
        pink_accent = HexColor('#764ba2')
        
        # Creative styles
        creative_header = ParagraphStyle(
            name='CreativeHeader',
            parent=self.styles['ResumeHeader'],
            textColor=purple_accent,
            fontSize=26,
            fontName='Helvetica-Bold'
        )
        
        creative_section = ParagraphStyle(
            name='CreativeSection',
            parent=self.styles['SectionHeader'],
            textColor=purple_accent,
            fontSize=14,
            borderColor=pink_accent,
            borderWidth=2,
            borderPadding=8
        )
        
        story = []
        
        # Creative header
        story.append(Paragraph(data.get('full_name', 'Creative Professional'), creative_header))
        story.append(Paragraph('<i>Creative Professional</i>', self.styles['ContactInfo']))
        
        # Contact info
        contact_parts = []
        if data.get('email'): contact_parts.append(data['email'])
        if data.get('phone'): contact_parts.append(data['phone'])
        if data.get('address'): contact_parts.append(data['address'])
        
        if contact_parts:
            contact_text = ' • '.join(contact_parts)
            story.append(Paragraph(contact_text, self.styles['ContactInfo']))
        
        # Creative sections
        if data.get('summary'):
            story.append(Paragraph('ABOUT', creative_section))
            creative_summary = ParagraphStyle(
                name='CreativeSummary',
                parent=self.styles['Summary'],
                borderWidth=1,
                borderColor=HexColor('#e2e8f0'),
                borderPadding=10,
                backColor=HexColor('#f8fafc')
            )
            story.append(Paragraph(data['summary'], creative_summary))
        
        # Experience with creative styling
        experience = data.get('experience', [])
        if experience:
            story.append(Paragraph('EXPERIENCE', creative_section))
            
            for exp in experience:
                # Creative job card effect
                job_data = [
                    [Paragraph(f"<b>{exp.get('title', '')}</b>", self.styles['JobTitle']),
                     Paragraph(exp.get('duration', ''), self.styles['Duration'])]
                ]
                
                job_table = Table(job_data, colWidths=[4*inch, 2*inch])
                job_table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('BACKGROUND', (0, 0), (-1, -1), HexColor('#f8fafc')),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ]))
                story.append(job_table)
                
                if exp.get('company'):
                    company_style = ParagraphStyle(
                        name='CreativeCompany',
                        parent=self.styles['Company'],
                        textColor=purple_accent,
                        fontSize=11
                    )
                    story.append(Paragraph(exp['company'], company_style))
                
                if exp.get('description'):
                    story.append(Paragraph(exp['description'], self.styles['Description']))
        
        # Skills and Education
        skills = data.get('skills', [])
        education = data.get('education', [])
        
        if skills:
            story.append(Paragraph('SKILLS', creative_section))
            # Create colorful skill tags effect
            skills_text = ' • '.join(skills[:12])
            skills_style = ParagraphStyle(
                name='CreativeSkills',
                parent=self.styles['Skills'],
                textColor=purple_accent,
                fontName='Helvetica-Bold'
            )
            story.append(Paragraph(skills_text, skills_style))
        
        if education:
            story.append(Paragraph('EDUCATION', creative_section))
            for edu in education:
                edu_text = f"<b>{edu.get('degree', '')}</b> - {edu.get('school', '')}"
                story.append(Paragraph(edu_text, self.styles['Description']))
        
        doc.build(story)
        buffer.seek(0)
        
        logger.info("Generated creative PDF resume")
        return buffer.getvalue()
    
    def _generate_basic_pdf(self, data: Dict[str, Any]) -> bytes:
        """Generate basic fallback PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, 
                              rightMargin=72, leftMargin=72, 
                              topMargin=72, bottomMargin=18)
        
        story = []
        
        # Basic header
        story.append(Paragraph(data.get('full_name', 'Your Name'), self.styles['ResumeHeader']))
        
        # Contact
        contact_parts = []
        if data.get('email'): contact_parts.append(data['email'])
        if data.get('phone'): contact_parts.append(data['phone'])
        
        if contact_parts:
            story.append(Paragraph(' | '.join(contact_parts), self.styles['ContactInfo']))
        
        # Summary
        if data.get('summary'):
            story.append(Paragraph('SUMMARY', self.styles['SectionHeader']))
            story.append(Paragraph(data['summary'], self.styles['Summary']))
        
        # Basic experience
        experience = data.get('experience', [])
        if experience:
            story.append(Paragraph('EXPERIENCE', self.styles['SectionHeader']))
            for exp in experience:
                story.append(Paragraph(f"<b>{exp.get('title', '')} - {exp.get('company', '')}</b>", self.styles['JobTitle']))
                if exp.get('description'):
                    story.append(Paragraph(exp['description'], self.styles['Description']))
        
        # Basic skills
        skills = data.get('skills', [])
        if skills:
            story.append(Paragraph('SKILLS', self.styles['SectionHeader']))
            story.append(Paragraph(', '.join(skills[:10]), self.styles['Skills']))
        
        doc.build(story)
        buffer.seek(0)
        
        logger.info("Generated basic fallback PDF resume")
        return buffer.getvalue()
    
    def get_available_templates(self) -> List[str]:
        """Get list of available PDF template names"""
        return ['professional', 'modern', 'executive', 'creative']
    
    def create_professional_templates(self):
        """For compatibility - templates are built-in"""
        logger.info("Professional PDF templates are built-in and ready to use")
        return True
