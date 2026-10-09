package pe.campussabor.app.ui.screens.order

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import pe.campussabor.app.ui.theme.Amber400
import pe.campussabor.app.ui.theme.Blue400
import pe.campussabor.app.ui.theme.Emerald400
import pe.campussabor.app.ui.theme.Emerald500
import pe.campussabor.app.ui.theme.Rose500
import pe.campussabor.app.ui.theme.Slate100
import pe.campussabor.app.ui.theme.Slate400
import pe.campussabor.app.ui.theme.Slate800
import pe.campussabor.app.ui.theme.Slate900
import pe.campussabor.app.ui.theme.Slate950

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun OrderBuilderScreen(
    onNavigateBack: () -> Unit,
    onOrderPlaced: () -> Unit,
    viewModel: OrderBuilderViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(state.isSuccess) {
        if (state.isSuccess) {
            onOrderPlaced()
        }
    }

    Scaffold(
        containerColor = Slate950,
        topBar = {
            TopAppBar(
                title = { Text("Personalizar Pedido", color = Slate100, fontSize = 18.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver", tint = Slate100)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate900)
            )
        },
        bottomBar = {
            // Barra inferior con Total y Confirmación
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Slate900)
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Total a pagar en caja:", color = Slate400, fontSize = 12.sp)
                        Text(
                            text = "S/. ${String.format("%.2f", state.calculatedTotal)}",
                            color = Emerald400,
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Button(
                        onClick = { viewModel.submitOrder() },
                        enabled = !state.isLoading && state.menuItem != null,
                        colors = ButtonDefaults.buttonColors(containerColor = Emerald500),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.height(48.dp)
                    ) {
                        if (state.isLoading) {
                            CircularProgressIndicator(
                                color = Slate950,
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                text = "Confirmar Pedido",
                                color = Slate950,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        val dish = state.menuItem?.dish

        if (dish == null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Emerald500)
            }
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Resumen del plato
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate900),
                border = BorderStroke(1.dp, Slate800)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "[${dish.codigo}] ${dish.nombre}",
                        color = Slate100,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Precio regular base: S/. ${String.format("%.2f", dish.precio)}",
                        color = Slate400,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Selector de Porción
            Text(
                text = "1. Elige el tamaño de tu porción",
                color = Slate100,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Pagas proporcionalmente y ayudas a no botar comida:",
                color = Slate400,
                fontSize = 12.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                PortionOptionCard(
                    title = "Pequeña",
                    multiplierText = "0.75× precio",
                    price = dish.precio * 0.75,
                    isSelected = state.selectedPortion == "pequena",
                    badgeColor = Amber400,
                    modifier = Modifier.weight(1f),
                    onSelect = { viewModel.selectPortion("pequena") }
                )
                PortionOptionCard(
                    title = "Regular",
                    multiplierText = "1.00× estándar",
                    price = dish.precio,
                    isSelected = state.selectedPortion == "regular",
                    badgeColor = Blue400,
                    modifier = Modifier.weight(1f),
                    onSelect = { viewModel.selectPortion("regular") }
                )
                PortionOptionCard(
                    title = "Grande",
                    multiplierText = "1.25× extra",
                    price = dish.precio * 1.25,
                    isSelected = state.selectedPortion == "grande",
                    badgeColor = Emerald400,
                    modifier = Modifier.weight(1f),
                    onSelect = { viewModel.selectPortion("grande") }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Exclusión de Ingredientes
            Text(
                text = "2. Personaliza tus ingredientes",
                color = Slate100,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Toca para tachar componentes que no deseas en tu plato:",
                color = Slate400,
                fontSize = 12.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                dish.componentes.forEach { comp ->
                    val isExcluded = state.excludedComponents.contains(comp)
                    Card(
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isExcluded) Rose500.copy(alpha = 0.15f) else Slate900
                        ),
                        border = BorderStroke(
                            1.dp,
                            if (isExcluded) Rose500 else Slate800
                        ),
                        modifier = Modifier.clickable { viewModel.toggleComponent(comp) }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Icon(
                                imageVector = if (isExcluded) Icons.Default.Close else Icons.Default.Check,
                                contentDescription = null,
                                tint = if (isExcluded) Rose500 else Emerald400,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.size(6.dp))
                            Text(
                                text = comp,
                                color = if (isExcluded) Rose500 else Slate100,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Horario de Recojo
            Text(
                text = "3. Hora programada de recojo",
                color = Slate100,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "La cocina tendrá tu plato listo a esta hora en la ventanilla:",
                color = Slate400,
                fontSize = 12.sp,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            val timeOptions = listOf("12:00", "12:30", "13:00", "13:30", "14:00", "14:30")
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                timeOptions.forEach { time ->
                    val isSelected = state.selectedPickupTime == time
                    Card(
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) Emerald500.copy(alpha = 0.2f) else Slate900
                        ),
                        border = BorderStroke(
                            1.dp,
                            if (isSelected) Emerald500 else Slate800
                        ),
                        modifier = Modifier.clickable { viewModel.setPickupTime(time) }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Icon(
                                Icons.Default.Schedule,
                                contentDescription = null,
                                tint = if (isSelected) Emerald500 else Slate400,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.size(6.dp))
                            Text(
                                text = time,
                                color = if (isSelected) Emerald400 else Slate100,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        }
                    }
                }
            }

            if (state.error != null) {
                Text(
                    text = state.error!!,
                    color = Rose500,
                    fontSize = 13.sp,
                    modifier = Modifier.padding(top = 16.dp)
                )
            }

            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
private fun PortionOptionCard(
    title: String,
    multiplierText: String,
    price: Double,
    isSelected: Boolean,
    badgeColor: Color,
    modifier: Modifier = Modifier,
    onSelect: () -> Unit
) {
    Card(
        modifier = modifier.clickable { onSelect() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) Slate800 else Slate900
        ),
        border = BorderStroke(
            1.5.dp,
            if (isSelected) Emerald500 else Slate800
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = title, color = badgeColor, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Text(text = multiplierText, color = Slate400, fontSize = 10.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "S/. ${String.format("%.2f", price)}",
                color = Slate100,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}
