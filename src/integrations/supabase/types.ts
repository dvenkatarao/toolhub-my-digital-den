export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      files: {
        Row: {
          created_at: string | null
          folder: string | null
          id: string
          is_favorite: boolean | null
          name: string
          size: number
          storage_path: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          folder?: string | null
          id?: string
          is_favorite?: boolean | null
          name: string
          size: number
          storage_path: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          folder?: string | null
          id?: string
          is_favorite?: boolean | null
          name?: string
          size?: number
          storage_path?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          plan: string | null
          updated_at: string
          usage: Json | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan?: string | null
          updated_at?: string
          usage?: Json | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan?: string | null
          updated_at?: string
          usage?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      reminder_emails: {
        Row: {
          id: string
          next_reminder_at: string | null
          reminder_type: string | null
          sent_at: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          next_reminder_at?: string | null
          reminder_type?: string | null
          sent_at?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          next_reminder_at?: string | null
          reminder_type?: string | null
          sent_at?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_emails_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_files: {
        Row: {
          created_at: string | null
          file_id: string
          id: string
          owner_id: string
          permission: string
          shared_with_email: string
        }
        Insert: {
          created_at?: string | null
          file_id: string
          id?: string
          owner_id: string
          permission: string
          shared_with_email: string
        }
        Update: {
          created_at?: string | null
          file_id?: string
          id?: string
          owner_id?: string
          permission?: string
          shared_with_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_files_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_usage: {
        Row: {
          created_at: string | null
          id: string
          last_used_date: string | null
          subscription_id: string | null
          updated_at: string | null
          usage_count: number | null
          usage_notes: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used_date?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_notes?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used_date?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_notes?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          billing_cycle: string | null
          category: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          id: string
          last_billing_date: string | null
          next_billing_date: string | null
          notes: string | null
          original_email_date: string | null
          raw_email_body: string | null
          raw_email_subject: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          vendor: string
        }
        Insert: {
          amount?: number | null
          billing_cycle?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          last_billing_date?: string | null
          next_billing_date?: string | null
          notes?: string | null
          original_email_date?: string | null
          raw_email_body?: string | null
          raw_email_subject?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vendor: string
        }
        Update: {
          amount?: number | null
          billing_cycle?: string | null
          category?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          id?: string
          last_billing_date?: string | null
          next_billing_date?: string | null
          notes?: string | null
          original_email_date?: string | null
          raw_email_body?: string | null
          raw_email_subject?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          vendor?: string
        }
        Relationships: []
      }
      temp_email_forwards: {
        Row: {
          cloudflare_rule_id: string | null
          created_at: string | null
          destination_email: string
          expires_at: string | null
          id: string
          is_verified: boolean | null
          temp_email_name: string
          user_id: string
          verification_token: string | null
        }
        Insert: {
          cloudflare_rule_id?: string | null
          created_at?: string | null
          destination_email: string
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          temp_email_name: string
          user_id: string
          verification_token?: string | null
        }
        Update: {
          cloudflare_rule_id?: string | null
          created_at?: string | null
          destination_email?: string
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          temp_email_name?: string
          user_id?: string
          verification_token?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          enable_monthly_stats: boolean | null
          enable_usage_reminders: boolean | null
          enable_weekly_summary: boolean | null
          notification_email: string | null
          reminder_days_before: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enable_monthly_stats?: boolean | null
          enable_usage_reminders?: boolean | null
          enable_weekly_summary?: boolean | null
          notification_email?: string | null
          reminder_days_before?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enable_monthly_stats?: boolean | null
          enable_usage_reminders?: boolean | null
          enable_weekly_summary?: boolean | null
          notification_email?: string | null
          reminder_days_before?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_tracking_emails: {
        Row: {
          created_at: string | null
          id: string
          tracking_email: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          tracking_email: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          tracking_email?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      verified_destination_emails: {
        Row: {
          cloudflare_email_id: string
          created_at: string | null
          email: string
          id: string
          is_verified: boolean | null
          user_id: string
        }
        Insert: {
          cloudflare_email_id: string
          created_at?: string | null
          email: string
          id?: string
          is_verified?: boolean | null
          user_id: string
        }
        Update: {
          cloudflare_email_id?: string
          created_at?: string | null
          email?: string
          id?: string
          is_verified?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      subscription_stats: {
        Row: {
          active_count: number | null
          categories: string[] | null
          monthly_spend: number | null
          total_subscriptions: number | null
          trial_count: number | null
          user_id: string | null
          yearly_spend: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_user_premium: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      delete_forward_record: {
        Args: { forward_id: string }
        Returns: undefined
      }
      get_expired_forwards: {
        Args: Record<PropertyKey, never>
        Returns: {
          cloudflare_rule_id: string
          id: string
          temp_email_name: string
        }[]
      }
      get_total_active_forwards: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_verified_emails: {
        Args: { user_uuid: string }
        Returns: {
          email: string
          id: string
          is_verified: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
