package pe.campussabor.app.ui.navigation

sealed class Screen(val route: String) {
    data object Splash : Screen("splash")
    data object Login : Screen("login")
    data object Register : Screen("register")
    data object Menu : Screen("menu")
    data object OrderBuilder : Screen("order_builder/{menuId}") {
        fun createRoute(menuId: String) = "order_builder/$menuId"
    }
    data object MyOrders : Screen("my_orders")
    data object Profile : Screen("profile")
}
