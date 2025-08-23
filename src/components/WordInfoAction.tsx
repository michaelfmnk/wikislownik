import { Action, ActionPanel, Detail, showToast, Toast } from "@raycast/api";
import { useDictionaryDefinition } from "../effects";
import { Gender, KnowledgeScore, Word, WordDefinition } from "../dictionary";
import { vocabService } from "../vocab-service";
import { getScoreDisplayName, getScoreOptions } from "../score-utils";
import { useEffect, useState } from "react";

interface WordInfoProps {
  word: Word;
}

export default function WordInfoAction(props: WordInfoProps) {
  const { data: definition, isLoading, status } = useDictionaryDefinition(props.word);
  const [isWordSaved, setIsWordSaved] = useState(false);

  useEffect(() => {
    async function checkIfSaved() {
      const saved = await vocabService.isWordSaved(props.word.text);
      setIsWordSaved(saved);
    }
    checkIfSaved();
  }, [props.word.text]);

  const handleSaveWord = (score: KnowledgeScore) => {
    return async () => {
      if (!definition) return;

      try {
        await vocabService.saveWord(definition.word.text, definition.translations, score);
        setIsWordSaved(true);
        await showToast({
          style: Toast.Style.Success,
          title: "Word Saved",
          message: `"${definition.word.text}" saved with ${getScoreDisplayName(score)} level`,
        });
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Error",
          message: "Failed to save word to vocabulary",
        });
      }
    };
  };

  const handleRemoveWord = async () => {
    if (!definition) return;

    try {
      const vocab = await vocabService.getVocabulary();
      const entry = vocab.find((v) => v.word === definition.word.text);
      if (entry) {
        await vocabService.removeWord(entry.id);
        setIsWordSaved(false);
        await showToast({
          style: Toast.Style.Success,
          title: "Word Removed",
          message: `"${definition.word.text}" removed from vocabulary`,
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "Failed to remove word from vocabulary",
      });
    }
  };

  return (
    <Detail
      navigationTitle={props.word.text}
      markdown={markdownOf(definition)}
      isLoading={isLoading}
      metadata={
        <Detail.Metadata>
          {definition?.gender && (
            <Detail.Metadata.TagList title="Rodzaj">
              <Detail.Metadata.TagList.Item text={definition.gender.toString()} color={colorOf(definition.gender)} />
            </Detail.Metadata.TagList>
          )}

          {definition?.translations.map((translation, index) => (
            <Detail.Metadata.Label key={index} title={translation.language} text={translation.text} />
          ))}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          {definition &&
            (isWordSaved ? (
              <Action
                title="Remove from Vocabulary"
                icon={{ source: "trash.png" }}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={handleRemoveWord}
              />
            ) : (
              <ActionPanel.Submenu
                title="Save to Vocabulary"
                icon={{ source: "star.png" }}
                shortcut={{ modifiers: ["cmd"], key: "s" }}
              >
                {getScoreOptions().map((option) => (
                  <Action
                    key={option.score}
                    title={`${option.emoji} ${option.name}`}
                    onAction={handleSaveWord(option.score)}
                  />
                ))}
              </ActionPanel.Submenu>
            ))}
          <Action.OpenInBrowser url={props.word.dictionaryUrl} />
          <Action.Push
            title="Conjugation"
            shortcut={{ modifiers: ["cmd"], key: "c" }}
            target={
              <Detail markdown={status == "success" && definition ? definition?.conjugationMarkdown : "Loading..."} />
            }
          />

          {definition?.word.thumbnail && (
            <Action.Push
              title="Definition"
              shortcut={{ modifiers: ["cmd"], key: "d" }}
              target={<Detail markdown={imageMarkdown(definition)} />}
            />
          )}
        </ActionPanel>
      }
    />
  );
}

function colorOf(gender: Gender): string {
  const colors = {
    [Gender.Male]: "#4169E1", // Royal Blue
    [Gender.Female]: "#FF69B4", // Hot Pink
    [Gender.Neutral]: "#2E8B57", // Sea Green
  };
  const color = colors[gender];
  return color ? color : "#FFA500"; // Orange (default)
}

function markdownOf(definition: WordDefinition | undefined): string {
  if (!definition) {
    return "Loading...";
  }

  return `
  # ${definition.word.text}
  ---
  ${definition?.meanings.map((it, index) => ` ${index + 1}. ${it}`).join("\n")}
  `;
}

function imageMarkdown(definition: WordDefinition): string | undefined {
  if (!definition.word.thumbnail) {
    return undefined;
  }

  return `![${definition.word.text}](${definition.word.thumbnail})`;
}
