// Mirrors the output of `npm run db:types` (supabase gen types typescript).
// Regenerate with that script whenever the schema changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          city: string | null;
          role: "buyer" | "seller";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          role?: "buyer" | "seller";
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          role?: "buyer" | "seller";
          created_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          make: string;
          model: string;
          year: number;
          mileage: number;
          price: number;
          condition: "excellent" | "good" | "fair";
          city: string;
          fuel_type: "petrol" | "diesel" | "hybrid" | "electric";
          status: "draft" | "active" | "sold";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          make: string;
          model: string;
          year: number;
          mileage: number;
          price: number;
          condition: "excellent" | "good" | "fair";
          city: string;
          fuel_type: "petrol" | "diesel" | "hybrid" | "electric";
          status?: "draft" | "active" | "sold";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          make?: string;
          model?: string;
          year?: number;
          mileage?: number;
          price?: number;
          condition?: "excellent" | "good" | "fair";
          city?: string;
          fuel_type?: "petrol" | "diesel" | "hybrid" | "electric";
          status?: "draft" | "active" | "sold";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_images: {
        Row: {
          id: string;
          listing_id: string;
          r2_key: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          r2_key: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          r2_key?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
