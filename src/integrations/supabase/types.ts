export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      deal_template_applications: {
        Row: {
          applied_at: string
          applied_by: string
          deal_id: string
          id: string
          notes: string | null
          template_version: string | null
        }
        Insert: {
          applied_at?: string
          applied_by: string
          deal_id: string
          id?: string
          notes?: string | null
          template_version?: string | null
        }
        Update: {
          applied_at?: string
          applied_by?: string
          deal_id?: string
          id?: string
          notes?: string | null
          template_version?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          company_name: string
          created_at: string
          created_by: string
          id: string
          name: string
          project_name: string
          target_close_date: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          project_name: string
          target_close_date?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          project_name?: string
          target_close_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      diligence_requests: {
        Row: {
          allow_file_upload: boolean
          allow_text_response: boolean
          assigned_to: string | null
          category: Database["public"]["Enums"]["request_category"]
          created_at: string
          created_by: string
          deal_id: string
          description: string | null
          due_date: string | null
          id: string
          period_end: string | null
          period_start: string | null
          period_text: string | null
          priority: Database["public"]["Enums"]["request_priority"]
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          allow_file_upload?: boolean
          allow_text_response?: boolean
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          created_at?: string
          created_by: string
          deal_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          period_text?: string | null
          priority?: Database["public"]["Enums"]["request_priority"]
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          allow_file_upload?: boolean
          allow_text_response?: boolean
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["request_category"]
          created_at?: string
          created_by?: string
          deal_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          period_text?: string | null
          priority?: Database["public"]["Enums"]["request_priority"]
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diligence_requests_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      diligence_responses: {
        Row: {
          id: string
          request_id: string
          submitted_at: string
          text_response: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          request_id: string
          submitted_at?: string
          text_response?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          request_id?: string
          submitted_at?: string
          text_response?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diligence_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "diligence_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          deal_id: string | null
          email: string
          id: string
          invitation_status: string | null
          invited_at: string | null
          invited_by: string | null
          last_active: string | null
          name: string
          organization: string | null
          role: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          email: string
          id: string
          invitation_status?: string | null
          invited_at?: string | null
          invited_by?: string | null
          last_active?: string | null
          name: string
          organization?: string | null
          role: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          email?: string
          id?: string
          invitation_status?: string | null
          invited_at?: string | null
          invited_by?: string | null
          last_active?: string | null
          name?: string
          organization?: string | null
          role?: string
        }
        Relationships: []
      }
      questionnaire_questions: {
        Row: {
          category: Database["public"]["Enums"]["questionnaire_category"]
          created_at: string
          created_by: string
          help_text: string | null
          id: string
          is_active: boolean
          is_required: boolean
          options: Json | null
          question_text: string
          question_type: Database["public"]["Enums"]["question_type"]
          responsible_party:
            | Database["public"]["Enums"]["responsible_party"]
            | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["questionnaire_category"]
          created_at?: string
          created_by: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          options?: Json | null
          question_text: string
          question_type?: Database["public"]["Enums"]["question_type"]
          responsible_party?:
            | Database["public"]["Enums"]["responsible_party"]
            | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["questionnaire_category"]
          created_at?: string
          created_by?: string
          help_text?: string | null
          id?: string
          is_active?: boolean
          is_required?: boolean
          options?: Json | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          responsible_party?:
            | Database["public"]["Enums"]["responsible_party"]
            | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      questionnaire_responses: {
        Row: {
          deal_id: string
          id: string
          question_id: string
          response_value: string | null
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          deal_id: string
          id?: string
          question_id: string
          response_value?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          deal_id?: string
          id?: string
          question_id?: string
          response_value?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_sessions: {
        Row: {
          completed_at: string | null
          current_question_id: string | null
          deal_id: string
          id: string
          is_completed: boolean
          last_updated: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_question_id?: string | null
          deal_id: string
          id?: string
          is_completed?: boolean
          last_updated?: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_question_id?: string | null
          deal_id?: string
          id?: string
          is_completed?: boolean
          last_updated?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_sessions_current_question_id_fkey"
            columns: ["current_question_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      request_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          request_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          request_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          request_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "diligence_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_documents: {
        Row: {
          box_file_id: string | null
          box_folder_id: string | null
          file_size: number
          file_type: string
          filename: string
          id: string
          is_sample_document: boolean
          request_id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          box_file_id?: string | null
          box_folder_id?: string | null
          file_size: number
          file_type: string
          filename: string
          id?: string
          is_sample_document?: boolean
          request_id: string
          storage_path: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          box_file_id?: string | null
          box_folder_id?: string | null
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          is_sample_document?: boolean
          request_id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "diligence_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_templates: {
        Row: {
          allow_file_upload: boolean
          allow_text_response: boolean
          category: Database["public"]["Enums"]["request_category"]
          created_at: string
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["request_priority"]
          sort_order: number | null
          title: string
          typical_period: string | null
          updated_at: string
        }
        Insert: {
          allow_file_upload?: boolean
          allow_text_response?: boolean
          category?: Database["public"]["Enums"]["request_category"]
          created_at?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          sort_order?: number | null
          title: string
          typical_period?: string | null
          updated_at?: string
        }
        Update: {
          allow_file_upload?: boolean
          allow_text_response?: boolean
          category?: Database["public"]["Enums"]["request_category"]
          created_at?: string
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          sort_order?: number | null
          title?: string
          typical_period?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_deals: {
        Row: {
          assigned_at: string
          assigned_by: string
          deal_id: string
          id: string
          role_in_deal: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          deal_id: string
          id?: string
          role_in_deal?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          deal_id?: string
          id?: string
          role_in_deal?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_deals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      log_security_event: {
        Args: { event_type: string; user_id: string; details?: Json }
        Returns: undefined
      }
      send_user_invitation: {
        Args: {
          user_email: string
          user_name: string
          deal_id: string
          deal_name: string
          invited_by_email: string
        }
        Returns: undefined
      }
    }
    Enums: {
      question_type:
        | "text"
        | "textarea"
        | "number"
        | "select"
        | "radio"
        | "checkbox"
        | "yes_no"
      questionnaire_category:
        | "Business Snapshot"
        | "Key Metrics"
        | "Service Mix"
        | "Sales"
        | "HR"
        | "Operational"
        | "Customer Experience"
        | "Marketing"
        | "Technology & Systems"
        | "Facilities & Equipment"
        | "Compliance/Insurance/Safety"
        | "Deal Specific"
      request_category:
        | "Financial"
        | "Legal"
        | "Operations"
        | "HR"
        | "IT"
        | "Environmental"
        | "Commercial"
        | "Other"
      request_priority: "high" | "medium" | "low"
      request_status: "pending" | "submitted" | "approved" | "rejected"
      responsible_party: "M&A" | "Ops"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      question_type: [
        "text",
        "textarea",
        "number",
        "select",
        "radio",
        "checkbox",
        "yes_no",
      ],
      questionnaire_category: [
        "Business Snapshot",
        "Key Metrics",
        "Service Mix",
        "Sales",
        "HR",
        "Operational",
        "Customer Experience",
        "Marketing",
        "Technology & Systems",
        "Facilities & Equipment",
        "Compliance/Insurance/Safety",
        "Deal Specific",
      ],
      request_category: [
        "Financial",
        "Legal",
        "Operations",
        "HR",
        "IT",
        "Environmental",
        "Commercial",
        "Other",
      ],
      request_priority: ["high", "medium", "low"],
      request_status: ["pending", "submitted", "approved", "rejected"],
      responsible_party: ["M&A", "Ops"],
    },
  },
} as const
