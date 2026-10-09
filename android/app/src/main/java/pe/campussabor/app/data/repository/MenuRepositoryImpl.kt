package pe.campussabor.app.data.repository

import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.query.Columns
import pe.campussabor.app.data.model.MenuDiaDto
import pe.campussabor.app.domain.model.DailyMenu
import pe.campussabor.app.domain.model.Dish
import pe.campussabor.app.domain.repository.MenuRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MenuRepositoryImpl @Inject constructor(
    private val postgrest: Postgrest
) : MenuRepository {

    override suspend fun getMenuByDate(fecha: String): Result<List<DailyMenu>> = runCatching {
        val dtos = postgrest.from("menu_dia")
            .select(Columns.raw("id, fecha, plato_id, cantidad_preparada, platos(*)")) {
                filter {
                    eq("fecha", fecha)
                }
            }
            .decodeList<MenuDiaDto>()

        dtos.map { dto ->
            val dish = dto.platos?.let { p ->
                Dish(
                    id = p.id,
                    codigo = p.codigo,
                    nombre = p.nombre,
                    descripcion = p.descripcion,
                    componentes = p.componentes,
                    precio = p.precio,
                    calorias = p.calorias,
                    imagenUrl = p.imagenUrl,
                    activo = p.activo
                )
            }

            DailyMenu(
                id = dto.id,
                fecha = dto.fecha,
                platoId = dto.platoId,
                cantidadPreparada = dto.cantidadPreparada,
                dish = dish
            )
        }
    }
}
