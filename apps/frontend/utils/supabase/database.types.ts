export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type EmptyRelationships = [];

export type Database = {
  public: {
    Tables: {
      letters: {
        Row: {
          code: string;
          created_at: string;
          display_name: string;
          is_active: boolean;
          reference_image_url: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          display_name: string;
          is_active?: boolean;
          reference_image_url?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          display_name?: string;
          is_active?: boolean;
          reference_image_url?: string | null;
        };
        Relationships: EmptyRelationships;
      };
      model_versions: {
        Row: {
          architecture: string;
          artifact_path: string;
          confidence_threshold: number;
          created_at: string;
          id: string;
          input_size: number;
          is_active: boolean;
          map50: number | null;
          map50_95: number | null;
          model_name: string;
          model_version: string;
          released_at: string | null;
          updated_at: string;
        };
        Insert: {
          architecture?: string;
          artifact_path: string;
          confidence_threshold?: number;
          created_at?: string;
          id?: string;
          input_size?: number;
          is_active?: boolean;
          map50?: number | null;
          map50_95?: number | null;
          model_name: string;
          model_version: string;
          released_at?: string | null;
          updated_at?: string;
        };
        Update: {
          architecture?: string;
          artifact_path?: string;
          confidence_threshold?: number;
          created_at?: string;
          id?: string;
          input_size?: number;
          is_active?: boolean;
          map50?: number | null;
          map50_95?: number | null;
          model_name?: string;
          model_version?: string;
          released_at?: string | null;
          updated_at?: string;
        };
        Relationships: EmptyRelationships;
      };
      practice_attempts: {
        Row: {
          attempted_at: string;
          created_at: string;
          id: string;
          is_correct: boolean;
          letter_code: string;
          source: string;
          user_id: string;
        };
        Insert: {
          attempted_at?: string;
          created_at?: string;
          id?: string;
          is_correct: boolean;
          letter_code: string;
          source?: string;
          user_id: string;
        };
        Update: {
          attempted_at?: string;
          created_at?: string;
          id?: string;
          is_correct?: boolean;
          letter_code?: string;
          source?: string;
          user_id?: string;
        };
        Relationships: EmptyRelationships;
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          role: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          role?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          role?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: EmptyRelationships;
      };
      translation_entries: {
        Row: {
          commit_method: string;
          committed_at: string;
          confidence: number;
          created_at: string;
          id: string;
          letter_code: string;
          sequence_no: number;
          session_id: string;
        };
        Insert: {
          commit_method?: string;
          committed_at?: string;
          confidence: number;
          created_at?: string;
          id?: string;
          letter_code: string;
          sequence_no: number;
          session_id: string;
        };
        Update: {
          commit_method?: string;
          committed_at?: string;
          confidence?: number;
          created_at?: string;
          id?: string;
          letter_code?: string;
          sequence_no?: number;
          session_id?: string;
        };
        Relationships: EmptyRelationships;
      };
      translation_sessions: {
        Row: {
          average_confidence: number | null;
          committed_text: string;
          created_at: string;
          ended_at: string | null;
          entry_count: number;
          id: string;
          language: string;
          model_version_id: string | null;
          source: string;
          started_at: string;
          user_id: string | null;
        };
        Insert: {
          average_confidence?: number | null;
          committed_text?: string;
          created_at?: string;
          ended_at?: string | null;
          entry_count?: number;
          id?: string;
          language?: string;
          model_version_id?: string | null;
          source?: string;
          started_at?: string;
          user_id?: string | null;
        };
        Update: {
          average_confidence?: number | null;
          committed_text?: string;
          created_at?: string;
          ended_at?: string | null;
          entry_count?: number;
          id?: string;
          language?: string;
          model_version_id?: string | null;
          source?: string;
          started_at?: string;
          user_id?: string | null;
        };
        Relationships: EmptyRelationships;
      };
      user_preferences: {
        Row: {
          created_at: string;
          high_contrast: boolean;
          text_scale: number;
          theme: string;
          tts_speed: number;
          tts_volume: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          high_contrast?: boolean;
          text_scale?: number;
          theme?: string;
          tts_speed?: number;
          tts_volume?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          high_contrast?: boolean;
          text_scale?: number;
          theme?: string;
          tts_speed?: number;
          tts_volume?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: EmptyRelationships;
      };
    };
    Views: {
      practice_letter_stats: {
        Row: {
          accuracy: number | null;
          attempts: number | null;
          correct: number | null;
          letter_code: string | null;
          user_id: string | null;
        };
        Relationships: EmptyRelationships;
      };
    };
    Functions: {
      append_translation_entry: {
        Args: {
          p_commit_method?: string;
          p_committed_at?: string;
          p_confidence: number;
          p_entry_id: string;
          p_expected_user_id: string;
          p_language?: string;
          p_letter_code: string;
          p_session_id: string;
          p_source?: string;
          p_started_at?: string;
        };
        Returns: Json;
      };
      get_practice_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_translation_history_totals: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      record_practice_attempt: {
        Args: {
          p_attempt_id: string;
          p_attempted_at?: string;
          p_expected_user_id: string;
          p_is_correct: boolean;
          p_letter_code: string;
          p_source?: string;
        };
        Returns: Json;
      };
      reset_practice_stats: {
        Args: {
          p_expected_user_id: string;
        };
        Returns: Json;
      };
      upsert_user_preferences: {
        Args: {
          p_high_contrast?: boolean;
          p_text_scale?: number;
          p_theme?: string;
          p_tts_speed?: number;
          p_tts_volume?: number;
        };
        Returns: undefined;
      };
    };
    Enums: Record<PropertyKey, never>;
    CompositeTypes: Record<PropertyKey, never>;
  };
};
