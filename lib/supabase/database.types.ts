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
          is_admin: boolean;
          suspended_at: string | null;
          email_verified_at: string | null;
          id_verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          role?: "buyer" | "seller";
          is_admin?: boolean;
          suspended_at?: string | null;
          email_verified_at?: string | null;
          id_verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          role?: "buyer" | "seller";
          is_admin?: boolean;
          suspended_at?: string | null;
          email_verified_at?: string | null;
          id_verified_at?: string | null;
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
          status: "draft" | "active" | "sold" | "removed";
          removed_reason: string | null;
          created_at: string;
          updated_at: string;
          search_vector: unknown;
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
          status?: "draft" | "active" | "sold" | "removed";
          removed_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          search_vector?: unknown;
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
          status?: "draft" | "active" | "sold" | "removed";
          removed_reason?: string | null;
          created_at?: string;
          updated_at?: string;
          search_vector?: unknown;
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
      favorites: {
        Row: {
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          listing_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          listing_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_reports: {
        Row: {
          id: string;
          listing_id: string;
          reporter_id: string;
          reason: "scam" | "spam" | "wrong_info" | "already_sold" | "offensive" | "other";
          details: string | null;
          status: "open" | "resolved" | "dismissed";
          created_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          listing_id: string;
          reporter_id: string;
          reason: "scam" | "spam" | "wrong_info" | "already_sold" | "offensive" | "other";
          details?: string | null;
          status?: "open" | "resolved" | "dismissed";
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          listing_id?: string;
          reporter_id?: string;
          reason?: "scam" | "spam" | "wrong_info" | "already_sold" | "offensive" | "other";
          details?: string | null;
          status?: "open" | "resolved" | "dismissed";
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "listing_reports_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_view_counts: {
        Row: {
          listing_id: string;
          views: number;
        };
        Insert: {
          listing_id: string;
          views?: number;
        };
        Update: {
          listing_id?: string;
          views?: number;
        };
        Relationships: [
          {
            foreignKeyName: "listing_view_counts_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: true;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      id_verification_requests: {
        Row: {
          id: string;
          user_id: string;
          doc_keys: string[];
          status: "pending" | "approved" | "rejected";
          reject_reason: string | null;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          doc_keys: string[];
          status?: "pending" | "approved" | "rejected";
          reject_reason?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          doc_keys?: string[];
          status?: "pending" | "approved" | "rejected";
          reject_reason?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "id_verification_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "id_verification_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          filters: Json;
          last_seen_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          filters: Json;
          last_seen_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          filters?: Json;
          last_seen_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_listing_view: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
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
