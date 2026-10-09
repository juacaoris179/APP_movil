package pe.campussabor.app.domain.repository

import pe.campussabor.app.domain.model.UserProfile

interface AuthRepository {
    suspend fun signIn(email: String, password: String): Result<UserProfile>
    suspend fun signUp(
        email: String,
        password: String,
        nombre: String,
        codigoEstudiante: String,
        carrera: String
    ): Result<Unit>
    suspend fun getCurrentUser(): UserProfile?
    suspend fun updatePreferences(
        preferencias: List<String>,
        restricciones: List<String>
    ): Result<Unit>
    suspend fun signOut()
}
