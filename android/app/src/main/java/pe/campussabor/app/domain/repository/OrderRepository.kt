package pe.campussabor.app.domain.repository

import pe.campussabor.app.domain.model.Order

interface OrderRepository {
    suspend fun createOrder(
        menuDiaId: String,
        horaRecojo: String,
        porcion: String,
        componentesExcluidos: List<String>
    ): Result<Unit>

    suspend fun getMyOrders(): Result<List<Order>>

    suspend fun cancelOrder(pedidoId: String): Result<Unit>
}
