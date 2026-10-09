package pe.campussabor.app.ui.screens.order

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pe.campussabor.app.domain.model.DailyMenu
import pe.campussabor.app.domain.repository.MenuRepository
import pe.campussabor.app.domain.repository.OrderRepository
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import javax.inject.Inject

data class OrderBuilderUiState(
    val isLoading: Boolean = false,
    val menuItem: DailyMenu? = null,
    val selectedPortion: String = "regular",
    val excludedComponents: Set<String> = emptySet(),
    val selectedPickupTime: String = "12:30",
    val calculatedTotal: Double = 0.0,
    val isSuccess: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class OrderBuilderViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val menuRepository: MenuRepository,
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val menuId: String = checkNotNull(savedStateHandle["menuId"])

    private val _uiState = MutableStateFlow(OrderBuilderUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadMenuDetail()
    }

    private fun loadMenuDetail() {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val res = menuRepository.getMenuByDate(today)
            res.fold(
                onSuccess = { list ->
                    val item = list.find { it.id == menuId }
                    if (item != null) {
                        val basePrice = item.dish?.precio ?: 10.0
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                menuItem = item,
                                calculatedTotal = basePrice
                            )
                        }
                    } else {
                        _uiState.update { it.copy(isLoading = false, error = "Plato no encontrado") }
                    }
                },
                onFailure = { ex ->
                    _uiState.update { it.copy(isLoading = false, error = ex.message) }
                }
            )
        }
    }

    fun selectPortion(portion: String) {
        val basePrice = _uiState.value.menuItem?.dish?.precio ?: 10.0
        val multiplier = when (portion) {
            "pequena" -> 0.75
            "grande" -> 1.25
            else -> 1.00
        }
        val newTotal = Math.round(basePrice * multiplier * 100.0) / 100.0

        _uiState.update {
            it.copy(
                selectedPortion = portion,
                calculatedTotal = newTotal
            )
        }
    }

    fun toggleComponent(component: String) {
        _uiState.update { current ->
            val set = current.excludedComponents.toMutableSet()
            if (set.contains(component)) {
                set.remove(component)
            } else {
                set.add(component)
            }
            current.copy(excludedComponents = set)
        }
    }

    fun setPickupTime(time: String) {
        _uiState.update { it.copy(selectedPickupTime = time) }
    }

    fun submitOrder() {
        val current = _uiState.value
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val res = orderRepository.createOrder(
                menuDiaId = menuId,
                horaRecojo = current.selectedPickupTime,
                porcion = current.selectedPortion,
                componentesExcluidos = current.excludedComponents.toList()
            )
            res.fold(
                onSuccess = {
                    _uiState.update { it.copy(isLoading = false, isSuccess = true) }
                },
                onFailure = { ex ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = ex.message ?: "No se pudo procesar el pedido"
                        )
                    }
                }
            )
        }
    }
}
