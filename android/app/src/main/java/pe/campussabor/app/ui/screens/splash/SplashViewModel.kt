package pe.campussabor.app.ui.screens.splash

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import pe.campussabor.app.domain.repository.AuthRepository
import pe.campussabor.app.ui.navigation.Screen
import javax.inject.Inject

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _navigationEvent = MutableSharedFlow<String>(replay = 1)
    val navigationEvent = _navigationEvent.asSharedFlow()

    init {
        checkSession()
    }

    private fun checkSession() {
        viewModelScope.launch {
            kotlinx.coroutines.delay(800)
            val user = authRepository.getCurrentUser()
            if (user != null && user.activo) {
                _navigationEvent.emit(Screen.Menu.route)
            } else {
                _navigationEvent.emit(Screen.Login.route)
            }
        }
    }
}
