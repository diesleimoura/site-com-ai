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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          affiliate_active: boolean
          affiliate_code: string | null
          created_at: string
          custom_domain: string | null
          email: string | null
          id: string
          onboarded: boolean
          pix_key: string | null
          pix_key_type: string | null
          plan: string
          plan_expires_at: string | null
          searches_used_this_month: number
          sites_created_this_month: number
          slug: string | null
          updated_at: string
        }
        Insert: {
          affiliate_active?: boolean
          affiliate_code?: string | null
          created_at?: string
          custom_domain?: string | null
          email?: string | null
          id: string
          onboarded?: boolean
          pix_key?: string | null
          pix_key_type?: string | null
          plan?: string
          plan_expires_at?: string | null
          searches_used_this_month?: number
          sites_created_this_month?: number
          slug?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_active?: boolean
          affiliate_code?: string | null
          created_at?: string
          custom_domain?: string | null
          email?: string | null
          id?: string
          onboarded?: boolean
          pix_key?: string | null
          pix_key_type?: string | null
          plan?: string
          plan_expires_at?: string | null
          searches_used_this_month?: number
          sites_created_this_month?: number
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          expires_at: string | null
          id: string
          monthly_price: number
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          pix_code: string | null
          pix_qr_code: string | null
          setup_price: number
          site_id: string
          status: string
          tenant_id: string
          token: string
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          monthly_price?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          pix_code?: string | null
          pix_qr_code?: string | null
          setup_price?: number
          site_id: string
          status?: string
          tenant_id: string
          token: string
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          monthly_price?: number
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          pix_code?: string | null
          pix_qr_code?: string | null
          setup_price?: number
          site_id?: string
          status?: string
          tenant_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_searches: {
        Row: {
          cache_expires_at: string | null
          city: string
          created_at: string
          id: string
          radius_km: number
          results_cache: Json | null
          segment: string
          tenant_id: string
        }
        Insert: {
          cache_expires_at?: string | null
          city: string
          created_at?: string
          id?: string
          radius_km?: number
          results_cache?: Json | null
          segment: string
          tenant_id: string
        }
        Update: {
          cache_expires_at?: string | null
          city?: string
          created_at?: string
          id?: string
          radius_km?: number
          results_cache?: Json | null
          segment?: string
          tenant_id?: string
        }
        Relationships: []
      }
      site_generation_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          progress: number
          site_id: string
          status: string
          step: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          progress?: number
          site_id: string
          status?: string
          step?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          progress?: number
          site_id?: string
          status?: string
          step?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sites: {
        Row: {
          address: string | null
          ai_edits_count: number
          business_name: string
          city: string | null
          created_at: string
          google_place_id: string | null
          html_content: string | null
          id: string
          is_published: boolean
          logo_url: string | null
          monthly_price: number | null
          phone: string | null
          segment: string | null
          setup_price: number | null
          status: string
          tenant_id: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          ai_edits_count?: number
          business_name: string
          city?: string | null
          created_at?: string
          google_place_id?: string | null
          html_content?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          monthly_price?: number | null
          phone?: string | null
          segment?: string | null
          setup_price?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          ai_edits_count?: number
          business_name?: string
          city?: string | null
          created_at?: string
          google_place_id?: string | null
          html_content?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          monthly_price?: number | null
          phone?: string | null
          segment?: string | null
          setup_price?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          client_name: string | null
          created_at: string
          id: string
          monthly_price: number
          next_billing_date: string | null
          proposal_id: string | null
          site_id: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          id?: string
          monthly_price: number
          next_billing_date?: string | null
          proposal_id?: string | null
          site_id: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          id?: string
          monthly_price?: number
          next_billing_date?: string | null
          proposal_id?: string | null
          site_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          available_at: string | null
          created_at: string
          id: string
          net_amount: number
          proposal_id: string | null
          status: string
          tenant_id: string
          type: string
        }
        Insert: {
          amount: number
          available_at?: string | null
          created_at?: string
          id?: string
          net_amount: number
          proposal_id?: string | null
          status?: string
          tenant_id: string
          type: string
        }
        Update: {
          amount?: number
          available_at?: string | null
          created_at?: string
          id?: string
          net_amount?: number
          proposal_id?: string | null
          status?: string
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          pix_key: string
          pix_key_type: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          pix_key: string
          pix_key_type: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          pix_key?: string
          pix_key_type?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
