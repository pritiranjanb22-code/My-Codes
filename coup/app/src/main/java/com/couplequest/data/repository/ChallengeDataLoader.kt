package com.couplequest.data.repository

import com.couplequest.data.model.Challenge
import com.couplequest.data.model.ChallengeCategory
import com.couplequest.data.model.Difficulty
import com.couplequest.data.model.GameMode
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChallengeDataLoader @Inject constructor(
    private val challengeRepository: ChallengeRepository
) {

    suspend fun loadDefaultChallenges() {
        val existingChallenges = challengeRepository.getAllChallenges().first()
        if (existingChallenges.isNotEmpty()) return

        val challenges = buildDefaultChallenges()
        challengeRepository.insertChallenges(challenges)
    }

    private fun buildDefaultChallenges(): List<Challenge> {
        val challenges = mutableListOf<Challenge>()

        // Truth or Dare - Romantic
        challenges.addAll(listOf(
            Challenge(
                title = "First Attraction",
                description = "What first attracted you to your partner?",
                category = ChallengeCategory.ROMANTIC,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.EASY,
                timerSeconds = 60
            ),
            Challenge(
                title = "Favorite Memory",
                description = "What is your favorite memory together?",
                category = ChallengeCategory.ROMANTIC,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.EASY,
                timerSeconds = 60
            ),
            Challenge(
                title = "Feeling Loved",
                description = "What makes you feel most loved by your partner?",
                category = ChallengeCategory.ROMANTIC,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 90
            ),
            Challenge(
                title = "Dream Date",
                description = "Describe your perfect date together.",
                category = ChallengeCategory.ROMANTIC,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.EASY,
                timerSeconds = 60
            ),
            Challenge(
                title = "Love Language",
                description = "What's your love language? How does your partner speak it?",
                category = ChallengeCategory.ROMANTIC,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 90
            )
        ))

        // Truth or Dare - Funny
        challenges.addAll(listOf(
            Challenge(
                title = "Embarrassing Moment",
                description = "Share your most embarrassing moment.",
                category = ChallengeCategory.FUNNY,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.EASY,
                timerSeconds = 60
            ),
            Challenge(
                title = "Weird Habit",
                description = "What's a weird habit you have that your partner doesn't know about?",
                category = ChallengeCategory.FUNNY,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.EASY,
                timerSeconds = 60
            ),
            Challenge(
                title = "Bad Impression",
                description = "Do your best impression of your partner.",
                category = ChallengeCategory.FUNNY,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.MEDIUM
            ),
            Challenge(
                title = "Funny Nickname",
                description = "Give your partner a funny nickname and explain why.",
                category = ChallengeCategory.FUNNY,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.EASY
            )
        ))

        // Truth or Dare - Deep Questions
        challenges.addAll(listOf(
            Challenge(
                title = "Biggest Fear",
                description = "What's your biggest fear in our relationship?",
                category = ChallengeCategory.DEEP_QUESTIONS,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.HARD,
                timerSeconds = 120
            ),
            Challenge(
                title = "Change One Thing",
                description = "If you could change one thing about our relationship, what would it be?",
                category = ChallengeCategory.DEEP_QUESTIONS,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.HARD,
                timerSeconds = 120
            ),
            Challenge(
                title = "Future Dream",
                description = "Where do you see us in 5 years?",
                category = ChallengeCategory.DEEP_QUESTIONS,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 90
            ),
            Challenge(
                title = "Trust Moment",
                description = "When did you feel the most trust in our relationship?",
                category = ChallengeCategory.DEEP_QUESTIONS,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 90
            )
        ))

        // Truth or Dare - Playful Dares
        challenges.addAll(listOf(
            Challenge(
                title = "Sincere Compliment",
                description = "Give your partner a sincere compliment about something non-physical.",
                category = ChallengeCategory.PLAYFUL,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.EASY
            ),
            Challenge(
                title = "Five Minute Talk",
                description = "Hold hands and talk for five minutes without phones.",
                category = ChallengeCategory.PLAYFUL,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.EASY,
                timerSeconds = 300
            ),
            Challenge(
                title = "Dance Together",
                description = "Choose a song and dance together for one minute.",
                category = ChallengeCategory.PLAYFUL,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 60
            ),
            Challenge(
                title = "Surprise Date Plan",
                description = "Plan a surprise date for your partner (describe it now).",
                category = ChallengeCategory.PLAYFUL,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 120
            ),
            Challenge(
                title = "Massage",
                description = "Give your partner a 2-minute shoulder massage.",
                category = ChallengeCategory.PLAYFUL,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.EASY,
                timerSeconds = 120
            ),
            Challenge(
                title = "Love Note",
                description = "Write a quick love note and read it aloud.",
                category = ChallengeCategory.PLAYFUL,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.EASY,
                timerSeconds = 60
            )
        ))

        // Truth or Dare - Adult Intimacy (18+)
        challenges.addAll(listOf(
            Challenge(
                title = "Fantasy Share",
                description = "Share a fantasy you've never told anyone.",
                category = ChallengeCategory.ADULT_INTIMACY,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.HARD,
                isAdultContent = true,
                timerSeconds = 120
            ),
            Challenge(
                title = "Desire Expression",
                description = "Tell your partner exactly what you want them to do to you right now.",
                category = ChallengeCategory.ADULT_INTIMACY,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.HARD,
                isAdultContent = true,
                timerSeconds = 90
            ),
            Challenge(
                title = "Sensual Massage",
                description = "Give your partner a sensual full-body massage for 5 minutes.",
                category = ChallengeCategory.ADULT_INTIMACY,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.MEDIUM,
                isAdultContent = true,
                timerSeconds = 300
            ),
            Challenge(
                title = "New Position",
                description = "Try a position you've never done before.",
                category = ChallengeCategory.ADULT_INTIMACY,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.HARD,
                isAdultContent = true
            ),
            Challenge(
                title = "Blindfold Surprise",
                description = "Blindfold your partner and surprise them with different touches.",
                category = ChallengeCategory.ADULT_INTIMACY,
                gameMode = GameMode.TRUTH_OR_DARE,
                difficulty = Difficulty.MEDIUM,
                isAdultContent = true,
                timerSeconds = 300
            )
        ))

        // Intimate Positions - Romantic
        challenges.addAll(listOf(
            Challenge(
                title = "Spooning",
                description = "Lie side by side with one partner behind the other. Intimate and comfortable.",
                category = ChallengeCategory.ROMANTIC,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.EASY,
                isAdultContent = true,
                tips = "Great for lazy mornings. Allows for kissing, caressing, and whispering."
            ),
            Challenge(
                title = "Face to Face",
                description = "Lie facing each other with legs intertwined. Maximum eye contact and kissing.",
                category = ChallengeCategory.ROMANTIC,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.EASY,
                isAdultContent = true,
                tips = "Perfect for slow, intimate connection. Use pillows for comfort."
            ),
            Challenge(
                title = "Lotus Position",
                description = "Sit facing each other with legs wrapped around each other. Deep connection.",
                category = ChallengeCategory.ROMANTIC,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.MEDIUM,
                isAdultContent = true,
                tips = "Requires flexibility. Use cushions under hips for support."
            )
        ))

        // Intimate Positions - Gentle
        challenges.addAll(listOf(
            Challenge(
                title = "Side by Side",
                description = "Both partners lie on their sides facing the same direction. Relaxed and intimate.",
                category = ChallengeCategory.GENTLE,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.EASY,
                isAdultContent = true,
                tips = "Low physical effort. Great for when you're tired but want intimacy."
            ),
            Challenge(
                title = "Modified Missionary",
                description = "Classic position with pillows under hips for better angle and comfort.",
                category = ChallengeCategory.GENTLE,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.EASY,
                isAdultContent = true,
                tips = "Pillows under receiving partner's hips change the angle pleasantly."
            )
        ))

        // Intimate Positions - Seated
        challenges.addAll(listOf(
            Challenge(
                title = "Chair Straddle",
                description = "One partner sits on a sturdy chair, other straddles facing them.",
                category = ChallengeCategory.SEATED,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.MEDIUM,
                isAdultContent = true,
                tips = "Ensure chair is stable. Partner on top controls depth and pace."
            ),
            Challenge(
                title = "Edge of Bed",
                description = "One partner sits on edge of bed, other stands or kneels.",
                category = ChallengeCategory.SEATED,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.EASY,
                isAdultContent = true,
                tips = "Good for different heights. Standing partner supports themselves."
            )
        ))

        // Intimate Positions - Standing
        challenges.addAll(listOf(
            Challenge(
                title = "Wall Support",
                description = "One partner against wall, other stands facing. Passionate and spontaneous.",
                category = ChallengeCategory.STANDING,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.HARD,
                isAdultContent = true,
                tips = "Requires strength. Wall provides support. Communicate about comfort."
            ),
            Challenge(
                title = "Shower Together",
                description = "Standing in shower facing each other. Water adds sensation.",
                category = ChallengeCategory.STANDING,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.MEDIUM,
                isAdultContent = true,
                tips = "Use non-slip mat. Be careful with water temperature."
            )
        ))

        // Intimate Positions - Side by Side
        challenges.addAll(listOf(
            Challenge(
                title = "Scissors",
                description = "Lie on sides facing each other, legs interlocked in scissor position.",
                category = ChallengeCategory.SIDE_BY_SIDE,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.MEDIUM,
                isAdultContent = true,
                tips = "Allows for face-to-face intimacy. Adjust leg positions for comfort."
            )
        ))

        // Intimate Positions - Beginner Friendly
        challenges.addAll(listOf(
            Challenge(
                title = "Classic Missionary",
                description = "Receiving partner on back, giving partner on top facing them.",
                category = ChallengeCategory.BEGINNER_FRIENDLY,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.EASY,
                isAdultContent = true,
                tips = "Most familiar position. Add pillows for variety. Maintain eye contact."
            ),
            Challenge(
                title = "Cowgirl/Reverse Cowgirl",
                description = "Receiving partner on top, facing toward or away from giving partner.",
                category = ChallengeCategory.BEGINNER_FRIENDLY,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.EASY,
                isAdultContent = true,
                tips = "Partner on top controls depth, angle, and pace. Great for clitoral stimulation."
            )
        ))

        // Intimate Positions - Couples Choice
        challenges.addAll(listOf(
            Challenge(
                title = "Your Favorite",
                description = "Do whatever position you both enjoy most. No rules, just pleasure.",
                category = ChallengeCategory.COUPLES_CHOICE,
                gameMode = GameMode.INTIMATE_POSITIONS,
                difficulty = Difficulty.EASY,
                isAdultContent = true,
                tips = "Communication is key. Tell each other what feels good."
            )
        ))

        // Romantic Challenges - Date Ideas
        challenges.addAll(listOf(
            Challenge(
                title = "Picnic Date",
                description = "Plan and enjoy a picnic together, indoors or outdoors.",
                category = ChallengeCategory.DATE_IDEAS,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            ),
            Challenge(
                title = "Cook Together",
                description = "Choose a new recipe and cook a meal together from scratch.",
                category = ChallengeCategory.DATE_IDEAS,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.MEDIUM
            ),
            Challenge(
                title = "Stargazing",
                description = "Find a dark spot, bring blankets, and watch the stars together.",
                category = ChallengeCategory.DATE_IDEAS,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            ),
            Challenge(
                title = "Museum/Art Gallery",
                description = "Visit a museum or gallery and discuss your favorite pieces.",
                category = ChallengeCategory.DATE_IDEAS,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            ),
            Challenge(
                title = "Sunrise/Sunset",
                description = "Wake up early or stay up late to watch the sunrise/sunset together.",
                category = ChallengeCategory.DATE_IDEAS,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            )
        ))

        // Romantic Challenges - Compliments
        challenges.addAll(listOf(
            Challenge(
                title = "Three Compliments",
                description = "Give your partner three genuine compliments about their character.",
                category = ChallengeCategory.COMPLIMENTS,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            ),
            Challenge(
                title = "Physical Appreciation",
                description = "Tell your partner three things you love about their body.",
                category = ChallengeCategory.COMPLIMENTS,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.MEDIUM
            ),
            Challenge(
                title = "Gratitude Share",
                description = "Share three things you're grateful for about your partner.",
                category = ChallengeCategory.COMPLIMENTS,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            )
        ))

        // Romantic Challenges - Affection
        challenges.addAll(listOf(
            Challenge(
                title = "10 Minute Cuddle",
                description = "Cuddle without talking for 10 minutes. Just be present.",
                category = ChallengeCategory.AFFECTION,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY,
                timerSeconds = 600
            ),
            Challenge(
                title = "Hand Holding Walk",
                description = "Go for a 15-minute walk holding hands, no phones.",
                category = ChallengeCategory.AFFECTION,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY,
                timerSeconds = 900
            ),
            Challenge(
                title = "Forehead Kisses",
                description = "Give each other 5 forehead kisses and say 'I love you' each time.",
                category = ChallengeCategory.AFFECTION,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            )
        ))

        // Romantic Challenges - Thoughtful Gestures
        challenges.addAll(listOf(
            Challenge(
                title = "Love Letter",
                description = "Write a handwritten love letter and give it to your partner.",
                category = ChallengeCategory.THOUGHTFUL_GESTURES,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.MEDIUM
            ),
            Challenge(
                title = "Memory Jar",
                description = "Start a memory jar - write down a favorite memory and add it.",
                category = ChallengeCategory.THOUGHTFUL_GESTURES,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            ),
            Challenge(
                title = "Act of Service",
                description = "Do a chore your partner usually does without being asked.",
                category = ChallengeCategory.THOUGHTFUL_GESTURES,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            )
        ))

        // Romantic Challenges - Surprise Activities
        challenges.addAll(listOf(
            Challenge(
                title = "Surprise Treat",
                description = "Buy or make your partner's favorite treat as a surprise.",
                category = ChallengeCategory.SURPRISE_ACTIVITIES,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            ),
            Challenge(
                title = "Playlist Creation",
                description = "Create a playlist of songs that remind you of your relationship.",
                category = ChallengeCategory.SURPRISE_ACTIVITIES,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.EASY
            ),
            Challenge(
                title = "Photo Recreation",
                description = "Recreate an old photo of you two together.",
                category = ChallengeCategory.SURPRISE_ACTIVITIES,
                gameMode = GameMode.ROMANTIC_CHALLENGES,
                difficulty = Difficulty.MEDIUM
            )
        ))

        // Couple Questions - Communication
        challenges.addAll(listOf(
            Challenge(
                title = "Communication Style",
                description = "How do you prefer to communicate when upset? How can I support you better?",
                category = ChallengeCategory.COMMUNICATION,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 120
            ),
            Challenge(
                title = "Unspoken Needs",
                description = "What's something you need from me but haven't asked for?",
                category = ChallengeCategory.COMMUNICATION,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.HARD,
                timerSeconds = 120
            ),
            Challenge(
                title = "Conflict Resolution",
                description = "What's one thing we could do differently when we disagree?",
                category = ChallengeCategory.COMMUNICATION,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 90
            )
        ))

        // Couple Questions - Trust Building
        challenges.addAll(listOf(
            Challenge(
                title = "Vulnerability",
                description = "Share something vulnerable you've never told anyone.",
                category = ChallengeCategory.TRUST_BUILDING,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.HARD,
                timerSeconds = 120
            ),
            Challenge(
                title = "Trust Moment",
                description = "When did you feel the most/least trusted in our relationship?",
                category = ChallengeCategory.TRUST_BUILDING,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 90
            ),
            Challenge(
                title = "Safe Space",
                description = "What makes you feel safe to be completely yourself with me?",
                category = ChallengeCategory.TRUST_BUILDING,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 90
            )
        ))

        // Couple Questions - Future Planning
        challenges.addAll(listOf(
            Challenge(
                title = "5 Year Vision",
                description = "Describe your ideal life together in 5 years. Be specific.",
                category = ChallengeCategory.FUTURE_PLANNING,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 120
            ),
            Challenge(
                title = "Family Dreams",
                description = "What are your thoughts on family/kids/future living arrangements?",
                category = ChallengeCategory.FUTURE_PLANNING,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.HARD,
                timerSeconds = 180
            ),
            Challenge(
                title = "Bucket List",
                description = "What are 3 things on your couple's bucket list?",
                category = ChallengeCategory.FUTURE_PLANNING,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.EASY,
                timerSeconds = 90
            )
        ))

        // Couple Questions - Memories
        challenges.addAll(listOf(
            Challenge(
                title = "First Date",
                description = "What do you remember most about our first date?",
                category = ChallengeCategory.MEMORIES,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.EASY,
                timerSeconds = 60
            ),
            Challenge(
                title = "Proudest Moment",
                description = "What's your proudest moment as a couple?",
                category = ChallengeCategory.MEMORIES,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.EASY,
                timerSeconds = 60
            ),
            Challenge(
                title = "Overcome Together",
                description = "What's the hardest thing we've overcome together?",
                category = ChallengeCategory.MEMORIES,
                gameMode = GameMode.COUPLE_QUESTIONS,
                difficulty = Difficulty.MEDIUM,
                timerSeconds = 90
            )
        ))

        return challenges
    }
}