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
      accounting_entries: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          customer_id: string | null
          entry_date: string
          id: string
          notes: string | null
          payment_method: string | null
          service_type: string
          status: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          service_type: string
          status?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          service_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          booking_reference: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          payment_status: string
          phone: string | null
          special_requests: string | null
        }
        Insert: {
          booking_reference?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          payment_status?: string
          phone?: string | null
          special_requests?: string | null
        }
        Update: {
          booking_reference?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          payment_status?: string
          phone?: string | null
          special_requests?: string | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          license_type: string | null
          phone: string | null
          status: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          license_type?: string | null
          phone?: string | null
          status?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          license_type?: string | null
          phone?: string | null
          status?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_tours: {
        Row: {
          created_at: string
          departure_time: string | null
          guide_name: string | null
          id: string
          max_capacity: number
          notes: string | null
          service_date: string
          status: string
          tour_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          departure_time?: string | null
          guide_name?: string | null
          id?: string
          max_capacity?: number
          notes?: string | null
          service_date: string
          status?: string
          tour_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          departure_time?: string | null
          guide_name?: string | null
          id?: string
          max_capacity?: number
          notes?: string | null
          service_date?: string
          status?: string
          tour_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_tours_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_tours_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_transfers: {
        Row: {
          created_at: string
          driver_id: string | null
          dropoff_location: string | null
          id: string
          notes: string | null
          pickup_location: string | null
          pickup_time: string | null
          service_date: string
          status: string
          transfer_id: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          driver_id?: string | null
          dropoff_location?: string | null
          id?: string
          notes?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          service_date: string
          status?: string
          transfer_id: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string | null
          dropoff_location?: string | null
          id?: string
          notes?: string | null
          pickup_location?: string | null
          pickup_time?: string | null
          service_date?: string
          status?: string
          transfer_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_transfers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_transfers_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_transfers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_bookings: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          scheduled_tour_id: string
          seat_count: number
          voucher_status: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          scheduled_tour_id: string
          seat_count?: number
          voucher_status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          scheduled_tour_id?: string
          seat_count?: number
          voucher_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_scheduled_tour_id_fkey"
            columns: ["scheduled_tour_id"]
            isOneToOne: false
            referencedRelation: "scheduled_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          destination: string | null
          duration: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          description?: string | null
          destination?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          destination?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      transfer_bookings: {
        Row: {
          created_at: string
          customer_id: string
          flight_number: string | null
          flight_time: string | null
          id: string
          luggage_count: number
          notes: string | null
          passenger_count: number
          scheduled_transfer_id: string
          voucher_status: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          flight_number?: string | null
          flight_time?: string | null
          id?: string
          luggage_count?: number
          notes?: string | null
          passenger_count?: number
          scheduled_transfer_id: string
          voucher_status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          flight_number?: string | null
          flight_time?: string | null
          id?: string
          luggage_count?: number
          notes?: string | null
          passenger_count?: number
          scheduled_transfer_id?: string
          voucher_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_bookings_scheduled_transfer_id_fkey"
            columns: ["scheduled_transfer_id"]
            isOneToOne: false
            referencedRelation: "scheduled_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          base_price: number
          created_at: string
          destination: string | null
          id: string
          is_active: boolean
          name: string
          origin: string | null
        }
        Insert: {
          base_price?: number
          created_at?: string
          destination?: string | null
          id?: string
          is_active?: boolean
          name: string
          origin?: string | null
        }
        Update: {
          base_price?: number
          created_at?: string
          destination?: string | null
          id?: string
          is_active?: boolean
          name?: string
          origin?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          capacity: number
          created_at: string
          id: string
          name: string
          plate_number: string
          status: string
          type: string
        }
        Insert: {
          capacity: number
          created_at?: string
          id?: string
          name: string
          plate_number: string
          status?: string
          type: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          plate_number?: string
          status?: string
          type?: string
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
