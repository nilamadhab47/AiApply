import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIProvider } from '@/lib/aiProvider'

interface ResumeSection {
  title: string
  content: string
  type?: string
}

interface CoverLetterRequest {
  jobDescription: string
  resumeSections: {
    sections: ResumeSection[]
  }
  applicantName: string
}

export async function POST(request: NextRequest) {
  try {
    // For development, bypass auth when using local AI
    const useLocalAI = process.env.USE_LOCAL_AI === 'true' || process.env.NODE_ENV === 'development'
    
    if (!useLocalAI) {
      const session = await getServerSession(authOptions)
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { jobDescription, resumeSections, applicantName }: CoverLetterRequest = await request.json()

    if (!jobDescription || !resumeSections?.sections || resumeSections.sections.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Initialize AI provider
    const aiProvider = new AIProvider()
    const providerInfo = aiProvider.getProviderInfo()
    console.log(`Using AI provider: ${providerInfo.provider} with model: ${providerInfo.model}`)

    // Extract key information from resume
    const personalInfo = resumeSections.sections.find(s => s.title === 'Personal Information')?.content || ''
    const experience = resumeSections.sections.find(s => s.title === 'Work Experience' || s.title === 'Experience')?.content || ''
    const skills = resumeSections.sections.find(s => s.title === 'Skills' || s.title === 'Technical Skills')?.content || ''
    const education = resumeSections.sections.find(s => s.title === 'Education')?.content || ''
    const projects = resumeSections.sections.find(s => s.title === 'Projects')?.content || ''

    // Extract applicant name from personal info if not provided
    const extractedName = applicantName || personalInfo.split('\n')[0]?.trim() || 'Applicant'

    const coverLetterPrompt = `You are an expert career coach and professional writer specializing in creating compelling, personalized cover letters that get interviews.

Here's a high-quality example of an excellent cover letter:

"""
Dear Hiring Manager,

I'm thrilled to apply for the Frontend Engineer role at Growstack. I discovered the position through LinkedIn and was immediately drawn to your mission of empowering small businesses through intuitive, scalable software. With a strong foundation in React, TypeScript, and modern design systems, I believe I can contribute meaningfully to your product's growth and user experience.

In my previous role at LenscorpAI, I led the development of a real-time analytics dashboard using Next.js and Framer Motion, which improved feature adoption by 35%. I also spearheaded the migration of legacy code to TypeScript, reducing runtime bugs by 60%. My contributions to internal UI libraries enabled faster prototyping and improved design consistency across 3+ teams. These experiences have taught me the importance of performance, accessibility, and clean architecture in fast-paced product environments.

Beyond technical skills, I bring a deep understanding of collaboration. Working alongside designers and product managers, I've refined features through user feedback loops and A/B testing. I take pride in writing testable, maintainable code and mentoring junior developers to uphold high engineering standards.

What excites me most about Growstack is your emphasis on elegant interfaces and your transparent engineering culture. I recently read about your "Design-in-Code" initiative on the company blog, and it resonated with my approach to UI development — bridging product thinking and engineering. I'm confident that my values and background align well with your team's ethos.

I'd love to bring my experience and energy to Growstack and contribute to building exceptional user experiences. I'm available to chat at your convenience and would appreciate the opportunity to further discuss how I can support your team's mission.

Thank you for your time and consideration.

Warm regards,  
Nilamadhab Senapati
"""

Use this as a reference to generate a new cover letter. Make it personalized, specific, and results-driven like the example.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE INFORMATION:
Name: ${extractedName}

Personal Information:
${personalInfo}

Work Experience:
${experience}

Skills:
${skills}

Education:
${education}

Projects:
${projects}

INSTRUCTIONS:
Create a compelling, personalized cover letter (400-600 words) that follows this structure:

1. **Opening Paragraph (80-100 words):**
   - Express genuine enthusiasm for the specific role and company
   - Mention how you found the position or your connection to the company
   - Brief overview of your most relevant qualification that matches the job
   - Create a hook that makes them want to read more

2. **Professional Experience Paragraph (120-150 words):**
   - Detail 3-4 most relevant achievements with specific metrics and numbers from the resume
   - Use strong action verbs (led, developed, implemented, improved, reduced, increased)
   - Connect each achievement directly to job requirements
   - Show progression and impact in your career

3. **Technical Skills & Expertise Paragraph (100-120 words):**
   - Highlight technical skills that directly match the job posting
   - Mention specific technologies, tools, and methodologies from both the job and resume
   - Provide concrete examples of how you've used these skills
   - Show depth of knowledge in relevant areas

4. **Company Knowledge & Cultural Fit Paragraph (100-120 words):**
   - Demonstrate research about the company, its mission, values, or recent developments
   - Explain why you're specifically interested in THIS company (not just any company)
   - Show how your values and approach align with theirs
   - Mention any insights about their industry, market, or challenges

5. **Value Proposition & Future Impact Paragraph (80-100 words):**
   - Clearly articulate what unique value you bring to the role
   - Address how you can solve their specific challenges
   - Show growth mindset and eagerness to contribute
   - Mention specific contributions you could make in the first 90 days

6. **Strong Closing Paragraph (50-70 words):**
   - Confident call-to-action requesting an interview
   - Mention your availability or next steps
   - Professional but warm closing
   - Thank them for their consideration

CRITICAL REQUIREMENTS:
- Use the candidate's actual experience, skills, and achievements from their resume
- Extract and incorporate relevant keywords from the job description
- Include specific metrics, numbers, and quantifiable results where possible
- Make it sound authentic and personal, not generic
- Ensure each paragraph flows naturally to the next
- Use professional but engaging language
- End with the candidate's actual name: "${extractedName}"
- Make every sentence add value and move the narrative forward

Generate ONLY the cover letter text, no additional commentary or formatting instructions.`

    // Generate the cover letter using AI
    const aiResponse = await aiProvider.generateResponse([
      {
        role: 'user',
        content: coverLetterPrompt
      }
    ], 1500) // Increased token limit for longer cover letters

    if (!aiResponse.success) {
      console.error('AI Provider error:', aiResponse.error)
      
      // Fallback cover letter with actual user data
      const fallbackCoverLetter = `Dear Hiring Manager,

I am writing to express my strong interest in this position. After reviewing the job description, I believe my background and experience align well with the requirements you've outlined.

${experience ? `In my professional experience, I have developed strong expertise in the areas mentioned in your posting. My background includes relevant experience that would allow me to contribute effectively to your team from day one.` : 'I am eager to bring my skills and enthusiasm to contribute to your team\'s success.'}

${skills ? `My technical skills include ${skills.split('\n').slice(0, 3).join(', ')}, which directly align with the technologies and tools mentioned in your job posting.` : 'I have developed strong technical and professional skills that would be valuable in this role.'}

I am particularly drawn to your organization because of its reputation and the opportunity to contribute to meaningful work. I believe my background and passion for excellence would make me a valuable addition to your team.

I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to your team's continued success. Thank you for considering my application.

Sincerely,
${extractedName}`

      return NextResponse.json({ 
        success: true,
        coverLetter: fallbackCoverLetter,
        usedFallback: true
      })
    }

    const coverLetter = aiResponse.content?.trim() || ''

    if (!coverLetter) {
      return NextResponse.json({ error: 'Failed to generate cover letter content' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      coverLetter: coverLetter,
      usedFallback: false
    })

  } catch (error) {
    console.error('Cover letter generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
