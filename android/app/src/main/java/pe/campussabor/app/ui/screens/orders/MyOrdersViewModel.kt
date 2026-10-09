package pe.campussabor.app.ui.screens.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import pe.campussabor.app.domain.model.Order
import pe.campussabor.app.domain.repository.OrderRepository
import javax.inject.Inject

data class MyOrdersUiState(
    val isLoading: Boolean = false,
    val orders: List<Order> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class MyOrdersViewModel @Inject constructor(
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MyOrdersUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadOrders()
    }

    fun loadOrders() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            val res = orderRepository.getMyOrders()
            res.fold(
                onSuccess = { list ->
                    _uiState.update { it.copy(isLoading = false, orders = list) }
                },
                onFailure = { ex ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = ex.message ?: "No se pudieron cargar tus pedidos"
                        )
                    }
                }
            )
        }
    }

    fun cancelOrder(orderId: String) {
        viewModelScope.launch {
            val res = orderRepository.cancelOrder(orderId)
            if (res.isSuccess) {
                loadOrders()
            }
        }
    }
}
