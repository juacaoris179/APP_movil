package pe.campussabor.app.data.repository

import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order as SupabaseOrder
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import pe.campussabor.app.data.model.PedidoDto
import pe.campussabor.app.domain.model.Order
import pe.campussabor.app.domain.repository.OrderRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrderRepositoryImpl @Inject constructor(
    private val auth: Auth,
    private val postgrest: Postgrest
) : OrderRepository {

    override suspend fun createOrder(
        menuDiaId: String,
        horaRecojo: String,
        porcion: String,
        componentesExcluidos: List<String>
    ): Result<Unit> = runCatching {
        val currentUser = auth.currentUserOrNull() ?: error("Usuario no autenticado")

        val pedidoDto = PedidoDto(
            estudianteId = currentUser.id,
            menuDiaId = menuDiaId,
            horaRecojo = horaRecojo,
            porcion = porcion,
            componentesExcluidos = componentesExcluidos,
            estado = "pendiente"
        )

        // Se inserta en 'pedidos'. El trigger de PostgreSQL se encarga de calcular el total y la fecha.
        postgrest.from("pedidos").insert(pedidoDto)
    }

    override suspend fun getMyOrders(): Result<List<Order>> = runCatching {
        val currentUser = auth.currentUserOrNull() ?: error("Usuario no autenticado")

        val dtos = postgrest.from("pedidos")
            .select(Columns.raw("id, numero, estudiante_id, menu_dia_id, fecha, hora_recojo, porcion, componentes_excluidos, estado, total, created_at, menu_dia(platos(nombre))")) {
                filter {
                    eq("estudiante_id", currentUser.id)
                }
                order("created_at", SupabaseOrder.DESCENDING)
            }
            .decodeList<PedidoDto>()

        dtos.map { dto ->
            Order(
                id = dto.id ?: "",
                numero = dto.numero ?: 0L,
                estudianteId = dto.estudianteId,
                menuDiaId = dto.menuDiaId,
                fecha = dto.fecha ?: "",
                horaRecojo = dto.horaRecojo,
                porcion = dto.porcion,
                componentesExcluidos = dto.componentesExcluidos,
                estado = dto.estado,
                total = dto.total ?: 0.0,
                createdAt = dto.createdAt ?: "",
                dishName = dto.menuDia?.platos?.nombre
            )
        }
    }

    override suspend fun cancelOrder(pedidoId: String): Result<Unit> = runCatching {
        val currentUser = auth.currentUserOrNull() ?: error("Usuario no autenticado")

        postgrest.from("pedidos").update(
            buildJsonObject {
                put("estado", "cancelado")
            }
        ) {
            filter {
                eq("id", pedidoId)
                eq("estudiante_id", currentUser.id)
                eq("estado", "pendiente")
            }
        }
    }
}
