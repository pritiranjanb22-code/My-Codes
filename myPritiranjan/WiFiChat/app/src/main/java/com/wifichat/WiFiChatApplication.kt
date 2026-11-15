package com.wifichat

import android.app.Application
import android.content.Context
import com.wifichat.data.dao.AppDatabase
import com.wifichat.data.repository.*
import com.wifichat.engine.discovery.DiscoveryService
import com.wifichat.engine.signaling.SignalingService
import com.wifichat.engine.webrtc.WebRTCEngine
import dagger.hilt.android.HiltAndroidApp
import dagger.hilt.android.EntryPointAccessors
import dagger.hilt.android.EntryPoints
import javax.inject.Inject
import javax.inject.Singleton

@HiltAndroidApp
class WiFiChatApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize WebRTC
        WebRTCEngine.initialize(this)
        
        // Initialize database
        AppDatabase.getInstance(this)
    }
    
    companion object {
        lateinit var instance: WiFiChatApplication
            private set
    }
}

@dagger.Module
@InstallIn(dagger.hilt.components.SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@dagger.hilt.android.qualifiers.ApplicationContext context: Context): AppDatabase {
        return AppDatabase.getInstance(context)
    }
    
    @Provides
    @Singleton
    fun provideUserDao(database: AppDatabase): com.wifichat.data.dao.UserDao {
        return database.userDao()
    }
    
    @Provides
    @Singleton
    fun provideContactDao(database: AppDatabase): com.wifichat.data.dao.ContactDao {
        return database.contactDao()
    }
    
    @Provides
    @Singleton
    fun provideConversationDao(database: AppDatabase): com.wifichat.data.dao.ConversationDao {
        return database.conversationDao()
    }
    
    @Provides
    @Singleton
    fun provideMessageDao(database: AppDatabase): com.wifichat.data.dao.MessageDao {
        return database.messageDao()
    }
    
    @Provides
    @Singleton
    fun provideCallLogDao(database: AppDatabase): com.wifichat.data.dao.CallLogDao {
        return database.callLogDao()
    }
}

@dagger.Module
@InstallIn(dagger.hilt.components.SingletonComponent::class)
object RepositoryModule {
    @Provides
    @Singleton
    fun provideUserRepository(dao: com.wifichat.data.dao.UserDao): UserRepository {
        return UserRepository(dao)
    }
    
    @Provides
    @Singleton
    fun provideContactRepository(dao: com.wifichat.data.dao.ContactDao): ContactRepository {
        return ContactRepository(dao)
    }
    
    @Provides
    @Singleton
    fun provideConversationRepository(dao: com.wifichat.data.dao.ConversationDao): ConversationRepository {
        return ConversationRepository(dao)
    }
    
    @Provides
    @Singleton
    fun provideMessageRepository(dao: com.wifichat.data.dao.MessageDao): MessageRepository {
        return MessageRepository(dao)
    }
    
    @Provides
    @Singleton
    fun provideCallLogRepository(dao: com.wifichat.data.dao.CallLogDao): CallLogRepository {
        return CallLogRepository(dao)
    }
}

@dagger.Module
@InstallIn(dagger.hilt.components.SingletonComponent::class)
object EngineModule {
    @Provides
    @Singleton
    fun provideWebRTCEngine(
        @dagger.hilt.android.qualifiers.ApplicationContext context: Context
    ): WebRTCEngine {
        val config = com.wifichat.data.model.WebRTCConfig()
        return WebRTCEngine(context, config)
    }
    
    @Provides
    @Singleton
    fun provideSignalingService(): SignalingService {
        // This will be started as a service
        return SignalingService()
    }
    
    @Provides
    @Singleton
    fun provideDiscoveryService(): DiscoveryService {
        return DiscoveryService()
    }
}

// Entry points for services
class SignalingEntryPoint : EntryPoints.EntryPoint {
    fun signalingService(): SignalingService
}

class DiscoveryEntryPoint : EntryPoints.EntryPoint {
    fun discoveryService(): DiscoveryService
}