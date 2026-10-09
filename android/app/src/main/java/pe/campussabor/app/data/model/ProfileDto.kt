package pe.campussabor.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProfileDto(
    val id: String,
    @SerialName("codigo_estudiante")
    val codigoEstudiante: String? = null,
    val nombre: String,
    val carrera: String? = null,
    val rol: String = "estudiante",
    val preferencias: List<String> = emptyList(),
    val restricciones: List<String> = emptyList(),
    val activo: Boolean = true
)
