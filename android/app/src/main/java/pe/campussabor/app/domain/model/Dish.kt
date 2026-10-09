package pe.campussabor.app.domain.model

data class Dish(
    val id: String,
    val codigo: String,
    val nombre: String,
    val descripcion: String?,
    val componentes: List<String>,
    val precio: Double,
    val calorias: Int?,
    val imagenUrl: String?,
    val activo: Boolean
)
