import { KnowledgeScore } from "./dictionary";

/**
 * Get display name for knowledge score
 * @param score The knowledge score enum value
 * @returns Human-readable score name
 */
export function getScoreDisplayName(score: KnowledgeScore): string {
  switch (score) {
    case KnowledgeScore.Unknown:
      return "Unknown";
    case KnowledgeScore.Familiar:
      return "Familiar";
    case KnowledgeScore.Good:
      return "Good";
    case KnowledgeScore.VeryGood:
      return "Very Good";
    case KnowledgeScore.Perfect:
      return "Perfect";
    default:
      return "Unknown";
  }
}

/**
 * Get emoji representation for knowledge score
 * @param score The knowledge score enum value
 * @returns Emoji representing the score
 */
export function getScoreEmoji(score: KnowledgeScore): string {
  switch (score) {
    case KnowledgeScore.Unknown:
      return "❓";
    case KnowledgeScore.Familiar:
      return "🤔";
    case KnowledgeScore.Good:
      return "👍";
    case KnowledgeScore.VeryGood:
      return "⭐";
    case KnowledgeScore.Perfect:
      return "💯";
    default:
      return "❓";
  }
}

/**
 * Get color for knowledge score (for UI elements)
 * @param score The knowledge score enum value
 * @returns Color string
 */
export function getScoreColor(score: KnowledgeScore): string {
  switch (score) {
    case KnowledgeScore.Unknown:
      return "#8E8E93"; // Gray
    case KnowledgeScore.Familiar:
      return "#FF9F0A"; // Orange
    case KnowledgeScore.Good:
      return "#30D158"; // Green
    case KnowledgeScore.VeryGood:
      return "#007AFF"; // Blue
    case KnowledgeScore.Perfect:
      return "#AF52DE"; // Purple
    default:
      return "#8E8E93";
  }
}

/**
 * Get all available knowledge scores with their display info
 * @returns Array of score options for UI
 */
export function getScoreOptions() {
  return [
    {
      score: KnowledgeScore.Unknown,
      name: getScoreDisplayName(KnowledgeScore.Unknown),
      emoji: getScoreEmoji(KnowledgeScore.Unknown),
      color: getScoreColor(KnowledgeScore.Unknown),
    },
    {
      score: KnowledgeScore.Familiar,
      name: getScoreDisplayName(KnowledgeScore.Familiar),
      emoji: getScoreEmoji(KnowledgeScore.Familiar),
      color: getScoreColor(KnowledgeScore.Familiar),
    },
    {
      score: KnowledgeScore.Good,
      name: getScoreDisplayName(KnowledgeScore.Good),
      emoji: getScoreEmoji(KnowledgeScore.Good),
      color: getScoreColor(KnowledgeScore.Good),
    },
    {
      score: KnowledgeScore.VeryGood,
      name: getScoreDisplayName(KnowledgeScore.VeryGood),
      emoji: getScoreEmoji(KnowledgeScore.VeryGood),
      color: getScoreColor(KnowledgeScore.VeryGood),
    },
    {
      score: KnowledgeScore.Perfect,
      name: getScoreDisplayName(KnowledgeScore.Perfect),
      emoji: getScoreEmoji(KnowledgeScore.Perfect),
      color: getScoreColor(KnowledgeScore.Perfect),
    },
  ];
}
