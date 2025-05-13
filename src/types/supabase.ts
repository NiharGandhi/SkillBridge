export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          created_at: string
          student_id: string
          opportunity_id: string
          status: "pending" | "reviewing" | "accepted" | "rejected"
          cover_letter: string | null
          resume_url: string | null
          company_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          student_id: string
          opportunity_id: string
          status?: "pending" | "reviewing" | "accepted" | "rejected"
          cover_letter?: string | null
          resume_url?: string | null
          company_id?: string
        }
        Update: {
          id?: string
          created_at?: string
          student_id?: string
          opportunity_id?: string
          status?: "pending" | "reviewing" | "accepted" | "rejected"
          cover_letter?: string | null
          resume_url?: string | null
          company_id?: string
        }
      }
      certificates: {
        Row: {
          id: string
          created_at: string
          user_id: string
          course_id: string
          issue_date: string
          certificate_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          course_id: string
          issue_date?: string
          certificate_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          course_id?: string
          issue_date?: string
          certificate_url?: string | null
        }
      }
      companies: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          logo_url: string | null
          website: string | null
          industry: string | null
          size: string | null
          location: string | null
          verified: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          industry?: string | null
          size?: string | null
          location?: string | null
          verified?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          industry?: string | null
          size?: string | null
          location?: string | null
          verified?: boolean
        }
      }
      courses: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          category: string
          skill_level: "beginner" | "intermediate" | "advanced"
          duration_minutes: number
          thumbnail_url: string | null
          is_ai_generated: boolean
          instructor_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          category: string
          skill_level: "beginner" | "intermediate" | "advanced"
          duration_minutes: number
          thumbnail_url?: string | null
          is_ai_generated?: boolean
          instructor_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          category?: string
          skill_level?: "beginner" | "intermediate" | "advanced"
          duration_minutes?: number
          thumbnail_url?: string | null
          is_ai_generated?: boolean
          instructor_id?: string | null
        }
      }
      opportunities: {
        Row: {
          id: string
          created_at: string
          company_id: string
          title: string
          description: string
          location: string | null
          type: "internship" | "project" | "job"
          skills_required: string[]
          application_deadline: string | null
          status: "active" | "closed" | "draft"
          remote: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          company_id: string
          title: string
          description: string
          location?: string | null
          type: "internship" | "project" | "job"
          skills_required: string[]
          application_deadline?: string | null
          status?: "active" | "closed" | "draft"
          remote?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          company_id?: string
          title?: string
          description?: string
          location?: string | null
          type?: "internship" | "project" | "job"
          skills_required?: string[]
          application_deadline?: string | null
          status?: "active" | "closed" | "draft"
          remote?: boolean
        }
      }
      progress: {
        Row: {
          id: string
          created_at: string
          user_id: string
          course_id: string
          progress_percentage: number
          last_module_completed: number
          status: "not_started" | "in_progress" | "completed"
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string
          course_id?: string
          progress_percentage?: number
          last_module_completed?: number
          status?: "not_started" | "in_progress" | "completed"
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          course_id?: string
          progress_percentage?: number
          last_module_completed?: number
          status?: "not_started" | "in_progress" | "completed"
        }
      }
      chapters: {
        Row: {
          id: string
          created_at: string
          course_id: string
          title: string
          content: string
          duration_minutes: number
          chapter_order: number
        }
        Insert: {
          id?: string
          created_at: string
          course_id?: string
          title: string
          content: string
          duration_minutes: number
          chapter_order: number
        }
      }
      quiz_questions: {
        Row: {
          id: string
          created_at: string
          quiz_id: string
          question: string
          options: string[]
          correct_answer: string
          question_order: number
        }
        Insert: {
          id?: string
          created_at?: string
          quiz_id?: string
          question?: string
          options: string[]
          correct_answer: string
          question_order: number
        }
        Update: {
          id?: string
          created_at?: string
          quiz_id?: string
          question?: string
          options: string[]
          correct_answer: string
          question_order: number
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          user_id: string
          role: "student" | "employer"
          first_name: string
          last_name: string
          bio: string | null
          avatar_url: string | null
          education: Json | null
          skills: string[] | null
          experience: Json | null
          portfolio_url: string | null
          resume_url: string | null
          company_id: string | null
          onboarding_completed: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          role: "student" | "employer"
          first_name: string
          last_name: string
          bio?: string | null
          avatar_url?: string | null
          education?: Json | null
          skills?: string[] | null
          experience?: Json | null
          portfolio_url?: string | null
          resume_url?: string | null
          company_id?: string | null
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          role?: "student" | "employer"
          first_name?: string
          last_name?: string
          bio?: string | null
          avatar_url?: string | null
          education?: Json | null
          skills?: string[] | null
          experience?: Json | null
          portfolio_url?: string | null
          resume_url?: string | null
          company_id?: string | null
          onboarding_completed?: boolean
        }
      }
      skills: {
        Row: {
          id: string
          created_at: string
          name: string
          category: string
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          category: string
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          category?: string
          description?: string | null
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
        }
        Insert: {
          id: string
          created_at?: string
          email: string
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
        }
      }
    }
  }
}
