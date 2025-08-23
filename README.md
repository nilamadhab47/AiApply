# 🚀 AI Apply - Neural Resume Architect

An AI-powered resume builder and job application platform that transforms your career documents into professional, ATS-optimized resumes while providing intelligent job matching and application insights.

![AI Apply Banner](public/builder.jpg)

## 🌟 Product Overview

AI Apply is a comprehensive resume optimization and job application platform that leverages artificial intelligence to help job seekers create professional resumes, analyze job compatibility, and discover relevant opportunities. Built with modern web technologies and powered by local AI models for privacy and performance.

### 🎯 Key Value Propositions

- **AI-Powered Resume Analysis**: Deep analysis using local Mistral 7B model
- **ATS Score Optimization**: Real-time feedback to beat Applicant Tracking Systems
- **Smart Job Matching**: AI-driven job discovery from multiple platforms
- **Professional Templates**: Beautiful, industry-standard resume designs
- **Privacy-First**: All AI processing happens locally, your data stays secure
- **Modern Interface**: Dark-themed, responsive design with smooth animations

## ✨ Features

### 🔍 **Resume Analysis & Optimization**
- **AI-Powered Parsing**: Extract and analyze resume content using advanced NLP
- **ATS Compatibility Scoring**: Real-time feedback on ATS optimization
- **Section-by-Section Analysis**: Detailed insights for each resume section
- **Improvement Suggestions**: AI-generated recommendations for enhancement
- **Skills Gap Analysis**: Identify missing skills for target roles

### 🎨 **Professional Template System**
- **Multiple Design Options**: Professional, modern, creative, and executive templates
- **PDF Generation**: High-quality PDF output with pixel-perfect rendering
- **Template Marketplace**: Curated collection of industry-specific designs
- **One-Click Application**: Apply templates instantly to your content
- **Custom Branding**: Personalize templates with your style preferences

### 🤖 **AI Job Discovery**
- **Multi-Platform Search**: Aggregate jobs from LinkedIn, Indeed, Glassdoor, and more
- **Smart Matching**: AI-powered compatibility scoring based on your profile
- **Real-Time Analysis**: Live job market insights and salary information
- **Application Tracking**: Monitor your job applications and responses
- **Company Intelligence**: Detailed company profiles and culture insights

### 🔐 **Privacy & Security**
- **Local AI Processing**: Mistral 7B runs locally via Ollama
- **Secure Authentication**: NextAuth.js with multiple provider support
- **Data Privacy**: Your resume data never leaves your device during AI analysis
- **Encrypted Storage**: Secure handling of sensitive career information

### 🎯 **User Experience**
- **Dark Mode Interface**: Modern, eye-friendly design inspired by professional tools
- **Responsive Design**: Perfect experience across desktop, tablet, and mobile
- **Real-Time Updates**: Live preview and instant feedback
- **Smooth Animations**: Polished interactions with Framer Motion
- **Intuitive Navigation**: Clean, organized interface for effortless use

## 🛠 Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Shadcn/ui** - Modern component library

### Backend
- **FastAPI** - High-performance Python web framework
- **NextAuth.js** - Authentication and session management
- **Ollama** - Local AI model serving
- **Mistral 7B** - Advanced language model for resume analysis

### AI & Processing
- **PyMuPDF** - PDF text extraction and processing
- **python-docx** - Word document handling
- **ReportLab** - Professional PDF generation
- **Pydantic** - Data validation and serialization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Ollama installed locally
- Mistral 7B model downloaded

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nilamadhab47/AiApply.git
   cd AiApply
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Set up Python backend**
   ```bash
   cd document-parser-service
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Install Ollama and Mistral 7B**
   ```bash
   # Install Ollama (macOS)
   brew install ollama
   
   # Download Mistral 7B model
   ollama pull mistral:7b
   ```

5. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

### Development

1. **Start the Python backend**
   ```bash
   cd document-parser-service
   source venv/bin/activate
   python main.py
   ```

2. **Start the Next.js frontend**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
AI-Apply/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── login/            # Authentication
│   ├── resume-sections/  # Resume editor
│   └── templates/        # Template marketplace
├── components/           # React components
│   ├── sections/        # Landing page sections
│   ├── templates/       # Template-related components
│   └── ui/             # Reusable UI components
├── document-parser-service/ # Python FastAPI backend
│   ├── main.py         # FastAPI application
│   ├── ollama_resume_analyzer.py # AI analysis
│   └── simple_pdf_generator.py  # PDF generation
├── lib/                # Utility libraries
├── public/             # Static assets
└── utils/              # Helper functions
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Ollama](https://ollama.ai/) for local AI model serving
- [Mistral AI](https://mistral.ai/) for the powerful language model
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first styling
- [Framer Motion](https://www.framer.com/motion/) for smooth animations

## 📞 Support

- 📧 Email: support@aiapply.dev
- 🐛 Issues: [GitHub Issues](https://github.com/nilamadhab47/AiApply/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/nilamadhab47/AiApply/discussions)

---

**Made with ❤️ by the AI Apply team**
