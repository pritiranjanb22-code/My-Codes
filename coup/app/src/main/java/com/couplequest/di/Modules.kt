package com.couplequest.di

import android.content.Context
import androidx.room.Room
import com.couplequest.data.local.AppDatabase
import com.couplequest.data.local.SettingsDataStore
import com.couplequest.data.repository.ChallengeRepository
import com.couplequest.data.repository.GameRoomRepository
import com.couplequest.data.repository.GameSessionRepository
import com.couplequest.data.repository.SettingsRepository
import com.couplequest.game.engine.ChatManager
import com.couplequest.game.engine.TurnManager
import com.couplequest.multiplayer.transport.TransportFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@dagger.hilt.android.qualifiers.ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "couple_quest_db"
        ).fallbackToDestructiveMigration().build()
    }
}

@Module
@InstallIn(SingletonComponent::class)
object RepositoryModule {

    @Provides
    @Singleton
    fun provideChallengeRepository(database: AppDatabase): ChallengeRepository {
        return ChallengeRepository(database)
    }

    @Provides
    @Singleton
    fun provideGameRoomRepository(database: AppDatabase): GameRoomRepository {
        return GameRoomRepository(database)
    }

    @Provides
    @Singleton
    fun provideGameSessionRepository(database: AppDatabase): GameSessionRepository {
        return GameSessionRepository(database)
    }

    @Provides
    @Singleton
    fun provideSettingsRepository(@dagger.hilt.android.qualifiers.ApplicationContext context: Context): SettingsRepository {
        return SettingsRepository(context)
    }
}

@Module
@InstallIn(SingletonComponent::class)
object GameEngineModule {

    @Provides
    @Singleton
    fun provideTurnManager(challengeRepository: ChallengeRepository): TurnManager {
        return TurnManager(challengeRepository)
    }

    @Provides
    @Singleton
    fun provideChatManager(): ChatManager {
        return ChatManager()
    }
}

@Module
@InstallIn(SingletonComponent::class)
object MultiplayerModule {

    @Provides
    @Singleton
    fun provideTransportFactory(): TransportFactory {
        return TransportFactory()
    }
}

@Module
@InstallIn(SingletonComponent::class)
object DataStoreModule {

    @Provides
    @Singleton
    fun provideSettingsDataStore(@dagger.hilt.android.qualifiers.ApplicationContext context: Context) = 
        SettingsDataStore.getDataStore(context)
}