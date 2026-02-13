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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bale_items: {
        Row: {
          bale_id: number | null
          created_at: string | null
          id: number
          line_item_price: number
          quantity: number
          stock_item_id: number | null
        }
        Insert: {
          bale_id?: number | null
          created_at?: string | null
          id?: number
          line_item_price?: number
          quantity: number
          stock_item_id?: number | null
        }
        Update: {
          bale_id?: number | null
          created_at?: string | null
          id?: number
          line_item_price?: number
          quantity?: number
          stock_item_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bale_items_bale_id_fkey"
            columns: ["bale_id"]
            isOneToOne: false
            referencedRelation: "bales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bale_items_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      bale_metrics: {
        Row: {
          add_to_cart_count: number
          bale_id: number
          created_at: string
          id: string
          reset_date: string
          updated_at: string
          view_count: number
        }
        Insert: {
          add_to_cart_count?: number
          bale_id: number
          created_at?: string
          id?: string
          reset_date?: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          add_to_cart_count?: number
          bale_id?: number
          created_at?: string
          id?: string
          reset_date?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "bale_metrics_bale_id_fkey"
            columns: ["bale_id"]
            isOneToOne: true
            referencedRelation: "bales"
            referencedColumns: ["id"]
          },
        ]
      }
      bales: {
        Row: {
          active: boolean
          actual_selling_price: number
          bale_margin_percentage: number
          bale_number: string | null
          bale_profit: number
          created_at: string | null
          description: string
          display_order: number
          id: number
          product_category_id: number | null
          quantity_in_stock: number
          recommended_sale_price: number
          total_cost_price: number
        }
        Insert: {
          active?: boolean
          actual_selling_price?: number
          bale_margin_percentage?: number
          bale_number?: string | null
          bale_profit?: number
          created_at?: string | null
          description: string
          display_order?: number
          id?: number
          product_category_id?: number | null
          quantity_in_stock?: number
          recommended_sale_price?: number
          total_cost_price?: number
        }
        Update: {
          active?: boolean
          actual_selling_price?: number
          bale_margin_percentage?: number
          bale_number?: string | null
          bale_profit?: number
          created_at?: string | null
          description?: string
          display_order?: number
          id?: number
          product_category_id?: number | null
          quantity_in_stock?: number
          recommended_sale_price?: number
          total_cost_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bales_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sends: {
        Row: {
          campaign_id: string
          customer_email: string
          customer_name: string
          id: string
          sent_at: string
        }
        Insert: {
          campaign_id: string
          customer_email: string
          customer_name: string
          id?: string
          sent_at?: string
        }
        Update: {
          campaign_id?: string
          customer_email?: string
          customer_name?: string
          id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verifications: {
        Row: {
          created_at: string
          email: string | null
          expires_at: string
          id: string
          phone: string | null
          pin_code: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          phone?: string | null
          pin_code: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          phone?: string | null
          pin_code?: string
          verified?: boolean
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price_per_unit: number
          product_id: number
          product_image: string | null
          product_name: string
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price_per_unit: number
          product_id: number
          product_image?: string | null
          product_name: string
          quantity: number
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price_per_unit?: number
          product_id?: number
          product_image?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string
          created_at: string
          id: string
          notes: string | null
          order_id: string
          status: string
        }
        Insert: {
          changed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          status: string
        }
        Update: {
          changed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_paid: number
          created_at: string
          customer_email: string
          customer_feedback: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_city: string
          delivery_complex: string | null
          delivery_postal_code: string
          delivery_province: string
          id: string
          order_number: string
          order_status: string
          payment_method: string
          payment_status: string
          payment_tracking_status: string
          refund_reason: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          customer_email: string
          customer_feedback?: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_city: string
          delivery_complex?: string | null
          delivery_postal_code: string
          delivery_province: string
          id?: string
          order_number: string
          order_status?: string
          payment_method: string
          payment_status?: string
          payment_tracking_status?: string
          refund_reason?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          customer_email?: string
          customer_feedback?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_city?: string
          delivery_complex?: string | null
          delivery_postal_code?: string
          delivery_province?: string
          id?: string
          order_number?: string
          order_status?: string
          payment_method?: string
          payment_status?: string
          payment_tracking_status?: string
          refund_reason?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          active: boolean
          created_at: string | null
          description: string | null
          display_order: number
          id: number
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: number
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: number
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      stock_categories: {
        Row: {
          created_at: string | null
          display_order: number
          icon_name: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          icon_name?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          icon_name?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      stock_item_images: {
        Row: {
          created_at: string | null
          display_order: number
          id: number
          image_url: string
          is_primary: boolean
          stock_item_id: number | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: number
          image_url: string
          is_primary?: boolean
          stock_item_id?: number | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: number
          image_url?: string
          is_primary?: boolean
          stock_item_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_item_images_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          active: boolean
          age_range: string | null
          cost_price: number
          created_at: string | null
          description: string
          display_order: number
          id: number
          margin_percentage: number
          name: string
          selling_price: number
          stock_category_id: number | null
          stock_on_hand: number
        }
        Insert: {
          active?: boolean
          age_range?: string | null
          cost_price?: number
          created_at?: string | null
          description: string
          display_order?: number
          id?: number
          margin_percentage?: number
          name: string
          selling_price?: number
          stock_category_id?: number | null
          stock_on_hand?: number
        }
        Update: {
          active?: boolean
          age_range?: string | null
          cost_price?: number
          created_at?: string | null
          description?: string
          display_order?: number
          id?: number
          margin_percentage?: number
          name?: string
          selling_price?: number
          stock_category_id?: number | null
          stock_on_hand?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_stock_category_id_fkey"
            columns: ["stock_category_id"]
            isOneToOne: false
            referencedRelation: "stock_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_bale_number: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
