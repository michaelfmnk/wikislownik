import { useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { Action, ActionPanel, List } from "@raycast/api";
import WordInfoAction from "./WordInfoAction";
import { useDictionarySearch } from "../effects";
import { Word } from "../dictionary";

export default function Search() {
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, isFetching } = useDictionarySearch(debouncedSearch);
  const pages = data?.words || [];

  return (
    <List
      isLoading={isLoading || (isFetching && debouncedSearch.length > 3)}
      searchBarPlaceholder="Search for a word in Wiktionary"
      searchText={search}
      onSearchTextChange={setSearch}
    >
      {pages.length === 0 ? (
        <List.EmptyView title="Type at least 4 characters to search Wiktionary" />
      ) : (
        pages.map((word: Word) => (
          <List.Item
            key={word.id}
            title={word.text}
            actions={
              <ActionPanel>
                <Action.Push title="Open in Browser" target={<WordInfoAction word={word} />}></Action.Push>
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
