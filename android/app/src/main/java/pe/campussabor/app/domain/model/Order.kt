package pe.campussabor.app.domain.model

data class Order(
    val id: String,
    val numero: Long,
    val estudianteId: String,
    val menuDiaId: String,
    val fecha: String,
    val horaRecojo: String,
    val porcion: String,
    val componentesExcluidos: List<String>,
    val estado: String,
    val total: Double,
    val createdAt: String,
    val dishName: String? = null
)
