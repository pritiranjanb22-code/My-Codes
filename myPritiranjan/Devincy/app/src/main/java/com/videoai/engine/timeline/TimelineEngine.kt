package com.videoai.engine.timeline

import com.videoai.data.model.*
import com.videoai.data.repository.ProjectRepository
import com.videoai.data.repository.MediaRepository
import com.videoai.engine.timeline.EditorCommand.*
import com.videoai.engine.timeline.CommandResult.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID

class TimelineEngine(
    private val projectRepository: ProjectRepository,
    private val mediaRepository: MediaRepository
) {
    suspend fun executeCreateProject(command: CreateProject): CommandResult {
        return Success(command.project, "Project created")
    }
    
    suspend fun executeUpdateProject(command: UpdateProject): CommandResult {
        return Success(command.project, "Project updated")
    }
    
    suspend fun executeDeleteProject(command: DeleteProject): CommandResult {
        return Success(
            Project.create("New Project"),
            "Project deleted"
        )
    }
    
    suspend fun executeAddClip(command: AddClip): CommandResult = withContext(Dispatchers.IO) {
        val project = getProject(command.projectId).await() ?: return@withContext Failure("Project not found")
        val media = mediaRepository.getById(command.clip.mediaId).await() ?: return@withContext Failure("Media not found")
        
        var updatedProject = project
        val track = findOrCreateTrack(updatedProject, command.clip.trackId, command.clip.trackId?.let { findTrack(project, it)?.type } ?: TrackType.VIDEO)
        
        val clip = command.clip.copy(
            id = command.clip.id.takeIf { it.isNotBlank() } ?: UUID.randomUUID().toString(),
            trackId = track.id,
            sourceOut = command.clip.sourceOut.takeIf { it > 0 } ?: media.duration
        )
        
        updatedProject = addClipToProject(updatedProject, track.id, clip)
        return@withContext Success(updatedProject, "Clip added to ${track.name}")
    }
    
    suspend fun executeRemoveClip(command: RemoveClip): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val updatedProject = removeClipFromProject(project, command.clipId)
        return Success(updatedProject, "Clip removed")
    }
    
    suspend fun executeUpdateClip(command: UpdateClip): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val updatedProject = updateClipInProject(project, command.clip)
        return Success(updatedProject, "Clip updated")
    }
    
    suspend fun executeMoveClip(command: MoveClip): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val clip = findClip(project, command.clipId) ?: return Failure("Clip not found")
        
        val newTrackId = command.newTrackId ?: clip.trackId
        val newStartTime = command.newStartTime ?: clip.startTime
        
        val updatedClip = clip.copy(
            trackId = newTrackId,
            startTime = newStartTime
        )
        
        var updatedProject = removeClipFromProject(project, command.clipId)
        updatedProject = addClipToProject(updatedProject, newTrackId, updatedClip)
        
        return Success(updatedProject, "Clip moved")
    }
    
    suspend fun executeSplitClip(command: SplitClip): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val clip = findClip(project, command.clipId) ?: return Failure("Clip not found")
        
        val splitTime = command.time
        if (splitTime <= clip.startTime || splitTime >= clip.endTime) {
            return Failure("Split time must be within clip bounds")
        }
        
        val relativeTime = splitTime - clip.startTime
        val sourceSplitTime = clip.sourceIn + (relativeTime / clip.speed).toLong()
        
        val firstClip = clip.copy(
            id = UUID.randomUUID().toString(),
            duration = relativeTime,
            sourceOut = sourceSplitTime
        )
        
        val secondClip = clip.copy(
            id = UUID.randomUUID().toString(),
            startTime = splitTime,
            duration = clip.duration - relativeTime,
            sourceIn = sourceSplitTime
        )
        
        var updatedProject = removeClipFromProject(project, command.clipId)
        updatedProject = addClipToProject(updatedProject, clip.trackId, firstClip)
        updatedProject = addClipToProject(updatedProject, clip.trackId, secondClip)
        
        return Success(updatedProject, "Clip split into two")
    }
    
    suspend fun executeTrimClip(command: TrimClip): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val clip = findClip(project, command.clipId) ?: return Failure("Clip not found")
        
        val newSourceIn = command.sourceIn ?: clip.sourceIn
        val newSourceOut = command.sourceOut ?: clip.sourceOut
        
        if (newSourceIn >= newSourceOut) {
            return Failure("Invalid trim: source in must be before source out")
        }
        
        val newDuration = ((newSourceOut - newSourceIn) * clip.speed).toLong()
        
        val updatedClip = clip.copy(
            sourceIn = newSourceIn,
            sourceOut = newSourceOut,
            duration = newDuration
        )
        
        val updatedProject = updateClipInProject(project, updatedClip)
        return Success(updatedProject, "Clip trimmed")
    }
    
    suspend fun executeAddTrack(command: AddTrack): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val track = command.track.copy(id = UUID.randomUUID().toString())
        val updatedProject = addTrackToProject(project, track)
        return Success(updatedProject, "Track added: ${track.name}")
    }
    
    suspend fun executeRemoveTrack(command: RemoveTrack): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val updatedProject = removeTrackFromProject(project, command.trackId)
        return Success(updatedProject, "Track removed")
    }
    
    suspend fun executeReorderTracks(command: ReorderTracks): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val updatedProject = reorderTracksInProject(project, command.trackIds)
        return Success(updatedProject, "Tracks reordered")
    }
    
    suspend fun executeUpdateTrack(command: UpdateTrack): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val updatedProject = updateTrackInProject(project, command.track)
        return Success(updatedProject, "Track updated")
    }
    
    suspend fun executeAddEffect(command: AddEffect): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val clip = findClip(project, command.clipId) ?: return Failure("Clip not found")
        
        val effect = command.effect.copy(id = UUID.randomUUID().toString())
        val updatedClip = clip.addEffect(effect)
        val updatedProject = updateClipInProject(project, updatedClip)
        
        return Success(updatedProject, "Effect added: ${effect.type.name}")
    }
    
    suspend fun executeRemoveEffect(command: RemoveEffect): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val clip = findClip(project, command.clipId) ?: return Failure("Clip not found")
        
        val updatedClip = clip.removeEffect(command.effectId)
        val updatedProject = updateClipInProject(project, updatedClip)
        
        return Success(updatedProject, "Effect removed")
    }
    
    suspend fun executeUpdateEffect(command: UpdateEffect): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val clip = findClip(project, command.clipId) ?: return Failure("Clip not found")
        val effect = clip.effects.find { it.id == command.effectId } ?: return Failure("Effect not found")
        
        val updatedEffect = effect.withParameters(command.parameters)
        val updatedClip = clip.effects.map { if (it.id == command.effectId) updatedEffect else it }
            .let { clip.copy(effects = it) }
        
        val updatedProject = updateClipInProject(project, updatedClip)
        return Success(updatedProject, "Effect updated")
    }
    
    suspend fun executeAddKeyframe(command: AddKeyframe): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val clip = findClip(project, command.clipId) ?: return Failure("Clip not found")
        
        val keyframe = command.keyframe.copy(id = UUID.randomUUID().toString())
        val updatedClip = clip.addKeyframe(keyframe)
        val updatedProject = updateClipInProject(project, updatedClip)
        
        return Success(updatedProject, "Keyframe added at ${formatTime(keyframe.time)}")
    }
    
    suspend fun executeRemoveKeyframe(command: RemoveKeyframe): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val clip = findClip(project, command.clipId) ?: return Failure("Clip not found")
        
        val updatedClip = clip.removeKeyframe(command.keyframeId)
        val updatedProject = updateClipInProject(project, updatedClip)
        
        return Success(updatedProject, "Keyframe removed")
    }
    
    suspend fun executeUpdateKeyframe(command: UpdateKeyframe): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val clip = findClip(project, command.clipId) ?: return Failure("Clip not found")
        val keyframe = clip.keyframes.find { it.id == command.keyframeId } ?: return Failure("Keyframe not found")
        
        val updatedKeyframe = keyframe.copy(
            time = command.time ?: keyframe.time,
            value = command.value ?: keyframe.value,
            easing = command.easing ?: keyframe.easing
        )
        
        val updatedClip = clip.keyframes.map { if (it.id == command.keyframeId) updatedKeyframe else it }
            .let { clip.copy(keyframes = it) }
        
        val updatedProject = updateClipInProject(project, updatedClip)
        return Success(updatedProject, "Keyframe updated")
    }
    
    suspend fun executeAddTransition(command: AddTransition): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val fromClip = findClip(project, command.fromClipId) ?: return Failure("From clip not found")
        val toClip = findClip(project, command.toClipId) ?: return Failure("To clip not found")
        
        if (fromClip.trackId != toClip.trackId) {
            return Failure("Clips must be on the same track for transition")
        }
        
        val transition = command.transition.copy(id = UUID.randomUUID().toString())
        val updatedFromClip = fromClip.copy(transitionOut = transition)
        val updatedToClip = toClip.copy(transitionIn = transition)
        
        var updatedProject = updateClipInProject(project, updatedFromClip)
        updatedProject = updateClipInProject(updatedProject, updatedToClip)
        
        return Success(updatedProject, "Transition added: ${transition.type.name}")
    }
    
    suspend fun executeRemoveTransition(command: RemoveTransition): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        
        // Find clips with this transition
        val clipsWithTransition = project.timeline.tracks.flatMap { it.clips }
            .filter { it.transitionIn?.id == command.transitionId || it.transitionOut?.id == command.transitionId }
        
        var updatedProject = project
        for (clip in clipsWithTransition) {
            var updatedClip = clip
            if (clip.transitionIn?.id == command.transitionId) {
                updatedClip = updatedClip.copy(transitionIn = null)
            }
            if (clip.transitionOut?.id == command.transitionId) {
                updatedClip = updatedClip.copy(transitionOut = null)
            }
            updatedProject = updateClipInProject(updatedProject, updatedClip)
        }
        
        return Success(updatedProject, "Transition removed")
    }
    
    suspend fun executeSetSelection(command: SetSelection): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        val updatedProject = project.copy(timeline = project.timeline.copy(selection = command.selection))
        return Success(updatedProject, "Selection updated")
    }
    
    suspend fun executeSetPlaybackState(command: SetPlaybackState): CommandResult {
        val project = getProject(command.projectId).await() ?: return Failure("Project not found")
        return Success(project, "Playback state updated")
    }
    
    // Helper functions
    private suspend fun getProject(projectId: String): Project? {
        return projectRepository.getById(projectId).await()
    }
    
    private fun findClip(project: Project, clipId: String): Clip? {
        return project.timeline.tracks.flatMap { it.clips }.find { it.id == clipId }
    }
    
    private fun findTrack(project: Project, trackId: String): Track? {
        return project.timeline.tracks.find { it.id == trackId }
    }
    
    private fun findOrCreateTrack(project: Project, trackId: String?, trackType: TrackType): Track {
        if (trackId != null) {
            return findTrack(project, trackId) ?: project.timeline.tracks.firstOrNull { it.type == trackType } 
                ?: createDefaultTrack(project, trackType)
        }
        return project.timeline.tracks.firstOrNull { it.type == trackType } 
            ?: createDefaultTrack(project, trackType)
    }
    
    private fun createDefaultTrack(project: Project, type: TrackType): Track {
        val index = project.timeline.tracks.count { it.type == type }
        val track = Track(
            id = "${type.name.toLowerCase()}_${index + 1}",
            type = type,
            index = index,
            name = "${type.name} ${index + 1}"
        )
        return addTrackToProject(project, track).timeline.tracks.find { it.id == track.id }!!
    }
    
    private fun addClipToProject(project: Project, trackId: String, clip: Clip): Project {
        val tracks = project.timeline.tracks.map { track ->
            if (track.id == trackId) {
                track.addClip(clip)
            } else track
        }
        val duration = calculateTimelineDuration(tracks)
        return project.copy(
            timeline = project.timeline.copy(tracks = tracks, duration = duration),
            updatedAt = System.currentTimeMillis()
        )
    }
    
    private fun removeClipFromProject(project: Project, clipId: String): Project {
        val tracks = project.timeline.tracks.map { track ->
            track.removeClip(clipId)
        }
        val duration = calculateTimelineDuration(tracks)
        return project.copy(
            timeline = project.timeline.copy(tracks = tracks, duration = duration),
            updatedAt = System.currentTimeMillis()
        )
    }
    
    private fun updateClipInProject(project: Project, clip: Clip): Project {
        val tracks = project.timeline.tracks.map { track ->
            track.updateClip(clip)
        }
        val duration = calculateTimelineDuration(tracks)
        return project.copy(
            timeline = project.timeline.copy(tracks = tracks, duration = duration),
            updatedAt = System.currentTimeMillis()
        )
    }
    
    private fun addTrackToProject(project: Project, track: Track): Project {
        val tracks = (project.timeline.tracks + track).sortedBy { it.index }
        return project.copy(
            timeline = project.timeline.copy(tracks = tracks),
            updatedAt = System.currentTimeMillis()
        )
    }
    
    private fun removeTrackFromProject(project: Project, trackId: String): Project {
        val tracks = project.timeline.tracks.filter { it.id != trackId }
            .mapIndexed { index, track -> track.copy(index = index) }
        return project.copy(
            timeline = project.timeline.copy(tracks = tracks),
            updatedAt = System.currentTimeMillis()
        )
    }
    
    private fun reorderTracksInProject(project: Project, trackIds: List<String>): Project {
        val trackMap = project.timeline.tracks.associateBy { it.id }
        val tracks = trackIds.mapIndexed { index, id ->
            trackMap[id]!!.copy(index = index)
        }
        return project.copy(
            timeline = project.timeline.copy(tracks = tracks),
            updatedAt = System.currentTimeMillis()
        )
    }
    
    private fun updateTrackInProject(project: Project, track: Track): Project {
        val tracks = project.timeline.tracks.map { t -> if (t.id == track.id) track else t }
        return project.copy(
            timeline = project.timeline.copy(tracks = tracks),
            updatedAt = System.currentTimeMillis()
        )
    }
    
    private fun calculateTimelineDuration(tracks: List<Track>): Long {
        return tracks.flatMap { it.clips }
            .map { it.startTime + it.duration }
            .maxOrNull() ?: 0
    }
    
    private fun formatTime(us: Long): String {
        val totalSeconds = us / 1_000_000
        val minutes = totalSeconds / 60
        val seconds = totalSeconds % 60
        val ms = (us % 1_000_000) / 1000
        return "%02d:%02d.%03d".format(minutes, seconds, ms)
    }
}