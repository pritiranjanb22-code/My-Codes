package com.videoai.data.repository

import android.content.ContentResolver
import android.content.ContentUris
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.MediaStore
import com.videoai.data.model.Media
import com.videoai.data.model.MediaType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID

class MediaScanner(private val context: Context) {
    
    suspend fun scanAllMedia(): ScanResult = withContext(Dispatchers.IO) {
        val videos = scanMedia(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, MediaType.VIDEO)
        val images = scanMedia(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, MediaType.IMAGE)
        val audio = scanMedia(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, MediaType.AUDIO)
        
        val allMedia = videos + images + audio
        ScanResult(
            videos = videos.size,
            images = images.size,
            audio = audio.size,
            total = allMedia.size,
            media = allMedia
        )
    }
    
    suspend fun scanMediaType(type: MediaType): List<Media> = withContext(Dispatchers.IO) {
        val uri = when (type) {
            MediaType.VIDEO -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            MediaType.IMAGE -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            MediaType.AUDIO -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
        }
        scanMedia(uri, type)
    }
    
    private fun scanMedia(uri: Uri, type: MediaType): List<Media> {
        val projection = getProjection(type)
        val sortOrder = getSortOrder(type)
        
        val cursor = context.contentResolver.query(uri, projection, null, null, sortOrder)
            ?: return emptyList()
        
        val mediaList = mutableListOf<Media>()
        
        try {
            while (cursor.moveToNext()) {
                val media = cursorToMedia(cursor, type)
                mediaList.add(media)
            }
        } finally {
            cursor.close()
        }
        
        return mediaList
    }
    
    private fun getProjection(type: MediaType): Array<String> {
        return when (type) {
            MediaType.VIDEO -> arrayOf(
                MediaStore.Video.Media._ID,
                MediaStore.Video.Media.DISPLAY_NAME,
                MediaStore.Video.Media.DATA,
                MediaStore.Video.Media.SIZE,
                MediaStore.Video.Media.MIME_TYPE,
                MediaStore.Video.Media.WIDTH,
                MediaStore.Video.Media.HEIGHT,
                MediaStore.Video.Media.DURATION,
                MediaStore.Video.Media.DATE_ADDED,
                MediaStore.Video.Media.DATE_MODIFIED,
                MediaStore.Video.Media.RELATIVE_PATH
            )
            MediaType.IMAGE -> arrayOf(
                MediaStore.Images.Media._ID,
                MediaStore.Images.Media.DISPLAY_NAME,
                MediaStore.Images.Media.DATA,
                MediaStore.Images.Media.SIZE,
                MediaStore.Images.Media.MIME_TYPE,
                MediaStore.Images.Media.WIDTH,
                MediaStore.Images.Media.HEIGHT,
                MediaStore.Images.Media.DATE_ADDED,
                MediaStore.Images.Media.DATE_MODIFIED,
                MediaStore.Images.Media.RELATIVE_PATH
            )
            MediaType.AUDIO -> arrayOf(
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.DISPLAY_NAME,
                MediaStore.Audio.Media.DATA,
                MediaStore.Audio.Media.SIZE,
                MediaStore.Audio.Media.MIME_TYPE,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.DATE_ADDED,
                MediaStore.Audio.Media.DATE_MODIFIED,
                MediaStore.Audio.Media.RELATIVE_PATH
            )
        }
    }
    
    private fun getSortOrder(type: MediaType): String {
        return when (type) {
            MediaType.VIDEO -> "${MediaStore.Video.Media.DATE_ADDED} DESC"
            MediaType.IMAGE -> "${MediaStore.Images.Media.DATE_ADDED} DESC"
            MediaType.AUDIO -> "${MediaStore.Audio.Media.DATE_ADDED} DESC"
        }
    }
    
    private fun cursorToMedia(cursor: Cursor, type: MediaType): Media {
        val id = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns._ID))
        val displayName = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)) ?: "Unknown"
        val data = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATA))
        val size = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.SIZE))
        val mimeType = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.MIME_TYPE)) ?: ""
        val dateAdded = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_ADDED)) * 1000L
        val dateModified = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.DATE_MODIFIED)) * 1000L
        val relativePath = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.MediaColumns.RELATIVE_PATH))
        
        val contentUri = ContentUris.withAppendedId(getContentUri(type), id)
        val uri = contentUri.toString()
        
        val folder = relativePath?.substringBeforeLast("/") ?: "Unknown"
        
        return when (type) {
            MediaType.VIDEO -> {
                val width = cursor.getInt(cursor.getColumnIndexOrThrow(MediaStore.Video.Media.WIDTH))
                val height = cursor.getInt(cursor.getColumnIndexOrThrow(MediaStore.Video.Media.HEIGHT))
                val duration = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DURATION)) * 1000L // to microseconds
                
                Media(
                    id = UUID.randomUUID().toString(),
                    uri = uri,
                    type = MediaType.VIDEO,
                    name = displayName.substringBeforeLast("."),
                    displayName = displayName,
                    width = width,
                    height = height,
                    duration = duration,
                    fps = 30f,
                    hasAudio = true,
                    fileSize = size,
                    mimeType = mimeType,
                    dateAdded = dateAdded,
                    dateModified = dateModified,
                    folder = folder
                )
            }
            MediaType.IMAGE -> {
                val width = cursor.getInt(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.WIDTH))
                val height = cursor.getInt(cursor.getColumnIndexOrThrow(MediaStore.Images.Media.HEIGHT))
                
                Media(
                    id = UUID.randomUUID().toString(),
                    uri = uri,
                    type = MediaType.IMAGE,
                    name = displayName.substringBeforeLast("."),
                    displayName = displayName,
                    width = width,
                    height = height,
                    duration = 0,
                    fileSize = size,
                    mimeType = mimeType,
                    dateAdded = dateAdded,
                    dateModified = dateModified,
                    folder = folder
                )
            }
            MediaType.AUDIO -> {
                val duration = cursor.getLong(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION)) * 1000L
                val artist = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST)) ?: ""
                val album = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM)) ?: ""
                val title = cursor.getString(cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE)) ?: displayName
                
                Media(
                    id = UUID.randomUUID().toString(),
                    uri = uri,
                    type = MediaType.AUDIO,
                    name = title,
                    displayName = displayName,
                    width = 0,
                    height = 0,
                    duration = duration,
                    hasAudio = true,
                    fileSize = size,
                    mimeType = mimeType,
                    dateAdded = dateAdded,
                    dateModified = dateModified,
                    folder = folder,
                    metadata = mapOf(
                        "artist" to artist,
                        "album" to album,
                        "title" to title
                    )
                )
            }
        }
    }
    
    private fun getContentUri(type: MediaType): Uri {
        return when (type) {
            MediaType.VIDEO -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI
            MediaType.IMAGE -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            MediaType.AUDIO -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI
        }
    }
    
    suspend fun importFromUri(uri: Uri, type: MediaType): Media = withContext(Dispatchers.IO) {
        val resolver = context.contentResolver
        val cursor = resolver.query(uri, null, null, null, null)
            ?: throw IllegalArgumentException("Cannot query URI: $uri")
        
        try {
            if (!cursor.moveToFirst()) {
                throw IllegalArgumentException("Empty result for URI: $uri")
            }
            return cursorToMedia(cursor, type)
        } finally {
            cursor.close()
        }
    }
}

data class ScanResult(
    val videos: Int,
    val images: Int,
    val audio: Int,
    val total: Int,
    val media: List<Media>
)