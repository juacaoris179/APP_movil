package pe.campussabor.app.di

import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import pe.campussabor.app.data.repository.AuthRepositoryImpl
import pe.campussabor.app.data.repository.MenuRepositoryImpl
import pe.campussabor.app.data.repository.OrderRepositoryImpl
import pe.campussabor.app.domain.repository.AuthRepository
import pe.campussabor.app.domain.repository.MenuRepository
import pe.campussabor.app.domain.repository.OrderRepository
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository

    @Binds
    @Singleton
    abstract fun bindMenuRepository(impl: MenuRepositoryImpl): MenuRepository

    @Binds
    @Singleton
    abstract fun bindOrderRepository(impl: OrderRepositoryImpl): OrderRepository
}
