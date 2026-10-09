package pe.campussabor.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MenuDiaDto(
    val id: String,
    val fecha: String,
    @SerialName("plato_id")
    val platoId: String,
    @SerialName("cantidad_preparada")
    val cantidadPreparada: Int = 0,
    val platos: PlatoDto? = null
)
