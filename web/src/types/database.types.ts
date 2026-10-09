export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type RolUsuario = 'estudiante' | 'cocina' | 'admin'
export type TamanoPorcion = 'pequena' | 'regular' | 'grande'
export type EstadoPedido = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          codigo_estudiante: string | null
          nombre: string
          carrera: string | null
          rol: RolUsuario
          preferencias: string[]
          restricciones: string[]
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          codigo_estudiante?: string | null
          nombre: string
          carrera?: string | null
          rol?: RolUsuario
          preferencias?: string[]
          restricciones?: string[]
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo_estudiante?: string | null
          nombre?: string
          carrera?: string | null
          rol?: RolUsuario
          preferencias?: string[]
          restricciones?: string[]
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      platos: {
        Row: {
          id: string
          codigo: string
          nombre: string
          descripcion: string | null
          componentes: string[]
          precio: number
          calorias: number | null
          imagen_url: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo: string
          nombre: string
          descripcion?: string | null
          componentes?: string[]
          precio: number
          calorias?: number | null
          imagen_url?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          nombre?: string
          descripcion?: string | null
          componentes?: string[]
          precio?: number
          calorias?: number | null
          imagen_url?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_dia: {
        Row: {
          id: string
          fecha: string
          plato_id: string
          cantidad_preparada: number
          created_at: string
        }
        Insert: {
          id?: string
          fecha: string
          plato_id: string
          cantidad_preparada?: number
          created_at?: string
        }
        Update: {
          id?: string
          fecha?: string
          plato_id?: string
          cantidad_preparada?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_dia_plato_id_fkey"
            columns: ["plato_id"]
            referencedRelation: "platos"
            referencedColumns: ["id"]
          }
        ]
      }
      pedidos: {
        Row: {
          id: string
          numero: number
          estudiante_id: string
          menu_dia_id: string
          fecha: string
          hora_recojo: string
          porcion: TamanoPorcion
          componentes_excluidos: string[]
          estado: EstadoPedido
          total: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero?: number
          estudiante_id: string
          menu_dia_id: string
          fecha?: string
          hora_recojo: string
          porcion?: TamanoPorcion
          componentes_excluidos?: string[]
          estado?: EstadoPedido
          total?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero?: number
          estudiante_id?: string
          menu_dia_id?: string
          fecha?: string
          hora_recojo?: string
          porcion?: TamanoPorcion
          componentes_excluidos?: string[]
          estado?: EstadoPedido
          total?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_estudiante_id_fkey"
            columns: ["estudiante_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_menu_dia_id_fkey"
            columns: ["menu_dia_id"]
            referencedRelation: "menu_dia"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      demanda_dia: {
        Row: {
          fecha: string | null
          plato_id: string | null
          plato_codigo: string | null
          plato_nombre: string | null
          porcion: TamanoPorcion | null
          total_pedidos: number | null
          total_estimado_recaudo: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      mi_rol: {
        Args: Record<PropertyKey, never>
        Returns: RolUsuario
      }
      es_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      es_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
  }
}
