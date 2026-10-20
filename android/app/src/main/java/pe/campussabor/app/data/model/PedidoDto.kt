package pe.campussabor.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PedidoPlatoDto(
    val nombre: String = ""
)

@Serializable
data class PedidoMenuDiaDto(
    val platos: PedidoPlatoDto? = null
)

@Serializable
data class PedidoDto(
    val id: String? = null,
    val numero: Long? = null,
    @SerialName("estudiante_id")
    val estudianteId: String,
    @SerialName("menu_dia_id")
    val menuDiaId: String,
    val fecha: String? = null,
    @SerialName("hora_recojo")
    val horaRecojo: String,
    val porcion: String = "regular",
    @SerialName("componentes_excluidos")
    val componentesExcluidos: List<String> = emptyList(),
    val estado: String = "pendiente",
    val total: Double? = null,
    @SerialName("created_at")
    val createdAt: String? = null,
    @SerialName("menu_dia")
    val menuDia: PedidoMenuDiaDto? = null
)

@Serializable
data class CreatePedidoDto(
    @SerialName("estudiante_id")
    val estudianteId: String,
    @SerialName("menu_dia_id")
    val menuDiaId: String,
    @SerialName("hora_recojo")
    val horaRecojo: String,
    val porcion: String = "regular",
    @SerialName("componentes_excluidos")
    val componentesExcluidos: List<String> = emptyList(),
    val estado: String = "pendiente"
)
