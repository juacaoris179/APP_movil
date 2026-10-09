package pe.campussabor.app.data.repository

import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.postgrest.Postgrest
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import pe.campussabor.app.data.model.ProfileDto
import pe.campussabor.app.domain.model.UserProfile
import pe.campussabor.app.domain.repository.AuthRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val auth: Auth,
    private val postgrest: Postgrest
) : AuthRepository {

    override suspend fun signIn(email: String, password: String): Result<UserProfile> = runCatching {
        auth.signInWith(Email) {
            this.email = email
            this.password = password
        }

        val currentUser = auth.currentUserOrNull() ?: error("Usuario no autenticado tras login")
        val profileDto = postgrest.from("profiles")
            .select {
                filter {
                    eq("id", currentUser.id)
                }
            }
            .decodeSingle<ProfileDto>()

        mapProfile(profileDto)
    }

    override suspend fun signUp(
        email: String,
        password: String,
        nombre: String,
        codigoEstudiante: String,
        carrera: String
    ): Result<Unit> = runCatching {
        auth.signUpWith(Email) {
            this.email = email
            this.password = password
            this.data = buildJsonObject {
                put("nombre", nombre)
                put("codigo_estudiante", codigoEstudiante)
                put("carrera", carrera)
            }
        }
    }

    override suspend fun getCurrentUser(): UserProfile? {
        val currentUser = auth.currentUserOrNull() ?: return null
        return try {
            val profileDto = postgrest.from("profiles")
                .select {
                    filter {
                        eq("id", currentUser.id)
                    }
                }
                .decodeSingle<ProfileDto>()
            mapProfile(profileDto)
        } catch (e: Exception) {
            null
        }
    }

    override suspend fun updatePreferences(
        preferencias: List<String>,
        restricciones: List<String>
    ): Result<Unit> = runCatching {
        val currentUser = auth.currentUserOrNull() ?: error("No autenticado")
        postgrest.from("profiles").update(
            buildJsonObject {
                // Supabase serializa arrays
            }
        ) {
            filter {
                eq("id", currentUser.id)
            }
        }
    }

    override suspend fun signOut() {
        auth.signOut()
    }

    private fun mapProfile(dto: ProfileDto): UserProfile {
        return UserProfile(
            id = dto.id,
            codigoEstudiante = dto.codigoEstudiante,
            nombre = dto.nombre,
            carrera = dto.carrera,
            rol = dto.rol,
            preferencias = dto.preferencias,
            restricciones = dto.restricciones,
            activo = dto.activo
        )
    }
}
