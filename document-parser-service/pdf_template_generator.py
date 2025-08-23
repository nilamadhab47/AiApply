"""
PDF Template Generator
Creates beautiful, professional PDF resumes from extracted data using HTML/CSS templates
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import weasyprint
from jinja2 import Environment, FileSystemLoader, Template
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFTemplateGenerator:
    """Generates professional PDF resumes from template data"""
    
    def __init__(self, templates_dir: str = "pdf_templates"):
        self.templates_dir = templates_dir
        self.ensure_templates_directory()
        self.jinja_env = Environment(loader=FileSystemLoader(self.templates_dir))
        
    def ensure_templates_directory(self):
        """Create templates directory if it doesn't exist"""
        if not os.path.exists(self.templates_dir):
            os.makedirs(self.templates_dir)
            logger.info(f"Created templates directory: {self.templates_dir}")
    
    def generate_pdf_resume(self, template_name: str, resume_data: Dict[str, Any]) -> bytes:
        """Generate PDF resume from template and data"""
        try:
            # Load HTML template
            html_template = self.jinja_env.get_template(f"{template_name}.html")
            
            # Render HTML with data
            html_content = html_template.render(**resume_data)
            
            # Convert HTML to PDF
            pdf_bytes = weasyprint.HTML(string=html_content, base_url=self.templates_dir).write_pdf()
            
            logger.info(f"Generated PDF resume using template: {template_name}")
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generating PDF with template {template_name}: {e}")
            # Fallback to basic template
            return self._generate_basic_pdf(resume_data)
    
    def _generate_basic_pdf(self, resume_data: Dict[str, Any]) -> bytes:
        """Generate basic PDF when template fails"""
        basic_html = self._create_basic_html_template(resume_data)
        pdf_bytes = weasyprint.HTML(string=basic_html).write_pdf()
        logger.info("Generated basic fallback PDF")
        return pdf_bytes
    
    def _create_basic_html_template(self, data: Dict[str, Any]) -> str:
        """Create basic HTML template as fallback"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: 'Arial', sans-serif;
                    margin: 40px;
                    line-height: 1.6;
                    color: #333;
                }}
                .header {{
                    text-align: center;
                    border-bottom: 2px solid #2c3e50;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }}
                .name {{
                    font-size: 28px;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }}
                .contact {{
                    font-size: 14px;
                    color: #666;
                }}
                .section {{
                    margin-bottom: 25px;
                }}
                .section-title {{
                    font-size: 18px;
                    font-weight: bold;
                    color: #2c3e50;
                    border-bottom: 1px solid #bdc3c7;
                    padding-bottom: 5px;
                    margin-bottom: 15px;
                }}
                .experience-item, .education-item {{
                    margin-bottom: 15px;
                }}
                .job-title {{
                    font-weight: bold;
                    color: #34495e;
                }}
                .company {{
                    font-style: italic;
                    color: #7f8c8d;
                }}
                .duration {{
                    float: right;
                    color: #95a5a6;
                }}
                .skills {{
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }}
                .skill-tag {{
                    background: #ecf0f1;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="name">{data.get('full_name', 'Your Name')}</div>
                <div class="contact">
                    {data.get('email', '')} • {data.get('phone', '')} • {data.get('address', '')}
                </div>
            </div>
            
            {f'<div class="section"><div class="section-title">Professional Summary</div><p>{data.get("summary", "")}</p></div>' if data.get('summary') else ''}
            
            <div class="section">
                <div class="section-title">Experience</div>
                {''.join([f'''
                <div class="experience-item">
                    <div class="job-title">{exp.get("title", "")}</div>
                    <div class="company">{exp.get("company", "")}</div>
                    <div class="duration">{exp.get("duration", "")}</div>
                    <p>{exp.get("description", "")}</p>
                </div>
                ''' for exp in data.get('experience', [])])}
            </div>
            
            <div class="section">
                <div class="section-title">Skills</div>
                <div class="skills">
                    {''.join([f'<span class="skill-tag">{skill}</span>' for skill in data.get('skills', [])])}
                </div>
            </div>
        </body>
        </html>
        """
    
    def create_professional_templates(self):
        """Create professional PDF templates"""
        logger.info("Creating professional PDF templates...")
        
        # Create Professional Template
        self._create_professional_template()
        
        # Create Modern Template
        self._create_modern_template()
        
        # Create Executive Template
        self._create_executive_template()
        
        # Create Creative Template
        self._create_creative_template()
        
        logger.info("Professional PDF templates created successfully")
    
    def _create_professional_template(self):
        """Create professional template"""
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #2d3748;
            background: white;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
            min-height: 297mm;
        }
        
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #4a5568;
            margin-bottom: 25px;
        }
        
        .name {
            font-size: 26px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .contact-info {
            font-size: 11px;
            color: #718096;
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .section {
            margin-bottom: 22px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #2d3748;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
            margin-bottom: 12px;
        }
        
        .summary {
            font-size: 11px;
            line-height: 1.6;
            text-align: justify;
            color: #4a5568;
        }
        
        .experience-item {
            margin-bottom: 16px;
            page-break-inside: avoid;
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
        }
        
        .job-title {
            font-size: 12px;
            font-weight: 600;
            color: #2d3748;
        }
        
        .duration {
            font-size: 10px;
            color: #718096;
            font-weight: 500;
        }
        
        .company {
            font-size: 11px;
            color: #4a5568;
            font-weight: 500;
            margin-bottom: 6px;
        }
        
        .job-description {
            font-size: 10px;
            line-height: 1.5;
            color: #4a5568;
            text-align: justify;
        }
        
        .job-description ul {
            margin-left: 15px;
            margin-top: 4px;
        }
        
        .job-description li {
            margin-bottom: 2px;
        }
        
        .education-item {
            margin-bottom: 10px;
        }
        
        .degree {
            font-size: 11px;
            font-weight: 600;
            color: #2d3748;
        }
        
        .school {
            font-size: 10px;
            color: #4a5568;
            font-weight: 500;
        }
        
        .education-year {
            font-size: 10px;
            color: #718096;
            float: right;
        }
        
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 6px;
            margin-top: 8px;
        }
        
        .skill-item {
            background: #f7fafc;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            color: #4a5568;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        
        .two-column {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 25px;
        }
        
        .main-content {
            /* Main column styles */
        }
        
        .sidebar {
            /* Sidebar styles */
        }
        
        @media print {
            .container {
                padding: 10mm;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="name">{{ full_name or 'Your Name' }}</div>
            <div class="contact-info">
                {% if email %}<span>{{ email }}</span>{% endif %}
                {% if phone %}<span>{{ phone }}</span>{% endif %}
                {% if address %}<span>{{ address }}</span>{% endif %}
                {% if linkedin %}<span>{{ linkedin }}</span>{% endif %}
            </div>
        </div>
        
        {% if summary %}
        <div class="section">
            <div class="section-title">Professional Summary</div>
            <div class="summary">{{ summary }}</div>
        </div>
        {% endif %}
        
        {% if experience %}
        <div class="section">
            <div class="section-title">Professional Experience</div>
            {% for exp in experience %}
            <div class="experience-item">
                <div class="job-header">
                    <div class="job-title">{{ exp.title or '' }}</div>
                    <div class="duration">{{ exp.duration or '' }}</div>
                </div>
                <div class="company">{{ exp.company or '' }}</div>
                <div class="job-description">{{ exp.description or '' }}</div>
            </div>
            {% endfor %}
        </div>
        {% endif %}
        
        {% if education %}
        <div class="section">
            <div class="section-title">Education</div>
            {% for edu in education %}
            <div class="education-item">
                <div class="degree">{{ edu.degree or '' }}</div>
                <div class="school">{{ edu.school or '' }}</div>
                <div class="education-year">{{ edu.year or '' }}</div>
                <div style="clear: both;"></div>
            </div>
            {% endfor %}
        </div>
        {% endif %}
        
        {% if skills %}
        <div class="section">
            <div class="section-title">Technical Skills</div>
            <div class="skills-grid">
                {% for skill in skills[:15] %}
                <div class="skill-item">{{ skill }}</div>
                {% endfor %}
            </div>
        </div>
        {% endif %}
    </div>
</body>
</html>
        """
        
        template_path = os.path.join(self.templates_dir, 'professional.html')
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        logger.info(f"Created professional template: {template_path}")
    
    def _create_modern_template(self):
        """Create modern template with sidebar layout"""
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Poppins', sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #2d3748;
            background: white;
        }
        
        .container {
            display: grid;
            grid-template-columns: 35% 65%;
            min-height: 297mm;
            max-width: 210mm;
            margin: 0 auto;
        }
        
        .sidebar {
            background: #2d3748;
            color: white;
            padding: 20px;
        }
        
        .main-content {
            padding: 20px 25px;
        }
        
        .profile-section {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .name {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
            color: white;
        }
        
        .title {
            font-size: 11px;
            color: #a0aec0;
            margin-bottom: 15px;
            font-weight: 400;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 9px;
            color: #cbd5e0;
        }
        
        .sidebar-section {
            margin-bottom: 20px;
        }
        
        .sidebar-title {
            font-size: 12px;
            font-weight: 600;
            color: white;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .skill-item {
            background: #4a5568;
            padding: 4px 8px;
            margin: 3px 0;
            border-radius: 3px;
            font-size: 9px;
            display: inline-block;
            margin-right: 5px;
        }
        
        .main-section {
            margin-bottom: 20px;
        }
        
        .main-title {
            font-size: 14px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: relative;
        }
        
        .main-title::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 30px;
            height: 2px;
            background: #4299e1;
        }
        
        .summary {
            font-size: 10px;
            line-height: 1.6;
            text-align: justify;
            color: #4a5568;
        }
        
        .experience-item {
            margin-bottom: 15px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .experience-item:last-child {
            border-bottom: none;
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 3px;
        }
        
        .job-title {
            font-size: 11px;
            font-weight: 600;
            color: #2d3748;
        }
        
        .duration {
            font-size: 9px;
            color: #718096;
            background: #f7fafc;
            padding: 2px 6px;
            border-radius: 10px;
        }
        
        .company {
            font-size: 10px;
            color: #4299e1;
            font-weight: 500;
            margin-bottom: 5px;
        }
        
        .job-description {
            font-size: 9px;
            line-height: 1.5;
            color: #4a5568;
            text-align: justify;
        }
        
        .education-item {
            margin-bottom: 8px;
        }
        
        .degree {
            font-size: 10px;
            font-weight: 600;
            color: #2d3748;
        }
        
        .school {
            font-size: 9px;
            color: #4a5568;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="sidebar">
            <div class="profile-section">
                <div class="name">{{ full_name or 'Your Name' }}</div>
                <div class="title">Professional</div>
            </div>
            
            <div class="sidebar-section">
                <div class="sidebar-title">Contact</div>
                {% if email %}<div class="contact-item">{{ email }}</div>{% endif %}
                {% if phone %}<div class="contact-item">{{ phone }}</div>{% endif %}
                {% if address %}<div class="contact-item">{{ address }}</div>{% endif %}
                {% if linkedin %}<div class="contact-item">{{ linkedin }}</div>{% endif %}
            </div>
            
            {% if skills %}
            <div class="sidebar-section">
                <div class="sidebar-title">Skills</div>
                {% for skill in skills[:12] %}
                <div class="skill-item">{{ skill }}</div>
                {% endfor %}
            </div>
            {% endif %}
            
            {% if education %}
            <div class="sidebar-section">
                <div class="sidebar-title">Education</div>
                {% for edu in education %}
                <div class="education-item">
                    <div class="degree">{{ edu.degree or '' }}</div>
                    <div class="school">{{ edu.school or '' }}</div>
                </div>
                {% endfor %}
            </div>
            {% endif %}
        </div>
        
        <div class="main-content">
            {% if summary %}
            <div class="main-section">
                <div class="main-title">About Me</div>
                <div class="summary">{{ summary }}</div>
            </div>
            {% endif %}
            
            {% if experience %}
            <div class="main-section">
                <div class="main-title">Experience</div>
                {% for exp in experience %}
                <div class="experience-item">
                    <div class="job-header">
                        <div class="job-title">{{ exp.title or '' }}</div>
                        <div class="duration">{{ exp.duration or '' }}</div>
                    </div>
                    <div class="company">{{ exp.company or '' }}</div>
                    <div class="job-description">{{ exp.description or '' }}</div>
                </div>
                {% endfor %}
            </div>
            {% endif %}
        </div>
    </div>
</body>
</html>
        """
        
        template_path = os.path.join(self.templates_dir, 'modern.html')
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        logger.info(f"Created modern template: {template_path}")
    
    def _create_executive_template(self):
        """Create executive template"""
        # Executive template with sophisticated design
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+Pro:wght@300;400;600&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Source Sans Pro', sans-serif;
            font-size: 11px;
            line-height: 1.5;
            color: #1a202c;
            background: white;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            min-height: 297mm;
        }
        
        .header {
            text-align: center;
            padding-bottom: 25px;
            border-bottom: 3px solid #1a202c;
            margin-bottom: 30px;
        }
        
        .name {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .executive-title {
            font-size: 14px;
            color: #4a5568;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        
        .contact-info {
            font-size: 11px;
            color: #718096;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .section {
            margin-bottom: 28px;
        }
        
        .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 15px;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 50px;
            height: 2px;
            background: #d69e2e;
        }
        
        .summary {
            font-size: 12px;
            line-height: 1.7;
            text-align: justify;
            color: #2d3748;
            font-weight: 400;
        }
        
        .experience-item {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 5px;
        }
        
        .job-title {
            font-size: 14px;
            font-weight: 600;
            color: #1a202c;
        }
        
        .duration {
            font-size: 11px;
            color: #718096;
            font-weight: 600;
            background: #f7fafc;
            padding: 3px 8px;
            border-radius: 4px;
        }
        
        .company {
            font-size: 12px;
            color: #d69e2e;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .job-description {
            font-size: 11px;
            line-height: 1.6;
            color: #2d3748;
            text-align: justify;
        }
        
        .achievements {
            margin-top: 6px;
            padding-left: 15px;
        }
        
        .achievement-item {
            margin-bottom: 3px;
            color: #4a5568;
            font-size: 10px;
        }
        
        .education-item {
            margin-bottom: 12px;
        }
        
        .degree {
            font-size: 12px;
            font-weight: 600;
            color: #1a202c;
        }
        
        .school {
            font-size: 11px;
            color: #4a5568;
            font-weight: 500;
        }
        
        .education-year {
            font-size: 10px;
            color: #718096;
            float: right;
        }
        
        .skills-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 8px;
            margin-top: 10px;
        }
        
        .skill-item {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            padding: 6px 10px;
            border-radius: 6px;
            font-size: 10px;
            color: #2d3748;
            text-align: center;
            border: 1px solid #e2e8f0;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="name">{{ full_name or 'Executive Name' }}</div>
            <div class="executive-title">Senior Executive</div>
            <div class="contact-info">
                {% if email %}<span>{{ email }}</span>{% endif %}
                {% if phone %}<span>{{ phone }}</span>{% endif %}
                {% if address %}<span>{{ address }}</span>{% endif %}
                {% if linkedin %}<span>{{ linkedin }}</span>{% endif %}
            </div>
        </div>
        
        {% if summary %}
        <div class="section">
            <div class="section-title">Executive Summary</div>
            <div class="summary">{{ summary }}</div>
        </div>
        {% endif %}
        
        {% if experience %}
        <div class="section">
            <div class="section-title">Leadership Experience</div>
            {% for exp in experience %}
            <div class="experience-item">
                <div class="job-header">
                    <div class="job-title">{{ exp.title or '' }}</div>
                    <div class="duration">{{ exp.duration or '' }}</div>
                </div>
                <div class="company">{{ exp.company or '' }}</div>
                <div class="job-description">{{ exp.description or '' }}</div>
            </div>
            {% endfor %}
        </div>
        {% endif %}
        
        {% if education %}
        <div class="section">
            <div class="section-title">Education</div>
            {% for edu in education %}
            <div class="education-item">
                <div class="degree">{{ edu.degree or '' }}</div>
                <div class="school">{{ edu.school or '' }}</div>
                <div class="education-year">{{ edu.year or '' }}</div>
                <div style="clear: both;"></div>
            </div>
            {% endfor %}
        </div>
        {% endif %}
        
        {% if skills %}
        <div class="section">
            <div class="section-title">Core Competencies</div>
            <div class="skills-section">
                {% for skill in skills[:12] %}
                <div class="skill-item">{{ skill }}</div>
                {% endfor %}
            </div>
        </div>
        {% endif %}
    </div>
</body>
</html>
        """
        
        template_path = os.path.join(self.templates_dir, 'executive.html')
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        logger.info(f"Created executive template: {template_path}")
    
    def _create_creative_template(self):
        """Create creative template with vibrant design"""
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #2d3748;
            background: white;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            min-height: 297mm;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="25" cy="25" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="3" fill="rgba(255,255,255,0.05)"/><circle cx="50" cy="10" r="1.5" fill="rgba(255,255,255,0.08)"/></svg>');
            animation: float 20s infinite linear;
        }
        
        @keyframes float {
            0% { transform: translateX(-50px); }
            100% { transform: translateX(50px); }
        }
        
        .name {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }
        
        .creative-title {
            font-size: 12px;
            font-weight: 500;
            opacity: 0.9;
            margin-bottom: 15px;
            position: relative;
            z-index: 1;
        }
        
        .contact-info {
            font-size: 10px;
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 25px;
        }
        
        .section {
            margin-bottom: 22px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 12px;
            position: relative;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .section-title::before {
            content: '';
            position: absolute;
            left: -15px;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 2px;
        }
        
        .summary {
            font-size: 11px;
            line-height: 1.6;
            text-align: justify;
            color: #4a5568;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .experience-item {
            margin-bottom: 18px;
            background: #ffffff;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border-left: 4px solid #764ba2;
        }
        
        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 5px;
        }
        
        .job-title {
            font-size: 12px;
            font-weight: 700;
            color: #2d3748;
        }
        
        .duration {
            font-size: 9px;
            color: white;
            background: linear-gradient(135deg, #667eea, #764ba2);
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: 600;
        }
        
        .company {
            font-size: 10px;
            color: #667eea;
            font-weight: 600;
            margin-bottom: 6px;
        }
        
        .job-description {
            font-size: 10px;
            line-height: 1.5;
            color: #4a5568;
            text-align: justify;
        }
        
        .education-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }
        
        .education-item {
            background: #f8fafc;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .degree {
            font-size: 11px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 3px;
        }
        
        .school {
            font-size: 10px;
            color: #4a5568;
            font-weight: 500;
        }
        
        .skills-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
        }
        
        .skill-item {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="name">{{ full_name or 'Creative Professional' }}</div>
            <div class="creative-title">Creative Professional</div>
            <div class="contact-info">
                {% if email %}<span>{{ email }}</span>{% endif %}
                {% if phone %}<span>{{ phone }}</span>{% endif %}
                {% if address %}<span>{{ address }}</span>{% endif %}
                {% if linkedin %}<span>{{ linkedin }}</span>{% endif %}
            </div>
        </div>
        
        <div class="content">
            {% if summary %}
            <div class="section">
                <div class="section-title">About</div>
                <div class="summary">{{ summary }}</div>
            </div>
            {% endif %}
            
            {% if experience %}
            <div class="section">
                <div class="section-title">Experience</div>
                {% for exp in experience %}
                <div class="experience-item">
                    <div class="job-header">
                        <div class="job-title">{{ exp.title or '' }}</div>
                        <div class="duration">{{ exp.duration or '' }}</div>
                    </div>
                    <div class="company">{{ exp.company or '' }}</div>
                    <div class="job-description">{{ exp.description or '' }}</div>
                </div>
                {% endfor %}
            </div>
            {% endif %}
            
            {% if education %}
            <div class="section">
                <div class="section-title">Education</div>
                <div class="education-section">
                    {% for edu in education %}
                    <div class="education-item">
                        <div class="degree">{{ edu.degree or '' }}</div>
                        <div class="school">{{ edu.school or '' }}</div>
                    </div>
                    {% endfor %}
                </div>
            </div>
            {% endif %}
            
            {% if skills %}
            <div class="section">
                <div class="section-title">Skills</div>
                <div class="skills-container">
                    {% for skill in skills[:15] %}
                    <div class="skill-item">{{ skill }}</div>
                    {% endfor %}
                </div>
            </div>
            {% endif %}
        </div>
    </div>
</body>
</html>
        """
        
        template_path = os.path.join(self.templates_dir, 'creative.html')
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        logger.info(f"Created creative template: {template_path}")
    
    def get_available_templates(self) -> List[str]:
        """Get list of available PDF template names"""
        if not os.path.exists(self.templates_dir):
            return []
        
        templates = []
        for file in os.listdir(self.templates_dir):
            if file.endswith('.html'):
                templates.append(file.replace('.html', ''))
        
        return templates
