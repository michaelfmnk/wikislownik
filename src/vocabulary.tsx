import { useEffect, useState } from "react";
import { Action, ActionPanel, Clipboard, List, showToast, Toast } from "@raycast/api";
import { KnowledgeScore, VocabEntry } from "./dictionary";
import { vocabService } from "./vocab-service";
import { getScoreColor, getScoreDisplayName, getScoreEmoji, getScoreOptions } from "./score-utils";

export default function VocabularyList() {
  const [vocabulary, setVocabulary] = useState<VocabEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVocabulary();
  }, []);

  const loadVocabulary = async () => {
    try {
      setIsLoading(true);
      const vocab = await vocabService.getVocabulary();
      setVocabulary(vocab);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to load vocabulary",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveWord = async (entry: VocabEntry) => {
    try {
      await vocabService.removeWord(entry.id);
      await loadVocabulary(); // Refresh the list
      await showToast({
        style: Toast.Style.Success,
        title: "Word Removed",
        message: `"${entry.word}" removed from vocabulary`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to remove word from vocabulary",
      });
    }
  };

  const handleUpdateScore = async (entry: VocabEntry, newScore: KnowledgeScore) => {
    try {
      await vocabService.updateScore(entry.id, newScore);
      await loadVocabulary(); // Refresh the list
      await showToast({
        style: Toast.Style.Success,
        title: "Score Updated",
        message: `"${entry.word}" updated to ${getScoreDisplayName(newScore)}`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to update word score",
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = await vocabService.exportAsCSV();
      await Clipboard.copy(csvContent);
      await showToast({
        style: Toast.Style.Success,
        title: "CSV Exported",
        message: "Vocabulary exported to clipboard as CSV",
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to export vocabulary",
      });
    }
  };

  const formatTranslations = (entry: VocabEntry): string => {
    if (entry.translations.length === 0) {
      return "No translations";
    }
    return entry.translations.map((t) => `${t.language}: ${t.text}`).join(", ");
  };

  const formatSavedDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search your vocabulary...">
      {vocabulary.length === 0 ? (
        <List.EmptyView
          title="No words saved yet"
          description="Start building your vocabulary by saving words from search results"
        />
      ) : (
        <List.Section title={`Your Vocabulary (${vocabulary.length} words)`}>
          {vocabulary.map((entry) => (
            <List.Item
              key={entry.id}
              title={entry.word}
              subtitle={formatTranslations(entry)}
              accessories={[
                {
                  tag: {
                    value: `${getScoreEmoji(entry.score)} ${getScoreDisplayName(entry.score)}`,
                    color: getScoreColor(entry.score),
                  },
                },
                { text: formatSavedDate(entry.savedAt) },
              ]}
              actions={
                <ActionPanel>
                  <ActionPanel.Submenu
                    title="Update Knowledge Score"
                    icon={{ source: "star.png" }}
                    shortcut={{ modifiers: ["cmd"], key: "u" }}
                  >
                    {getScoreOptions().map((option) => (
                      <Action
                        key={option.score}
                        title={`${option.emoji} ${option.name}`}
                        onAction={() => handleUpdateScore(entry, option.score)}
                      />
                    ))}
                  </ActionPanel.Submenu>
                  <Action
                    title="Remove from Vocabulary"
                    icon={{ source: "trash.png" }}
                    style={Action.Style.Destructive}
                    onAction={() => handleRemoveWord(entry)}
                  />
                  <Action
                    title="Copy Word"
                    icon={{ source: "clipboard.png" }}
                    shortcut={{ modifiers: ["cmd"], key: "c" }}
                    onAction={() => Clipboard.copy(entry.word)}
                  />
                  <Action
                    title="Copy Translations"
                    icon={{ source: "clipboard.png" }}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                    onAction={() => Clipboard.copy(formatTranslations(entry))}
                  />
                  <Action
                    title="Export as Csv"
                    icon={{ source: "document.png" }}
                    shortcut={{ modifiers: ["cmd"], key: "e" }}
                    onAction={handleExportCSV}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
