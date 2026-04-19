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
      call_events: {
        Row: {
          counter_id: string
          counter_number: number
          created_at: string
          event_type: string
          id: string
          ticket_id: string
          ticket_number: string
        }
        Insert: {
          counter_id: string
          counter_number: number
          created_at?: string
          event_type?: string
          id?: string
          ticket_id: string
          ticket_number: string
        }
        Update: {
          counter_id?: string
          counter_number?: number
          created_at?: string
          event_type?: string
          id?: string
          ticket_id?: string
          ticket_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_events_counter_id_fkey"
            columns: ["counter_id"]
            isOneToOne: false
            referencedRelation: "counters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      counters: {
        Row: {
          created_at: string
          current_ticket_id: string | null
          id: string
          is_active: boolean
          name: string
          number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_ticket_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_ticket_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "counters_current_ticket_fk"
            columns: ["current_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_categories: {
        Row: {
          code: string
          color: string
          created_at: string
          id: string
          name: string
          prefix: string
          sort_order: number
        }
        Insert: {
          code: string
          color?: string
          created_at?: string
          id?: string
          name: string
          prefix: string
          sort_order?: number
        }
        Update: {
          code?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          prefix?: string
          sort_order?: number
        }
        Relationships: []
      }
      tickets: {
        Row: {
          called_at: string | null
          category_id: string
          counter_id: string | null
          done_at: string | null
          id: string
          issue_date: string
          issued_at: string
          sequence_number: number
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
        }
        Insert: {
          called_at?: string | null
          category_id: string
          counter_id?: string | null
          done_at?: string | null
          id?: string
          issue_date?: string
          issued_at?: string
          sequence_number: number
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
        }
        Update: {
          called_at?: string | null
          category_id?: string
          counter_id?: string | null
          done_at?: string | null
          id?: string
          issue_date?: string
          issued_at?: string
          sequence_number?: number
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "queue_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_counter_id_fkey"
            columns: ["counter_id"]
            isOneToOne: false
            referencedRelation: "counters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      call_next_ticket: {
        Args: { p_counter_id: string }
        Returns: {
          called_at: string | null
          category_id: string
          counter_id: string | null
          done_at: string | null
          id: string
          issue_date: string
          issued_at: string
          sequence_number: number
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      issue_ticket: {
        Args: { p_category_code: string }
        Returns: {
          called_at: string | null
          category_id: string
          counter_id: string | null
          done_at: string | null
          id: string
          issue_date: string
          issued_at: string
          sequence_number: number
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      recall_ticket: {
        Args: { p_counter_id: string }
        Returns: {
          called_at: string | null
          category_id: string
          counter_id: string | null
          done_at: string | null
          id: string
          issue_date: string
          issued_at: string
          sequence_number: number
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: string
        }
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reset_daily_queue: { Args: never; Returns: undefined }
      skip_ticket: { Args: { p_counter_id: string }; Returns: undefined }
    }
    Enums: {
      ticket_status: "waiting" | "called" | "serving" | "done" | "skipped"
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
      ticket_status: ["waiting", "called", "serving", "done", "skipped"],
    },
  },
} as const
