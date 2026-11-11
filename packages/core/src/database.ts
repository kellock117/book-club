export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      book_interests: {
        Row: {
          book_id: string;
          member_id: string;
        };
        ComputedFields: never;
        Insert: {
          book_id: string;
          member_id: string;
        };
        Update: {
          book_id?: string;
          member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "book_interests_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "book_stats";
            referencedColumns: ["book_id"];
          },
          {
            foreignKeyName: "book_interests_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "book_interests_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "member_stats";
            referencedColumns: ["member_id"];
          },
          {
            foreignKeyName: "book_interests_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      books: {
        Row: {
          authors: string[];
          cover_path: string | null;
          created_at: string;
          description: string | null;
          genre: string | null;
          id: string;
          info_source: string | null;
          isbn13: string | null;
          pages: number | null;
          published_date: string | null;
          publisher: string | null;
          recommend_reason: string | null;
          recommended_by: string | null;
          selected_by: string | null;
          selection_reason: string | null;
          source_category: string | null;
          status: string;
          title: string;
          translators: string[];
        };
        ComputedFields: never;
        Insert: {
          authors?: string[];
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          genre?: string | null;
          id?: string;
          info_source?: string | null;
          isbn13?: string | null;
          pages?: number | null;
          published_date?: string | null;
          publisher?: string | null;
          recommend_reason?: string | null;
          recommended_by?: string | null;
          selected_by?: string | null;
          selection_reason?: string | null;
          source_category?: string | null;
          status?: string;
          title: string;
          translators?: string[];
        };
        Update: {
          authors?: string[];
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          genre?: string | null;
          id?: string;
          info_source?: string | null;
          isbn13?: string | null;
          pages?: number | null;
          published_date?: string | null;
          publisher?: string | null;
          recommend_reason?: string | null;
          recommended_by?: string | null;
          selected_by?: string | null;
          selection_reason?: string | null;
          source_category?: string | null;
          status?: string;
          title?: string;
          translators?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "books_recommended_by_fkey";
            columns: ["recommended_by"];
            isOneToOne: false;
            referencedRelation: "member_stats";
            referencedColumns: ["member_id"];
          },
          {
            foreignKeyName: "books_recommended_by_fkey";
            columns: ["recommended_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "books_selected_by_fkey";
            columns: ["selected_by"];
            isOneToOne: false;
            referencedRelation: "member_stats";
            referencedColumns: ["member_id"];
          },
          {
            foreignKeyName: "books_selected_by_fkey";
            columns: ["selected_by"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      meeting_attendees: {
        Row: {
          meeting_id: string;
          member_id: string;
        };
        ComputedFields: never;
        Insert: {
          meeting_id: string;
          member_id: string;
        };
        Update: {
          meeting_id?: string;
          member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey";
            columns: ["meeting_id"];
            isOneToOne: false;
            referencedRelation: "meetings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meeting_attendees_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "member_stats";
            referencedColumns: ["member_id"];
          },
          {
            foreignKeyName: "meeting_attendees_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      meetings: {
        Row: {
          book_id: string | null;
          created_at: string;
          date: string;
          id: string;
          number: number;
          place: string | null;
          questions: string | null;
        };
        ComputedFields: never;
        Insert: {
          book_id?: string | null;
          created_at?: string;
          date: string;
          id?: string;
          number: number;
          place?: string | null;
          questions?: string | null;
        };
        Update: {
          book_id?: string | null;
          created_at?: string;
          date?: string;
          id?: string;
          number?: number;
          place?: string | null;
          questions?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meetings_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "book_stats";
            referencedColumns: ["book_id"];
          },
          {
            foreignKeyName: "meetings_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
        ];
      };
      members: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
          rotation_order: number;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          color: string;
          created_at?: string;
          id?: string;
          name: string;
          rotation_order: number;
          status?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          rotation_order?: number;
          status?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          book_id: string;
          created_at: string;
          id: string;
          member_id: string;
          one_liner: string | null;
          quote: string | null;
          score: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          book_id: string;
          created_at?: string;
          id?: string;
          member_id: string;
          one_liner?: string | null;
          quote?: string | null;
          score: number;
          updated_at?: string;
        };
        Update: {
          book_id?: string;
          created_at?: string;
          id?: string;
          member_id?: string;
          one_liner?: string | null;
          quote?: string | null;
          score?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "book_stats";
            referencedColumns: ["book_id"];
          },
          {
            foreignKeyName: "ratings_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "member_stats";
            referencedColumns: ["member_id"];
          },
          {
            foreignKeyName: "ratings_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_drafts: {
        Row: {
          id: string;
          state: NonNullable<Json>;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          id: string;
          state: NonNullable<Json>;
          updated_at?: string;
        };
        Update: {
          id?: string;
          state?: NonNullable<Json>;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          created_at: string;
          date: string;
          ended_at: string | null;
          finished: boolean;
          id: string;
          memo: string | null;
          part: string;
          started_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          date: string;
          ended_at?: string | null;
          finished?: boolean;
          id: string;
          memo?: string | null;
          part: string;
          started_at?: string | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          ended_at?: string | null;
          finished?: boolean;
          id?: string;
          memo?: string | null;
          part?: string;
          started_at?: string | null;
        };
        Relationships: [];
      };
      workout_sets: {
        Row: {
          ended_at: string | null;
          edited: boolean;
          exercise: string;
          extra: Json | null;
          ord: number;
          reps: number | null;
          session_id: string;
          set_no: number;
          started_at: string | null;
          unit: string;
        };
        ComputedFields: never;
        Insert: {
          ended_at?: string | null;
          edited?: boolean;
          exercise: string;
          extra?: Json | null;
          ord: number;
          reps?: number | null;
          session_id: string;
          set_no: number;
          started_at?: string | null;
          unit?: string;
        };
        Update: {
          ended_at?: string | null;
          edited?: boolean;
          exercise?: string;
          extra?: Json | null;
          ord?: number;
          reps?: number | null;
          session_id?: string;
          set_no?: number;
          started_at?: string | null;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sets_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      book_stats: {
        Row: {
          avg_score: number | null;
          book_id: string;
          rating_count: number | null;
          stddev_score: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
      member_stats: {
        Row: {
          attended_count: number | null;
          avg_score: number | null;
          member_id: string;
          selected_count: number | null;
        };
        ComputedFields: never;
        Insert: {
          attended_count?: never;
          avg_score?: never;
          member_id?: string | null;
          selected_count?: never;
        };
        Update: {
          attended_count?: never;
          avg_score?: never;
          member_id?: string | null;
          selected_count?: never;
        };
        Relationships: [];
      };
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
