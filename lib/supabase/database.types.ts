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
          plan: "free" | "dealer" | "dealer_pro" | "showroom";
          plan_expires_at: string | null;
          business_name: string | null;
          about: string | null;
          logo_key: string | null;
          avatar_key: string | null;
          showroom_address: string | null;
          has_phone: boolean | null;
          listing_credits: number;
          is_demo: boolean;
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
          plan?: "free" | "dealer" | "dealer_pro" | "showroom";
          plan_expires_at?: string | null;
          business_name?: string | null;
          about?: string | null;
          logo_key?: string | null;
          avatar_key?: string | null;
          showroom_address?: string | null;
          has_phone?: never;
          listing_credits?: number;
          is_demo?: boolean;
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
          plan?: "free" | "dealer" | "dealer_pro" | "showroom";
          plan_expires_at?: string | null;
          business_name?: string | null;
          about?: string | null;
          logo_key?: string | null;
          avatar_key?: string | null;
          showroom_address?: string | null;
          has_phone?: never;
          listing_credits?: number;
          is_demo?: boolean;
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
          mileage: number | null;
          price: number;
          condition: "excellent" | "good" | "fair";
          city: string;
          fuel_type: "petrol" | "diesel" | "hybrid" | "electric";
          transmission: "automatic" | "manual" | null;
          body_type: "sedan" | "suv" | "hatchback" | "coupe" | "pickup" | "van" | null;
          bumped_at: string;
          features: string[];
          color: string | null;
          description: string | null;
          status: "draft" | "active" | "sold" | "removed";
          removed_reason: string | null;
          featured_until: string | null;
          first_published_at: string | null;
          created_at: string;
          updated_at: string;
          listing_type: "sale" | "rent";
          weekly_price: number | null;
          monthly_price: number | null;
          min_rental_days: number | null;
          deposit: number | null;
          daily_km_limit: number | null;
          category: "car" | "equipment";
          equipment_type: "excavator" | "backhoe_loader" | "wheel_loader" | "bulldozer" | "skid_steer" | "forklift" | "mobile_crane" | "boom_lift" | "scissor_lift" | "dump_truck" | "roller" | "generator" | "compressor" | "water_tanker" | "other" | null;
          operating_hours: number | null;
          operator_included: boolean | null;
          search_vector: unknown;
        };
        Insert: {
          id?: string;
          seller_id: string;
          make: string;
          model: string;
          year: number;
          mileage?: number | null;
          price: number;
          condition: "excellent" | "good" | "fair";
          city: string;
          fuel_type: "petrol" | "diesel" | "hybrid" | "electric";
          transmission?: "automatic" | "manual" | null;
          body_type?: "sedan" | "suv" | "hatchback" | "coupe" | "pickup" | "van" | null;
          bumped_at?: string;
          features?: string[];
          color?: string | null;
          description?: string | null;
          status?: "draft" | "active" | "sold" | "removed";
          removed_reason?: string | null;
          featured_until?: string | null;
          first_published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          listing_type?: "sale" | "rent";
          weekly_price?: number | null;
          monthly_price?: number | null;
          min_rental_days?: number | null;
          deposit?: number | null;
          daily_km_limit?: number | null;
          category?: "car" | "equipment";
          equipment_type?: "excavator" | "backhoe_loader" | "wheel_loader" | "bulldozer" | "skid_steer" | "forklift" | "mobile_crane" | "boom_lift" | "scissor_lift" | "dump_truck" | "roller" | "generator" | "compressor" | "water_tanker" | "other" | null;
          operating_hours?: number | null;
          operator_included?: boolean | null;
          search_vector?: unknown;
        };
        Update: {
          id?: string;
          seller_id?: string;
          make?: string;
          model?: string;
          year?: number;
          mileage?: number | null;
          price?: number;
          condition?: "excellent" | "good" | "fair";
          city?: string;
          fuel_type?: "petrol" | "diesel" | "hybrid" | "electric";
          transmission?: "automatic" | "manual" | null;
          body_type?: "sedan" | "suv" | "hatchback" | "coupe" | "pickup" | "van" | null;
          bumped_at?: string;
          features?: string[];
          color?: string | null;
          description?: string | null;
          status?: "draft" | "active" | "sold" | "removed";
          removed_reason?: string | null;
          featured_until?: string | null;
          first_published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          listing_type?: "sale" | "rent";
          weekly_price?: number | null;
          monthly_price?: number | null;
          min_rental_days?: number | null;
          deposit?: number | null;
          daily_km_limit?: number | null;
          category?: "car" | "equipment";
          equipment_type?: "excavator" | "backhoe_loader" | "wheel_loader" | "bulldozer" | "skid_steer" | "forklift" | "mobile_crane" | "boom_lift" | "scissor_lift" | "dump_truck" | "roller" | "generator" | "compressor" | "water_tanker" | "other" | null;
          operating_hours?: number | null;
          operator_included?: boolean | null;
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
      featured_usage: {
        Row: {
          id: string;
          seller_id: string;
          listing_id: string | null;
          month: string;
          granted_at: string;
          granted_by: string | null;
        };
        Insert: {
          id?: string;
          seller_id: string;
          listing_id?: string | null;
          month: string;
          granted_at?: string;
          granted_by?: string | null;
        };
        Update: {
          id?: string;
          seller_id?: string;
          listing_id?: string | null;
          month?: string;
          granted_at?: string;
          granted_by?: string | null;
        };
        Relationships: [];
      };
      listing_bumps: {
        Row: {
          id: string;
          seller_id: string;
          listing_id: string | null;
          month: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          listing_id?: string | null;
          month: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          listing_id?: string | null;
          month?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      plan_changes: {
        Row: {
          id: string;
          user_id: string;
          from_plan: "free" | "dealer" | "dealer_pro" | "showroom";
          to_plan: "free" | "dealer" | "dealer_pro" | "showroom";
          expires_at: string | null;
          changed_by: string | null;
          source: "admin" | "dealer_application" | "expiry";
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          from_plan: "free" | "dealer" | "dealer_pro" | "showroom";
          to_plan: "free" | "dealer" | "dealer_pro" | "showroom";
          expires_at?: string | null;
          changed_by?: string | null;
          source: "admin" | "dealer_application" | "expiry";
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          from_plan?: "free" | "dealer" | "dealer_pro" | "showroom";
          to_plan?: "free" | "dealer" | "dealer_pro" | "showroom";
          expires_at?: string | null;
          changed_by?: string | null;
          source?: "admin" | "dealer_application" | "expiry";
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_changes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_changes_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      featured_grants: {
        Row: {
          id: string;
          listing_id: string | null;
          seller_id: string;
          days: number;
          featured_until: string;
          granted_by: string | null;
          self_serve: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id?: string | null;
          seller_id: string;
          days: number;
          featured_until: string;
          granted_by?: string | null;
          self_serve?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string | null;
          seller_id?: string;
          days?: number;
          featured_until?: string;
          granted_by?: string | null;
          self_serve?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "featured_grants_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "featured_grants_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "featured_grants_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_payments: {
        Row: {
          id: string;
          user_id: string;
          plan_change_id: string | null;
          addon_request_id: string | null;
          amount: number;
          method: "bank_transfer" | "cash" | "other";
          reference: string | null;
          recorded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_change_id?: string | null;
          addon_request_id?: string | null;
          amount: number;
          method: "bank_transfer" | "cash" | "other";
          reference?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_change_id?: string | null;
          addon_request_id?: string | null;
          amount?: number;
          method?: "bank_transfer" | "cash" | "other";
          reference?: string | null;
          recorded_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_payments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_payments_plan_change_id_fkey";
            columns: ["plan_change_id"];
            isOneToOne: false;
            referencedRelation: "plan_changes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_payments_addon_request_id_fkey";
            columns: ["addon_request_id"];
            isOneToOne: false;
            referencedRelation: "addon_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_payments_recorded_by_fkey";
            columns: ["recorded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      addon_requests: {
        Row: {
          id: string;
          user_id: string;
          kind: "featured_boost" | "extra_listings";
          listing_id: string | null;
          quantity: number;
          status: "pending" | "approved" | "rejected";
          reject_reason: string | null;
          decided_by: string | null;
          decided_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: "featured_boost" | "extra_listings";
          listing_id?: string | null;
          quantity: number;
          status?: "pending" | "approved" | "rejected";
          reject_reason?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: "featured_boost" | "extra_listings";
          listing_id?: string | null;
          quantity?: number;
          status?: "pending" | "approved" | "rejected";
          reject_reason?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addon_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "addon_requests_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "addon_requests_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_actions: {
        Row: {
          id: string;
          admin_id: string | null;
          action: "listing_removed" | "listing_restored" | "reports_dismissed" | "listing_unfeatured" | "user_suspended" | "user_unsuspended" | "id_approved" | "id_rejected" | "id_revoked" | "dealer_approved" | "dealer_rejected" | "listing_auto_hidden" | "addon_rejected";
          user_id: string | null;
          listing_id: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action: "listing_removed" | "listing_restored" | "reports_dismissed" | "listing_unfeatured" | "user_suspended" | "user_unsuspended" | "id_approved" | "id_rejected" | "id_revoked" | "dealer_approved" | "dealer_rejected" | "listing_auto_hidden" | "addon_rejected";
          user_id?: string | null;
          listing_id?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          action?: "listing_removed" | "listing_restored" | "reports_dismissed" | "listing_unfeatured" | "user_suspended" | "user_unsuspended" | "id_approved" | "id_rejected" | "id_revoked" | "dealer_approved" | "dealer_rejected" | "listing_auto_hidden" | "addon_rejected";
          user_id?: string | null;
          listing_id?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_actions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_actions_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_quota_usage: {
        Row: {
          seller_id: string;
          month: string;
          used: number;
        };
        Insert: {
          seller_id: string;
          month: string;
          used?: number;
        };
        Update: {
          seller_id?: string;
          month?: string;
          used?: number;
        };
        Relationships: [];
      };
      listing_offers: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          note: string | null;
          counter_amount: number | null;
          status: "pending" | "countered" | "accepted" | "declined" | "withdrawn" | "expired";
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          note?: string | null;
          counter_amount?: number | null;
          status?: "pending" | "countered" | "accepted" | "declined" | "withdrawn" | "expired";
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          buyer_id?: string;
          seller_id?: string;
          amount?: number;
          note?: string | null;
          counter_amount?: number | null;
          status?: "pending" | "countered" | "accepted" | "declined" | "withdrawn" | "expired";
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listing_offers_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_offers_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listing_offers_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rental_requests: {
        Row: {
          id: string;
          listing_id: string;
          renter_id: string;
          owner_id: string;
          start_date: string;
          end_date: string;
          days: number;
          quoted_total: number;
          note: string | null;
          decline_reason: string | null;
          status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          renter_id: string;
          owner_id: string;
          start_date: string;
          end_date: string;
          days: number;
          quoted_total: number;
          note?: string | null;
          decline_reason?: string | null;
          status?: "pending" | "accepted" | "declined" | "cancelled" | "expired";
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          renter_id?: string;
          owner_id?: string;
          start_date?: string;
          end_date?: string;
          days?: number;
          quoted_total?: number;
          note?: string | null;
          decline_reason?: string | null;
          status?: "pending" | "accepted" | "declined" | "cancelled" | "expired";
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rental_requests_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rental_requests_renter_id_fkey";
            columns: ["renter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rental_requests_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
      contact_reveals: {
        Row: {
          id: number;
          ip_hash: string;
          seller_id: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          ip_hash: string;
          seller_id: string;
          created_at?: string;
        };
        Update: {
          id?: never;
          ip_hash?: string;
          seller_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_reveals_seller_id_fkey";
            columns: ["seller_id"];
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
          calls: number;
          whatsapps: number;
        };
        Insert: {
          listing_id: string;
          views?: number;
          calls?: number;
          whatsapps?: number;
        };
        Update: {
          listing_id?: string;
          views?: number;
          calls?: number;
          whatsapps?: number;
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
      listing_daily_stats: {
        Row: {
          listing_id: string;
          day: string;
          views: number;
          calls: number;
          whatsapps: number;
        };
        Insert: {
          listing_id: string;
          day: string;
          views?: number;
          calls?: number;
          whatsapps?: number;
        };
        Update: {
          listing_id?: string;
          day?: string;
          views?: number;
          calls?: number;
          whatsapps?: number;
        };
        Relationships: [
          {
            foreignKeyName: "listing_daily_stats_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
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
      dealer_applications: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          showroom_address: string | null;
          cr_number: string | null;
          vat_number: string | null;
          muroor_number: string | null;
          requested_plan: "dealer" | "dealer_pro" | "showroom";
          cr_doc_key: string | null;
          vat_doc_key: string | null;
          muroor_doc_key: string | null;
          status: "pending" | "approved" | "rejected";
          reject_reason: string | null;
          created_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          showroom_address?: string | null;
          cr_number?: string | null;
          vat_number?: string | null;
          muroor_number?: string | null;
          requested_plan: "dealer" | "dealer_pro" | "showroom";
          cr_doc_key?: string | null;
          vat_doc_key?: string | null;
          muroor_doc_key?: string | null;
          status?: "pending" | "approved" | "rejected";
          reject_reason?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          showroom_address?: string | null;
          cr_number?: string | null;
          vat_number?: string | null;
          muroor_number?: string | null;
          requested_plan?: "dealer" | "dealer_pro" | "showroom";
          cr_doc_key?: string | null;
          vat_doc_key?: string | null;
          muroor_doc_key?: string | null;
          status?: "pending" | "approved" | "rejected";
          reject_reason?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dealer_applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dealer_applications_reviewed_by_fkey";
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
      admin_daily_activity: {
        Args: { p_days: number };
        Returns: { day: string; listings: number; users: number }[];
      };
      admin_engagement_totals: {
        Args: Record<PropertyKey, never>;
        Returns: { views: number; calls: number; whatsapps: number }[];
      };
      approve_addon_request: {
        Args: { p_request: string; p_admin: string };
        Returns: undefined;
      };
      expire_plans: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      feature_listing: {
        Args: { p_listing_id: string; p_days: number; p_admin: string };
        Returns: string;
      };
      bump_own_listing: {
        Args: { p_listing_id: string };
        Returns: string;
      };
      bump_status: {
        Args: Record<PropertyKey, never>;
        Returns: { used: number; monthly_limit: number | null; cooldown_hours: number }[];
      };
      feature_own_listing: {
        Args: { p_listing_id: string };
        Returns: string;
      };
      get_own_profile: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Tables"]["profiles"]["Row"][];
      };
      increment_listing_contact: {
        Args: { p_listing_id: string; p_kind: string };
        Returns: undefined;
      };
      increment_listing_view: {
        Args: { p_listing_id: string };
        Returns: undefined;
      };
      is_demo_user: {
        Args: { p_user: string };
        Returns: boolean;
      };
      reject_addon_request: {
        Args: { p_request: string; p_admin: string; p_reason: string };
        Returns: undefined;
      };
      request_addon: {
        Args: { p_kind: "featured_boost" | "extra_listings"; p_listing_id: string | null; p_quantity: number };
        Returns: string;
      };
      request_rental: {
        Args: { p_listing_id: string; p_start: string; p_end: string; p_note: string | null };
        Returns: string;
      };
      owner_respond_rental: {
        Args: { p_request_id: string; p_action: "accept" | "decline"; p_reason?: string };
        Returns: undefined;
      };
      renter_cancel_rental: {
        Args: { p_request_id: string };
        Returns: undefined;
      };
      rental_contact: {
        Args: { p_request_id: string };
        Returns: { full_name: string | null; phone: string | null }[];
      };
      rental_booked_ranges: {
        Args: { p_listing_id: string };
        Returns: { start_date: string; end_date: string }[];
      };
      rental_quote: {
        Args: { p_daily: number; p_weekly: number | null; p_monthly: number | null; p_days: number };
        Returns: number;
      };
      make_offer: {
        Args: { p_listing_id: string; p_amount: number; p_note: string | null };
        Returns: string;
      };
      seller_respond_offer: {
        Args: { p_offer_id: string; p_action: "accept" | "decline" | "counter"; p_counter: number | null };
        Returns: undefined;
      };
      buyer_respond_offer: {
        Args: { p_offer_id: string; p_action: "accept" | "decline" | "withdraw" };
        Returns: undefined;
      };
      offer_contact: {
        Args: { p_offer_id: string };
        Returns: { full_name: string | null; phone: string | null }[];
      };
      reveal_seller_phone: {
        Args: { p_seller_id: string; p_ip_hash: string };
        Returns: string;
      };
      set_plan: {
        Args: {
          p_user: string;
          p_plan: "free" | "dealer" | "dealer_pro" | "showroom";
          p_expires_at: string | null;
          p_changed_by: string | null;
          p_source: "admin" | "dealer_application" | "expiry";
          p_note?: string | null;
        };
        Returns: string;
      };
      my_insights_days: {
        Args: { p_days: number };
        Returns: number;
      };
      seller_insights: {
        Args: { p_days: number };
        Returns: {
          day: string;
          views: number;
          calls: number;
          whatsapps: number;
          saves: number;
          offers: number;
        }[];
      };
      seller_listing_insights: {
        Args: { p_days: number };
        Returns: { listing_id: string; views: number; calls: number; whatsapps: number; saves: number }[];
      };
      listing_quota_status: {
        Args: Record<PropertyKey, never>;
        Returns: {
          plan: "free" | "dealer" | "dealer_pro" | "showroom";
          plan_expires_at: string | null;
          used: number;
          monthly_limit: number | null;
          featured_used: number;
          featured_allowance: number | null;
          listing_credits: number;
        }[];
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
