package pe.campussabor.app.domain.model

data class UserProfile(
    val id: String,
    val codigoEstudiante: String?,
    val nombre: String,
    val carrera: String?,
    val rol: String,
    val preferencias: List<String>,
    val restricciones: List<String>,
    val activo: Boolean
)
