export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          last_active: string | null
          name: string
          role: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          email: string
          id: string
          last_active?: string | null
          name: string
          role: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          email?: string
          id?: string
          last_active?: string | null
          name?: string
          role?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
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
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
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
    },
  },
} as const
