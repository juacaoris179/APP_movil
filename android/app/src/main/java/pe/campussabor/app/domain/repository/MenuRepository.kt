package pe.campussabor.app.domain.repository

import pe.campussabor.app.domain.model.DailyMenu

interface MenuRepository {
    suspend fun getMenuByDate(fecha: String): Result<List<DailyMenu>>
}
