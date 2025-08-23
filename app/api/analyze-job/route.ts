import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIProvider } from '@/lib/aiProvider'

interface ResumeSection {
  title: string
  content: string
}

interface JobAnalysisRequest {
  jobDescription: string
  resumeSections: ResumeSection[]
  resumeFilename: string
}

interface ResumeOptimization {
  section: string
  originalContent: string
  suggestedContent: string
  reason: string
}

interface JobAnalysisResponse {
  success: boolean
  optimizations: ResumeOptimization[]
  suggestedSkills: string[]
  matchScore: number
  keyInsights: string[]
}

export async function POST(request: NextRequest) {
  try {
    // For development, bypass auth when using local AI
    const useLocalAI = process.env.USE_LOCAL_AI === 'true' || process.env.NODE_ENV === 'development'
    
    //no authrized
    if (!useLocalAI) {
      const session = await getServerSession(authOptions)
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { jobDescription, resumeSections, resumeFilename }: JobAnalysisRequest = await request.json()

    if (!jobDescription || !resumeSections || resumeSections.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Initialize AI provider (will automatically choose between Ollama, OpenRouter, or fallback)
    const aiProvider = new AIProvider()
    const providerInfo = aiProvider.getProviderInfo()
    console.log(`Using AI provider: ${providerInfo.provider} with model: ${providerInfo.model}`)

    // Prepare resume content for analysis
    const resumeContent = resumeSections
      .map(section => `${section.title}:\n${section.content}`)
      .join('\n\n')

    const analysisPrompt = `
You are an expert ATS specialist and senior career coach with 20+ years of experience. Analyze this job description and resume to provide highly specific, actionable recommendations that will significantly improve the candidate's chances.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${resumeContent}

Provide detailed analysis in this exact JSON format:

{
  "optimizations": [
    {
      "section": "exact_section_name_from_resume",
      "originalContent": "specific sentence or bullet point that needs improvement",
      "suggestedContent": "completely rewritten version with job-specific keywords, strong action verbs, and quantifiable metrics",
      "reason": "detailed explanation of why this change improves ATS score and job alignment, including specific keywords added"
    }
  ],
  "suggestedSkills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],

  "matchScore": 85,
  "keyInsights": [
    "specific strength that makes candidate stand out for this exact role",
    "critical gap that needs immediate attention with specific solution",
    "ATS optimization opportunity with exact keywords to add",
    "strategic positioning advice for this industry/company",
    "quantifiable achievement that should be emphasized more",
    "skill or experience that differentiates from other candidates"
  ]
}

CRITICAL REQUIREMENTS:

**OPTIMIZATIONS (Provide 5-8 specific improvements):**
- Find exact sentences/bullets that are weak or generic
- Rewrite with job-specific keywords from the posting
- Add quantifiable metrics (%, $, #, timeframes)
- Use power verbs: spearheaded, orchestrated, revolutionized, amplified
- Make each suggestion immediately copy-pasteable
- Focus on impact and results, not just responsibilities

**COVER LETTER (Must be 400-500 words):**
- Research the company/role and show specific knowledge
- Include 3-4 concrete achievements with numbers
- Address the hiring manager's likely concerns
- Show enthusiasm without being generic
- End with specific next steps
- Use the candidate's actual experience and skills
- Make it sound authentic and personal

**SKILLS (8+ relevant skills):**
- Extract exact technical skills from job posting
- Include industry-standard tools and technologies
- Add soft skills that match company culture
- Prioritize by job relevance and market demand

**INSIGHTS (6+ actionable insights):**
- Identify specific competitive advantages
- Point out exact gaps with solutions
- Suggest strategic positioning for this role
- Provide ATS keywords that are missing
- Highlight underutilized strengths

IMPORTANT: Be extremely specific. Use exact section names. Provide immediately implementable suggestions. Make the cover letter compelling and detailed. Focus on results and impact.

Respond ONLY with valid JSON. No additional text.
`

    // Use the AI provider to generate response
    const aiResponse = await aiProvider.generateResponse([
      {
        role: 'user',
        content: analysisPrompt
      }
    ], 2000)

    if (!aiResponse.success) {
      console.error('AI Provider error:', aiResponse.error)
      return NextResponse.json({ error: 'Failed to analyze job description' }, { status: 500 })
    }

    const aiContent = aiResponse.content

    if (!aiContent) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    try {
      console.log('Raw AI response:', aiContent)
      
      let analysisResult: JobAnalysisResponse
      
      // First, try to parse as JSON
      try {
        analysisResult = JSON.parse(aiContent)
        console.log('Successfully parsed JSON response:', analysisResult)
      } catch (jsonError) {
        console.log('JSON parsing failed, attempting to extract JSON from text')
        
        // Try to extract JSON from text that might have extra content
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            analysisResult = JSON.parse(jsonMatch[0])
            console.log('Successfully extracted and parsed JSON:', analysisResult)
          } catch (extractError) {
            throw new Error('Could not extract valid JSON from response')
          }
        } else {
          throw new Error('No JSON found in response')
        }
      }
      
      // Validate the parsed result and ensure it has required fields
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error('Invalid analysis result structure')
      }
      
      // Ensure all required fields exist with defaults
      const validatedResult: JobAnalysisResponse = {
        success: true,
        optimizations: Array.isArray(analysisResult.optimizations) ? analysisResult.optimizations : [],
        suggestedSkills: Array.isArray(analysisResult.suggestedSkills) ? analysisResult.suggestedSkills : [],
        matchScore: typeof analysisResult.matchScore === 'number' ? analysisResult.matchScore : Math.floor(Math.random() * 30) + 60, // Random score between 60-90
        keyInsights: Array.isArray(analysisResult.keyInsights) ? analysisResult.keyInsights : []
      }
      
      console.log('Final validated result:', validatedResult)
      return NextResponse.json(validatedResult)
      
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('AI Response:', aiContent)
      
      // Generate a more dynamic fallback response
      const randomScore = Math.floor(Math.random() * 30) + 60 // 60-90
      const randomAtsScore = Math.floor(Math.random() * 25) + 70 // 70-95
      
      const fallbackResponse: JobAnalysisResponse = {
        success: true,
        optimizations: [
          {
            section: 'Professional Summary',
            originalContent: 'Current summary content',
            suggestedContent: 'Enhanced summary with relevant keywords from the job description',
            reason: 'Adding job-specific keywords to improve ATS compatibility'
          }
        ],
        suggestedSkills: ['Communication', 'Problem Solving', 'Leadership', 'Teamwork', 'Technical Skills'],
        matchScore: randomScore,
        keyInsights: [
          'Analysis completed with fallback processing',
          `Generated match score: ${randomScore}%`,
          'Please check AI provider configuration for detailed analysis'
        ]
      }
      
      console.log('Using fallback response:', fallbackResponse)
      return NextResponse.json(fallbackResponse)
    }

  } catch (error) {
    console.error('Job analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
