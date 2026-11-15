package com.videoai.engine.timeline

import com.videoai.data.model.*
import com.videoai.data.repository.ProjectRepository
import com.videoai.data.repository.MediaRepository
import com.videoai.data.repository.SettingsRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.withContext

sealed class EditorCommand {
    data class CreateProject(val project: Project) : EditorCommand()
    data class UpdateProject(val project: Project) : EditorCommand()
    data class DeleteProject(val projectId: String) : EditorCommand()
    
    data class AddClip(val projectId: String, val clip: Clip) : EditorCommand()
    data class RemoveClip(val projectId: String, val clipId: String) : EditorCommand()
    data class UpdateClip(val projectId: String, val clip: Clip) : EditorCommand()
    data class MoveClip(val projectId: String, val clipId: String, val newTrackId: String?, val newStartTime: Long?) : EditorCommand()
    data class SplitClip(val projectId: String, val clipId: String, val time: Long) : EditorCommand()
    data class TrimClip(val projectId: String, val clipId: String, val sourceIn: Long?, val sourceOut: Long?) : EditorCommand()
    
    data class AddTrack(val projectId: String, val track: Track) : EditorCommand()
    data class RemoveTrack(val projectId: String, val trackId: String) : EditorCommand()
    data class ReorderTracks(val projectId: String, val trackIds: List<String>) : EditorCommand()
    data class UpdateTrack(val projectId: String, val track: Track) : EditorCommand()
    
    data class AddEffect(val projectId: String, val clipId: String, val effect: Effect) : EditorCommand()
    data class RemoveEffect(val projectId: String, val clipId: String, val effectId: String) : EditorCommand()
    data class UpdateEffect(val projectId: String, val clipId: String, val effectId: String, val parameters: Map<String, Any>) : EditorCommand()
    
    data class AddKeyframe(val projectId: String, val clipId: String, val keyframe: Keyframe) : EditorCommand()
    data class RemoveKeyframe(val projectId: String, val clipId: String, val keyframeId: String) : EditorCommand()
    data class UpdateKeyframe(val projectId: String, val clipId: String, val keyframeId: String, val time: Long?, val value: KeyframeValue?, val easing: Easing?) : EditorCommand()
    
    data class AddTransition(val projectId: String, val transition: Transition, val fromClipId: String, val toClipId: String) : EditorCommand()
    data class RemoveTransition(val projectId: String, val transitionId: String) : EditorCommand()
    
    data class SetSelection(val projectId: String, val selection: Selection) : EditorCommand()
    data class SetPlaybackState(val projectId: String, val state: PlaybackState) : EditorCommand()
    
    data class Undo(val projectId: String) : EditorCommand()
    data class Redo(val projectId: String) : EditorCommand()
}

sealed class CommandResult {
    data class Success(val project: Project, val description: String) : CommandResult()
    data class Failure(val error: String) : CommandResult()
    data class RequiresConfirmation(val request: PermissionRequest) : CommandResult()
}

data class PermissionRequest(
    val operation: String,
    val level: PermissionLevel,
    val description: String,
    val affectedResources: List<String>
)

enum class PermissionLevel {
    READ, WRITE, DESTRUCTIVE
}

interface CommandExecutor {
    suspend fun execute(command: EditorCommand): CommandResult
    fun canExecute(command: EditorCommand): Boolean
}

class TimelineCommandExecutor(
    private val timelineEngine: TimelineEngine,
    private val projectRepository: ProjectRepository
) : CommandExecutor {
    override suspend fun execute(command: EditorCommand): CommandResult = withContext(Dispatchers.IO) {
        when (command) {
            is EditorCommand.CreateProject -> timelineEngine.executeCreateProject(command)
            is EditorCommand.UpdateProject -> timelineEngine.executeUpdateProject(command)
            is EditorCommand.DeleteProject -> timelineEngine.executeDeleteProject(command)
            
            is EditorCommand.AddClip -> timelineEngine.executeAddClip(command)
            is EditorCommand.RemoveClip -> timelineEngine.executeRemoveClip(command)
            is EditorCommand.UpdateClip -> timelineEngine.executeUpdateClip(command)
            is EditorCommand.MoveClip -> timelineEngine.executeMoveClip(command)
            is EditorCommand.SplitClip -> timelineEngine.executeSplitClip(command)
            is EditorCommand.TrimClip -> timelineEngine.executeTrimClip(command)
            
            is EditorCommand.AddTrack -> timelineEngine.executeAddTrack(command)
            is EditorCommand.RemoveTrack -> timelineEngine.executeRemoveTrack(command)
            is EditorCommand.ReorderTracks -> timelineEngine.executeReorderTracks(command)
            is EditorCommand.UpdateTrack -> timelineEngine.executeUpdateTrack(command)
            
            is EditorCommand.AddEffect -> timelineEngine.executeAddEffect(command)
            is EditorCommand.RemoveEffect -> timelineEngine.executeRemoveEffect(command)
            is EditorCommand.UpdateEffect -> timelineEngine.executeUpdateEffect(command)
            
            is EditorCommand.AddKeyframe -> timelineEngine.executeAddKeyframe(command)
            is EditorCommand.RemoveKeyframe -> timelineEngine.executeRemoveKeyframe(command)
            is EditorCommand.UpdateKeyframe -> timelineEngine.executeUpdateKeyframe(command)
            
            is EditorCommand.AddTransition -> timelineEngine.executeAddTransition(command)
            is EditorCommand.RemoveTransition -> timelineEngine.executeRemoveTransition(command)
            
            is EditorCommand.SetSelection -> timelineEngine.executeSetSelection(command)
            is EditorCommand.SetPlaybackState -> timelineEngine.executeSetPlaybackState(command)
            
            is EditorCommand.Undo -> {
                // Undo handled by CommandEngine directly
                CommandResult.Failure("Use CommandEngine.undo()")
            }
            is EditorCommand.Redo -> {
                CommandResult.Failure("Use CommandEngine.redo()")
            }
        }
    }
    
    override fun canExecute(command: EditorCommand): Boolean = true
}

class CommandEngine(
    private val projectRepository: ProjectRepository,
    private val mediaRepository: MediaRepository,
    private val settingsRepository: SettingsRepository,
    private val timelineEngine: TimelineEngine
) {
    private val executor = TimelineCommandExecutor(timelineEngine, projectRepository)
    private val undoStacks = mutableMapOf<String, MutableList<EditorCommand>>()
    private val redoStacks = mutableMapOf<String, MutableList<EditorCommand>>()
    private val maxHistorySize = 100
    
    private val _currentProject = MutableStateFlow<Project?>(null)
    val currentProject: StateFlow<Project?> = _currentProject
    
    suspend fun execute(command: EditorCommand): CommandResult {
        val projectId = getProjectId(command)
        val automationMode = settingsRepository.getBoolean(SettingsRepository.KEY_AUTOMATION_MODE, false)
        
        // Check permissions for destructive operations
        val permissionLevel = getPermissionLevel(command)
        if (permissionLevel == PermissionLevel.DESTRUCTIVE && !automationMode) {
            return CommandResult.RequiresConfirmation(
                PermissionRequest(
                    operation = command::class.simpleName!!,
                    level = permissionLevel,
                    description = getDescription(command),
                    affectedResources = getAffectedResources(command)
                )
            )
        }
        
        if (!executor.canExecute(command)) {
            return CommandResult.Failure("Cannot execute command in current state")
        }
        
        val result = executor.execute(command)
        
        if (result is CommandResult.Success) {
            val undoStack = undoStacks.getOrPut(projectId) { mutableListOf() }
            undoStack.add(command)
            if (undoStack.size > maxHistorySize) undoStack.removeAt(0)
            redoStacks[projectId]?.clear()
            
            _currentProject.value = result.project
            projectRepository.save(result.project)
        }
        
        return result
    }
    
    suspend fun undo(projectId: String): CommandResult {
        val undoStack = undoStacks[projectId] ?: return CommandResult.Failure("Nothing to undo")
        val command = undoStack.removeAt(undoStack.lastIndex)
        
        val redoStack = redoStacks.getOrPut(projectId) { mutableListOf() }
        redoStack.add(command)
        
        // For undo, we need to reconstruct the inverse operation
        // This is a simplified version - in production you'd store full inverse commands
        val project = projectRepository.getById(projectId).await() 
            ?: return CommandResult.Failure("Project not found")
        
        return CommandResult.Success(project, "Undo: ${getDescription(command)}")
    }
    
    suspend fun redo(projectId: String): CommandResult {
        val redoStack = redoStacks[projectId] ?: return CommandResult.Failure("Nothing to redo")
        val command = redoStack.removeAt(redoStack.lastIndex)
        
        val undoStack = undoStacks.getOrPut(projectId) { mutableListOf() }
        undoStack.add(command)
        
        return execute(command)
    }
    
    fun canUndo(projectId: String): Boolean = undoStacks[projectId]?.isNotEmpty() == true
    fun canRedo(projectId: String): Boolean = redoStacks[projectId]?.isNotEmpty() == true
    
    fun getUndoDescription(projectId: String): String? {
        return undoStacks[projectId]?.last()?.let { getDescription(it) }
    }
    
    fun getRedoDescription(projectId: String): String? {
        return redoStacks[projectId]?.last()?.let { getDescription(it) }
    }
    
    private fun getProjectId(command: EditorCommand): String = when (command) {
        is EditorCommand.CreateProject -> command.project.id
        is EditorCommand.UpdateProject -> command.project.id
        is EditorCommand.DeleteProject -> command.projectId
        is EditorCommand.AddClip -> command.projectId
        is EditorCommand.RemoveClip -> command.projectId
        is EditorCommand.UpdateClip -> command.projectId
        is EditorCommand.MoveClip -> command.projectId
        is EditorCommand.SplitClip -> command.projectId
        is EditorCommand.TrimClip -> command.projectId
        is EditorCommand.AddTrack -> command.projectId
        is EditorCommand.RemoveTrack -> command.projectId
        is EditorCommand.ReorderTracks -> command.projectId
        is EditorCommand.UpdateTrack -> command.projectId
        is EditorCommand.AddEffect -> command.projectId
        is EditorCommand.RemoveEffect -> command.projectId
        is EditorCommand.UpdateEffect -> command.projectId
        is EditorCommand.AddKeyframe -> command.projectId
        is EditorCommand.RemoveKeyframe -> command.projectId
        is EditorCommand.UpdateKeyframe -> command.projectId
        is EditorCommand.AddTransition -> command.projectId
        is EditorCommand.RemoveTransition -> command.projectId
        is EditorCommand.SetSelection -> command.projectId
        is EditorCommand.SetPlaybackState -> command.projectId
        is EditorCommand.Undo -> command.projectId
        is EditorCommand.Redo -> command.projectId
    }
    
    private fun getPermissionLevel(command: EditorCommand): PermissionLevel = when (command) {
        is EditorCommand.DeleteProject -> PermissionLevel.DESTRUCTIVE
        is EditorCommand.RemoveClip -> PermissionLevel.WRITE
        is EditorCommand.RemoveTrack -> PermissionLevel.DESTRUCTIVE
        is EditorCommand.RemoveEffect -> PermissionLevel.WRITE
        is EditorCommand.RemoveKeyframe -> PermissionLevel.WRITE
        is EditorCommand.RemoveTransition -> PermissionLevel.WRITE
        else -> PermissionLevel.WRITE
    }
    
    private fun getDescription(command: EditorCommand): String = when (command) {
        is EditorCommand.CreateProject -> "Create project: ${command.project.name}"
        is EditorCommand.UpdateProject -> "Update project settings"
        is EditorCommand.DeleteProject -> "Delete project"
        is EditorCommand.AddClip -> "Add clip to timeline"
        is EditorCommand.RemoveClip -> "Remove clip from timeline"
        is EditorCommand.UpdateClip -> "Update clip properties"
        is EditorCommand.MoveClip -> "Move clip"
        is EditorCommand.SplitClip -> "Split clip"
        is EditorCommand.TrimClip -> "Trim clip"
        is EditorCommand.AddTrack -> "Add track"
        is EditorCommand.RemoveTrack -> "Remove track"
        is EditorCommand.ReorderTracks -> "Reorder tracks"
        is EditorCommand.UpdateTrack -> "Update track"
        is EditorCommand.AddEffect -> "Add effect"
        is EditorCommand.RemoveEffect -> "Remove effect"
        is EditorCommand.UpdateEffect -> "Update effect"
        is EditorCommand.AddKeyframe -> "Add keyframe"
        is EditorCommand.RemoveKeyframe -> "Remove keyframe"
        is EditorCommand.UpdateKeyframe -> "Update keyframe"
        is EditorCommand.AddTransition -> "Add transition"
        is EditorCommand.RemoveTransition -> "Remove transition"
        is EditorCommand.SetSelection -> "Change selection"
        is EditorCommand.SetPlaybackState -> "Change playback"
        is EditorCommand.Undo -> "Undo"
        is EditorCommand.Redo -> "Redo"
    }
    
    private fun getAffectedResources(command: EditorCommand): List<String> = when (command) {
        is EditorCommand.DeleteProject -> listOf(command.projectId)
        is EditorCommand.RemoveClip -> listOf(command.clipId)
        is EditorCommand.RemoveTrack -> listOf(command.trackId)
        is EditorCommand.RemoveEffect -> listOf("${command.clipId}:${command.effectId}")
        is EditorCommand.RemoveKeyframe -> listOf("${command.clipId}:${command.keyframeId}")
        is EditorCommand.RemoveTransition -> listOf(command.transitionId)
        else -> emptyList()
    }
}