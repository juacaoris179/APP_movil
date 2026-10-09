package pe.campussabor.app.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint
import pe.campussabor.app.ui.navigation.AppNavHost
import pe.campussabor.app.ui.theme.CampusSaborTheme

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CampusSaborTheme {
                val navController = rememberNavController()
                AppNavHost(navController = navController)
            }
        }
    }
}
