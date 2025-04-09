import { Action, ActionPanel, Detail } from "@raycast/api";
import { useDictionaryDefinition } from "../effects";
import { Gender, Word, WordDefinition } from "../dictionary";

interface WordInfoProps {
  word: Word;
}

export default function WordInfoAction(props: WordInfoProps) {
  const { data: definition, isLoading, status } = useDictionaryDefinition(props.word);

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
