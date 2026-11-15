package com.videoai.mcp.auth

import android.content.Context
import android.content.SharedPreferences
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.io.IOException
import java.security.KeyStore
import java.security.KeyStoreException
import java.security.NoSuchAlgorithmException
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class AuthManager(private val context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("videoai_auth", Context.MODE_PRIVATE)
    private val KEY_ALIAS = "videoai_mcp_token"
    private val ANDROID_KEY_STORE = "AndroidKeyStore"
    private val AES_GCM_NOPADDING = "AES/GCM/NoPadding"
    
    companion object {
        const val DEFAULT_PORT = 8765
        const val PREFS_TOKEN = "mcp_token_encrypted"
        const val PREFS_PORT = "mcp_port"
        const val PREFS_AUTOMATION_MODE = "automation_mode"
    }
    
    fun getOrCreateToken(): String {
        return prefs.getString(PREFS_TOKEN, "")?.let { decryptToken(it) } 
            ?: generateAndStoreToken()
    }
    
    fun regenerateToken(): String {
        return generateAndStoreToken()
    }
    
    private fun generateAndStoreToken(): String {
        val token = generateSecureToken()
        val encrypted = encryptToken(token)
        prefs.edit().putString(PREFS_TOKEN, encrypted).apply()
        return token
    }
    
    private fun generateSecureToken(): String {
        val random = SecureRandom()
        val bytes = ByteArray(32)
        random.nextBytes(bytes)
        return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP)
    }
    
    private fun encryptToken(token: String): String {
        try {
            val key = getOrCreateKey()
            val cipher = Cipher.getInstance(AES_GCM_NOPADDING)
            cipher.init(Cipher.ENCRYPT_MODE, key)
            val encrypted = cipher.doFinal(token.toByteArray())
            val iv = cipher.iv
            val combined = ByteArray(iv.size + encrypted.size)
            System.arraycopy(iv, 0, combined, 0, iv.size)
            System.arraycopy(encrypted, 0, combined, iv.size, encrypted.size)
            return Base64.encodeToString(combined, Base64.URL_SAFE or Base64.NO_WRAP)
        } catch (e: Exception) {
            // Fallback to plain storage if encryption fails
            return Base64.encodeToString(token.toByteArray(), Base64.URL_SAFE or Base64.NO_WRAP)
        }
    }
    
    private fun decryptToken(encryptedToken: String): String {
        try {
            val key = getOrCreateKey()
            val combined = Base64.decode(encryptedToken, Base64.URL_SAFE or Base64.NO_WRAP)
            val iv = combined.copyOfRange(0, 12)
            val encrypted = combined.copyOfRange(12, combined.size)
            
            val cipher = Cipher.getInstance(AES_GCM_NOPADDING)
            cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, iv))
            val decrypted = cipher.doFinal(encrypted)
            return String(decrypted)
        } catch (e: Exception) {
            // Fallback for old unencrypted tokens
            return String(Base64.decode(encryptedToken, Base64.URL_SAFE or Base64.NO_WRAP))
        }
    }
    
    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEY_STORE)
        keyStore.load(null)
        
        if (!keyStore.containsAlias(KEY_ALIAS)) {
            val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEY_STORE)
            keyGenerator.init(KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build())
            return keyGenerator.generateKey()
        }
        
        return keyStore.getKey(KEY_ALIAS, null) as SecretKey
    }
    
    fun getPort(): Int {
        return prefs.getInt(PREFS_PORT, DEFAULT_PORT)
    }
    
    fun setPort(port: Int) {
        prefs.edit().putInt(PREFS_PORT, port).apply()
        // Restart server would be needed
    }
    
    fun isAutomationMode(): Boolean {
        return prefs.getBoolean(PREFS_AUTOMATION_MODE, false)
    }
    
    fun setAutomationMode(enabled: Boolean) {
        prefs.edit().putBoolean(PREFS_AUTOMATION_MODE, enabled).apply()
    }
    
    fun getConnectionUrl(): String {
        val host = getLocalHostname()
        val port = getPort()
        val token = getOrCreateToken()
        return "ws://$host:$port/mcp?token=$token"
    }
    
    fun getQrCodeData(): String {
        val host = getLocalHostname()
        val port = getPort()
        val token = getOrCreateToken()
        return "videoai://connect?host=$host&port=$port&token=$token"
    }
    
    private fun getLocalHostname(): String {
        try {
            return java.net.InetAddress.getLocalHost().hostName
        } catch (e: Exception) {
            return "videoai-phone.local"
        }
    }
}