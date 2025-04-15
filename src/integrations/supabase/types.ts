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
      barber_holidays: {
        Row: {
          barber_id: string
          created_at: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          barber_id: string
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
        }
        Update: {
          barber_id?: string
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_holidays_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_lunch_breaks: {
        Row: {
          barber_id: string
          duration: number
          id: string
          is_active: boolean | null
          start_time: string
        }
        Insert: {
          barber_id: string
          duration: number
          id?: string
          is_active?: boolean | null
          start_time: string
        }
        Update: {
          barber_id?: string
          duration?: number
          id?: string
          is_active?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_lunch_breaks_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      barber_services: {
        Row: {
          barber_id: string
          id: string
          service_id: string
        }
        Insert: {
          barber_id: string
          id?: string
          service_id: string
        }
        Update: {
          barber_id?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "barber_services_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barber_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      barbers: {
        Row: {
          active: boolean | null
          bio: string | null
          color: string | null
          id: string
          image_url: string | null
          name: string
          specialty: string | null
        }
        Insert: {
          active?: boolean | null
          bio?: string | null
          color?: string | null
          id?: string
          image_url?: string | null
          name: string
          specialty?: string | null
        }
        Update: {
          active?: boolean | null
          bio?: string | null
          color?: string | null
          id?: string
          image_url?: string | null
          name?: string
          specialty?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          barber_id: string
          booking_date: string
          booking_time: string
          created_at: string | null
          guest_booking: boolean | null
          guest_email: string | null
          id: string
          notes: string | null
          service_id: string
          status: string
          user_id: string
        }
        Insert: {
          barber_id: string
          booking_date: string
          booking_time: string
          created_at?: string | null
          guest_booking?: boolean | null
          guest_email?: string | null
          id?: string
          notes?: string | null
          service_id: string
          status: string
          user_id: string
        }
        Update: {
          barber_id?: string
          booking_date?: string
          booking_time?: string
          created_at?: string | null
          guest_booking?: boolean | null
          guest_email?: string | null
          id?: string
          notes?: string | null
          service_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_default: boolean
          subject: string | null
          template_name: string
          type: string
          variables: Json
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          subject?: string | null
          template_name: string
          type: string
          variables?: Json
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean
          subject?: string | null
          template_name?: string
          type?: string
          variables?: Json
        }
        Relationships: []
      }
      opening_hours: {
        Row: {
          barber_id: string
          close_time: string
          day_of_week: number
          id: string
          is_closed: boolean | null
          open_time: string
        }
        Insert: {
          barber_id: string
          close_time: string
          day_of_week: number
          id?: string
          is_closed?: boolean | null
          open_time: string
        }
        Update: {
          barber_id?: string
          close_time?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean | null
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "opening_hours_barber_id_fkey"
            columns: ["barber_id"]
            isOneToOne: false
            referencedRelation: "barbers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          is_super_admin: boolean | null
          last_name: string | null
          phone: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_super_admin?: boolean | null
          last_name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean | null
          description: string | null
          duration: number
          id: string
          name: string
          price: number
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          duration: number
          id?: string
          name: string
          price: number
        }
        Update: {
          active?: boolean | null
          description?: string | null
          duration?: number
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_lunch_break_conflict: {
        Args: { p_barber_id: string; p_date: string; p_start_time: string }
        Returns: boolean
      }
      check_table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      create_system_settings_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_emails_by_ids: {
        Args: { user_ids: string[] }
        Returns: {
          id: string
          email: string
        }[]
      }
      get_user_id_by_email: {
        Args: { user_email: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_barber_on_holiday: {
        Args: { p_barber_id: string; p_date: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_valid_user_id: {
        Args: { user_id: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
