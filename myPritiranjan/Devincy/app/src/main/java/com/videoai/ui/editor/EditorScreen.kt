package com.videoai.ui.editor

import android.graphics.Color
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.dragDetection
import androidx.compose.foundation.gestures.onDrag
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.derivedStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Outline
import androidx.compose.ui.graphics.Rect
import androidx.compose.ui.graphics.drawscope.drawRect
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.px
import androidx.compose.ui.unit.sp
import com.videoai.data.model.Clip
import com.videoai.data.model.Project
import com.videoai.data.model.Track
import com.videoai.data.model.TrackType

@Composable
fun EditorScreen(project: Project? = null) {
    var isPlaying by remember { mutableStateOf(false) }
    var currentTime by remember { mutableStateOf(0L) }
    var timelineZoom by remember { mutableStateOf(1f) }
    var timelineOffsetX by remember { mutableStateOf(0f) }
    var selectedClipId by remember { mutableStateOf<String?>(null) }
    var selectedTrackId by remember { mutableStateOf<String?>(null) }
    
    val pixelPerMicrosecond = derivedStateOf { (100 * timelineZoom) / 1_000_000f }
    val totalDuration = project?.timeline?.getTotalDuration() ?: 30_000_000 // 30 seconds default
    val timelineWidthPx = (totalDuration * pixelPerMicrosecond.value).toFloat()
    
    TopAppBar(
        title = { Text(project?.name ?: "Editor", fontWeight = FontWeight.Bold) },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface
        ),
        navigationIcon = { IconButton(onClick = { /* Navigate back */ }) {
            Icon(androidx.compose.material.icons.filled.ArrowBack, contentDescription = "Back")
        }},
        actions = {
            IconButton(onClick = { /* Undo */ }) {
                Icon(androidx.compose.material.icons.filled.Undo, contentDescription = "Undo")
            }
            IconButton(onClick = { /* Redo */ }) {
                Icon(androidx.compose.material.icons.filled.Redo, contentDescription = "Redo")
            }
            IconButton(onClick = { isPlaying = !isPlaying }) {
                Icon(
                    if (isPlaying) androidx.compose.material.icons.filled.Pause else androidx.compose.material.icons.filled.PlayArrow,
                    contentDescription = if (isPlaying) "Pause" else "Play"
                )
            }
            IconButton(onClick = { /* Export */ }) {
                Icon(androidx.compose.material.icons.filedownload, contentDescription = "Export")
            }
            IconButton(onClick = { /* Settings */ }) {
                Icon(androidx.compose.material.icons.filled.Tune, contentDescription = "Settings")
            }
        }
    )
    
    Box(modifier = Modifier.fillMaxSize()) {
        // Main layout: Preview (top) + Timeline (bottom)
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            // Preview Area
            PreviewArea(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(0.5f)
                    .background(Color.Black),
                project = project,
                currentTime = currentTime,
                totalDuration = totalDuration
            )
            
            // Timeline Area
            TimelineArea(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(0.5f)
                    .background(MaterialTheme.colorScheme.surface),
                project = project,
                currentTime = currentTime,
                totalDuration = totalDuration,
                pixelPerMicrosecond = pixelPerMicrosecond.value,
                timelineOffsetX = timelineOffsetX,
                selectedClipId = selectedClipId,
                selectedTrackId = selectedTrackId,
                onClipClick = { clipId, trackId ->
                    selectedClipId = clipId
                    selectedTrackId = trackId
                },
                onTimelineDrag = { dx ->
                    timelineOffsetX = (timelineOffsetX - dx).coerceIn(-timelineWidthPx + 400f, 0f)
                },
                onZoom = { zoom ->
                    timelineZoom = (timelineZoom * zoom).coerceIn(0.1f, 100f)
                }
            )
        }
    }
}

@Composable
fun PreviewArea(
    modifier: Modifier,
    project: Project?,
    currentTime: Long,
    totalDuration: Long
) {
    Box(modifier = modifier) {
        if (project != null) {
            // Video preview would go here - using Media3 ExoPlayer
            Text(
                text = "Preview: ${formatTime(currentTime)} / ${formatTime(totalDuration)}",
                color = Color.White,
                fontSize = 18.sp
            )
        } else {
            Text(
                text = "No project loaded",
                color = Color.Gray,
                fontSize = 18.sp
            )
        }
    }
}

@Composable
fun TimelineArea(
    modifier: Modifier,
    project: Project?,
    currentTime: Long,
    totalDuration: Long,
    pixelPerMicrosecond: Float,
    timelineOffsetX: Float,
    selectedClipId: String?,
    selectedTrackId: String?,
    onClipClick: (String, String) -> Unit,
    onTimelineDrag: (Float) -> Unit,
    onZoom: (Float) -> Unit
) {
    val tracks = project?.timeline?.tracks ?: emptyList()
    val videoTracks = tracks.filter { it.type == TrackType.VIDEO }
    val audioTracks = tracks.filter { it.type == TrackType.AUDIO }
    val textTracks = tracks.filter { it.type == TrackType.TEXT }
    val effectTracks = tracks.filter { it.type == TrackType.EFFECT }
    val overlayTracks = tracks.filter { it.type == TrackType.OVERLAY }
    
    Column(modifier = modifier.fillMaxSize()) {
        // Timeline header with ruler
        TimelineRuler(
            modifier = Modifier
                .fillMaxWidth()
                .height(40.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant),
            totalDuration = totalDuration,
            pixelPerMicrosecond = pixelPerMicrosecond,
            offsetX = timelineOffsetX,
            currentTime = currentTime
        )
        
        // Track headers + clips
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight()
                .verticalScroll(rememberScrollState())
        ) {
            // Video tracks
            TrackSection(
                sectionName = "Video",
                tracks = videoTracks,
                trackColor = MaterialTheme.colorScheme.primary,
                pixelPerMicrosecond = pixelPerMicrosecond,
                offsetX = timelineOffsetX,
                currentTime = currentTime,
                selectedClipId = selectedClipId,
                onClipClick = onClipClick
            )
            
            // Audio tracks
            TrackSection(
                sectionName = "Audio",
                tracks = audioTracks,
                trackColor = MaterialTheme.colorScheme.secondary,
                pixelPerMicrosecond = pixelPerMicrosecond,
                offsetX = timelineOffsetX,
                currentTime = currentTime,
                selectedClipId = selectedClipId,
                onClipClick = onClipClick
            )
            
            // Text tracks
            if (textTracks.isNotEmpty()) {
                TrackSection(
                    sectionName = "Text",
                    tracks = textTracks,
                    trackColor = MaterialTheme.colorScheme.tertiary,
                    pixelPerMicrosecond = pixelPerMicrosecond,
                    offsetX = timelineOffsetX,
                    currentTime = currentTime,
                    selectedClipId = selectedClipId,
                    onClipClick = onClipClick
                )
            }
            
            // Overlay tracks
            if (overlayTracks.isNotEmpty()) {
                TrackSection(
                    sectionName = "Overlay",
                    tracks = overlayTracks,
                    trackColor = MaterialTheme.colorScheme.error,
                    pixelPerMicrosecond = pixelPerMicrosecond,
                    offsetX = timelineOffsetX,
                    currentTime = currentTime,
                    selectedClipId = selectedClipId,
                    onClipClick = onClipClick
                )
            }
        }
    }
}

@Composable
fun TimelineRuler(
    modifier: Modifier,
    totalDuration: Long,
    pixelPerMicrosecond: Float,
    offsetX: Float,
    currentTime: Long
) {
    Canvas(modifier = modifier) {
        val width = size.width
        val height = size.height
        
        // Draw time markers
        val majorInterval = 5_000_000 // 5 seconds
        val minorInterval = 1_000_000 // 1 second
        
        var time = 0L
        while (time <= totalDuration) {
            val x = time * pixelPerMicrosecond + offsetX
            if (x >= 0 && x <= width) {
                val isMajor = time % majorInterval == 0
                drawLine(
                    color = if (isMajor) Color.White else Color.Gray,
                    start = androidx.compose.ui.geometry.Offset(x, if (isMajor) 0f else height * 0.5f),
                    end = androidx.compose.ui.geometry.Offset(x, height.toFloat()),
                    strokeWidth = if (isMajor) 1.5f else 0.5f
                )
                
                if (isMajor && x > 0 && x < width - 50) {
                    drawText(
                        text = formatTime(time),
                        color = Color.White,
                        fontSize = 10.sp,
                        topLeft = androidx.compose.ui.geometry.Offset(x + 2, 2)
                    )
                }
            }
            time += minorInterval
        }
        
        // Draw playhead
        val playheadX = currentTime * pixelPerMicrosecond + offsetX
        if (playheadX >= 0 && playheadX <= width) {
            drawLine(
                color = MaterialTheme.colorScheme.primary,
                start = androidx.compose.ui.geometry.Offset(playheadX, 0f),
                end = androidx.compose.ui.geometry.Offset(playheadX, height.toFloat()),
                strokeWidth = 2f
            )
            // Playhead triangle at top
            drawRect(
                color = MaterialTheme.colorScheme.primary,
                topLeft = androidx.compose.ui.geometry.Offset(playheadX - 6, 0),
                size = androidx.compose.ui.geometry.Size(12, 12)
            )
        }
    }
}

@Composable
fun TrackSection(
    sectionName: String,
    tracks: List<Track>,
    trackColor: Color,
    pixelPerMicrosecond: Float,
    offsetX: Float,
    currentTime: Long,
    selectedClipId: String?,
    onClipClick: (String, String) -> Unit
) {
    if (tracks.isEmpty()) return
    
    Column {
        tracks.forEach { track ->
            TrackRow(
                track = track,
                trackColor = trackColor,
                pixelPerMicrosecond = pixelPerMicrosecond,
                offsetX = offsetX,
                currentTime = currentTime,
                selectedClipId = selectedClipId,
                onClipClick = onClipClick
            )
        }
    }
}

@Composable
fun TrackRow(
    track: Track,
    trackColor: Color,
    pixelPerMicrosecond: Float,
    offsetX: Float,
    currentTime: Long,
    selectedClipId: String?,
    onClipClick: (String, String) -> Unit
) {
    val clips = track.clips
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp)
            .background(if (track.isLocked) Color.DarkGray else MaterialTheme.colorScheme.surface)
    ) {
        // Track header
        Box(
            modifier = Modifier
                .width(120.dp)
                .height(80.dp)
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .padding(8.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = track.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (track.type == TrackType.AUDIO) {
                    Text(
                        text = "Vol: ${(track.volume * 100).toInt()}%",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        
        // Clips area
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(80.dp)
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDrag = { change, dragAmount ->
                            change.consume()
                            // Handle timeline drag
                        }
                    )
                }
        ) {
            clips.forEach { clip ->
                val clipX = (clip.startTime * pixelPerMicrosecond + offsetX).toFloat()
                val clipWidth = (clip.duration * pixelPerMicrosecond).toFloat().coerceAtLeast(20f)
                
                if (clipX + clipWidth > 0 && clipX < 2000) { // Rough viewport check
                    ClipView(
                        clip = clip,
                        trackColor = trackColor,
                        x = clipX,
                        width = clipWidth,
                        isSelected = selectedClipId == clip.id,
                        onClick = { onClipClick(clip.id, track.id) }
                    )
                }
            }
            
            // Playhead line in track
            val playheadX = currentTime * pixelPerMicrosecond + offsetX
            if (playheadX >= 0) {
                androidx.compose.foundation.Canvas(modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer { translationX = playheadX }
                ) {
                    drawLine(
                        color = MaterialTheme.colorScheme.primary,
                        start = androidx.compose.ui.geometry.Offset(0, 0),
                        end = androidx.compose.ui.geometry.Offset(0, 80f),
                        strokeWidth = 2f
                    )
                }
            }
        }
    }
}

@Composable
fun ClipView(
    clip: Clip,
    trackColor: Color,
    x: Float,
    width: Float,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val clipColor = when {
        clip.mediaId.isBlank() && clip.textConfig != null -> MaterialTheme.colorScheme.tertiary
        clip.mediaId.isBlank() -> trackColor
        else -> trackColor
    }
    
    Box(
        modifier = Modifier
            .graphicsLayer { 
                translationX = x
                translationY = 4.dp.toPx()
            }
            .width(width.coerceAtLeast(20f))
            .height(72.dp)
            .background(clipColor.copy(alpha = if (isSelected) 1f else 0.8f))
            .clip(RoundedCornerShape(4.dp))
            .border(if (isSelected) 2.dp else 0.dp, if (isSelected) Color.White else Color.Transparent, RoundedCornerShape(4.dp))
            .fillMaxHeight()
            .clickable { onClick() }
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragStart = { },
                    onDrag = { change, dragAmount ->
                        change.consume()
                        // Handle clip drag
                    }
                )
            }
    ) {
        if (clip.mediaId.isNotBlank()) {
            // Show clip name and waveform placeholder
            Text(
                text = clip.mediaId.substringAfterLast("_").take(15),
                fontSize = 10.sp,
                color = Color.White,
                modifier = Modifier.padding(4.dp)
            )
            
            // Show effects badges
            if (clip.effects.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(4.dp)
                        .align(Alignment.BottomStart),
                    horizontalArrangement = Arrangement.Start
                ) {
                    clip.effects.take(3).forEach { effect ->
                        Box(
                            modifier = Modifier
                                .size(16.dp)
                                .background(Color.White.copy(alpha = 0.3))
                                .clip(RoundedCornerShape(2.dp))
                        ) {
                            Text(
                                text = effect.type.name.substring(0, 2),
                                fontSize = 8.sp,
                                color = Color.White,
                                textAlign = androidx.compose.ui.text.TextAlign.Center,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                }
            }
        } else if (clip.textConfig != null) {
            Text(
                text = "T: ${clip.textConfig!!.text.take(20)}",
                fontSize = 10.sp,
                color = Color.White,
                modifier = Modifier.padding(4.dp)
            )
        }
    }
}

private fun formatTime(us: Long): String {
    val totalSeconds = us / 1_000_000
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "%02d:%02d".format(minutes, seconds)
}