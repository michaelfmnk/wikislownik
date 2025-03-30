import { useQuery, UseQueryResult } from "@tanstack/react-query";
import WiktionaryApiImpl from "./wiktionary/api";
import WiktionaryServiceImpl from "./wiktionary/service/service";
import client from "./client";
import { Word, WordDefinition } from "./dictionary";

// Initialize service dependencies
const api = new WiktionaryApiImpl();
const service = new WiktionaryServiceImpl(api);

// Cache time constants
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const MIN_SEARCH_LENGTH = 3;

/**
 * React hook for dictionary search functionality
 * @param searchTerm The term to search for
 * @returns Query result with search data
 */
export function useDictionarySearch(searchTerm: string) {
  return useQuery(
    {
      queryKey: ["useDictionarySearch", searchTerm],
      queryFn: async () => {
        console.log("Searching dictionary for:", searchTerm);
        return await service.search(searchTerm);
      },
      // Only enable search when search term is valid and long enough
      enabled: Boolean(searchTerm) && searchTerm.length >= MIN_SEARCH_LENGTH,
      staleTime: FIVE_MINUTES_MS,
    },
    client,
  );
}

/**
 * React hook for fetching detailed word definitions
 * @param word The word to look up
 * @returns Query result with word definition data
 */
export function useDictionaryDefinition(word: Word): UseQueryResult<WordDefinition, Error> {
  return useQuery(
    {
      queryKey: ["useDictionaryDefinition", word.text],
      queryFn: async () => {
        console.log("Fetching definition for:", word.text);
        return await service.loadDefinition(word);
      },
      // Only enable when word text is available
      enabled: Boolean(word?.text),
      staleTime: FIVE_MINUTES_MS,
    },
    client,
  );
}
