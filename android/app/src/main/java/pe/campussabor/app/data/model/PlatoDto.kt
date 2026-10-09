package pe.campussabor.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PlatoDto(
    val id: String,
    val codigo: String,
    val nombre: String,
    val descripcion: String? = null,
    val componentes: List<String> = emptyList(),
    val precio: Double,
    val calorias: Int? = null,
    @SerialName("imagen_url")
    val imagenUrl: String? = null,
    val activo: Boolean = true
)
