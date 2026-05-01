export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role:
            | 'super_admin'
            | 'admin'
            | 'enseignant'
            | 'secretaire'
            | 'comptable'
            | 'surveillant'
            | 'parent'
            | 'eleve'
          first_name: string
          last_name: string
          email: string
          phone: string | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role:
            | 'super_admin'
            | 'admin'
            | 'enseignant'
            | 'secretaire'
            | 'comptable'
            | 'surveillant'
            | 'parent'
            | 'eleve'
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?:
            | 'super_admin'
            | 'admin'
            | 'enseignant'
            | 'secretaire'
            | 'comptable'
            | 'surveillant'
            | 'parent'
            | 'eleve'
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          matricule: string
          first_name: string
          last_name: string
          date_naissance: string
          lieu_naissance: string | null
          genre: 'M' | 'F'
          classe_id: string | null
          status: 'active' | 'inactive' | 'transferred'
          photo_url: string | null
          groupe_sanguin: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null
          maladies_particulieres: string | null
          phone: string | null
          email: string | null
          adresse: string | null
          piece_naissance: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          matricule: string
          first_name: string
          last_name: string
          date_naissance: string
          lieu_naissance?: string | null
          genre: 'M' | 'F'
          classe_id?: string | null
          status?: 'active' | 'inactive' | 'transferred'
          photo_url?: string | null
          groupe_sanguin?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null
          maladies_particulieres?: string | null
          phone?: string | null
          email?: string | null
          adresse?: string | null
          piece_naissance?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          matricule?: string
          first_name?: string
          last_name?: string
          date_naissance?: string
          lieu_naissance?: string | null
          genre?: 'M' | 'F'
          classe_id?: string | null
          status?: 'active' | 'inactive' | 'transferred'
          photo_url?: string | null
          groupe_sanguin?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null
          maladies_particulieres?: string | null
          phone?: string | null
          email?: string | null
          adresse?: string | null
          piece_naissance?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          etablissement_id: string
          annee_scolaire_id: string
          name: string
          niveau: 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | '6ème'
          capacite: number
          salle: string | null
          titulaire_id: string | null
          status: 'active' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          etablissement_id: string
          annee_scolaire_id: string
          name: string
          niveau: 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | '6ème'
          capacite: number
          salle?: string | null
          titulaire_id?: string | null
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          etablissement_id?: string
          annee_scolaire_id?: string
          name?: string
          niveau?: 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2' | '6ème'
          capacite?: number
          salle?: string | null
          titulaire_id?: string | null
          status?: 'active' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      documents_eleves: {
        Row: {
          id: string
          student_id: string
          type_document: string
          nom_fichier: string
          /** Référence publique Storage (bucket privé : préférer signed URL depuis `storage_path`). */
          file_url: string | null
          storage_path: string
          uploaded_by: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          student_id: string
          type_document: string
          nom_fichier: string
          file_url: string
          storage_path: string
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          type_document?: string
          nom_fichier?: string
          file_url?: string | null
          storage_path?: string
          uploaded_by?: string | null
          uploaded_at?: string
        }
      }
    }
  }
}
