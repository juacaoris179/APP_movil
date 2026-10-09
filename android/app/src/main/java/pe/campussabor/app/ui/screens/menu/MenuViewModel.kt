package pe.campussabor.app.ui.screens.menu

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pe.campussabor.app.domain.model.DailyMenu
import pe.campussabor.app.domain.repository.MenuRepository
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

data class MenuUiState(
    val isLoading: Boolean = false,
    val menuItems: List<DailyMenu> = emptyList(),
    val error: String? = null,
    val currentDate: String = ""
)

@HiltViewModel
class MenuViewModel @Inject constructor(
    private val menuRepository: MenuRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MenuUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadTodayMenu()
    }

    fun loadTodayMenu() {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        _uiState.update { it.copy(isLoading = true, error = null, currentDate = today) }

        viewModelScope.launch {
            val result = menuRepository.getMenuByDate(today)
            result.fold(
                onSuccess = { items ->
                    _uiState.update { it.copy(isLoading = false, menuItems = items) }
                },
                onFailure = { ex ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = ex.message ?: "No se pudo cargar el menú del día"
                        )
                    }
                }
            )
        }
    }
}
