package pe.campussabor.app.domain.model

data class DailyMenu(
    val id: String,
    val fecha: String,
    val platoId: String,
    val cantidadPreparada: Int,
    val dish: Dish?
)
