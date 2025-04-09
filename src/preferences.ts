import { Language, Languages } from "./dictionary";
import { getPreferenceValues } from "@raycast/api";

export function readSelectedLanguages(): Language[] {
  const preferences = getPreferenceValues<Preferences>();
  const selectedLanguages: Language[] = [];

  // Go through each language in the Languages object
  Object.entries(Languages).forEach(([key, language]) => {
    // Check if this language is enabled in preferences
    if (preferences[key as keyof ExtensionPreferences]) {
      selectedLanguages.push(language);
    }
  });

  // If no languages selected, default to English
  if (selectedLanguages.length === 0) {
    selectedLanguages.push(Languages.EN);
  }

  return selectedLanguages;
}
