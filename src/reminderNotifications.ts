import { vocabService } from "./vocab-service";
import { runAppleScript } from "@raycast/utils";
import { captureException } from "@raycast/api";

function buildException(error: Error, message: string, meta?: Record<string, any>) {
  return {
    error,
    message,
    ...(meta && { meta }),
  };
}

export default async function sendNotification() {
  let words = await vocabService.getVocabulary();
  words = words.filter((w) => w.score < 4);

  // take random 1 word
  if (words.length === 0) {
    return;
  }

  const word = words[Math.floor(Math.random() * words.length)];
  console.log("Sending notification for word:", word.word);
  console.log("Translations:", word.translations);

  const translations = word.translations.map((t) => `${t.language}: ${t.text}`).join(" • ");

  const notificationTitle = ` ${word.word}`;
  const notificationText = translations || "No translations available";

  try {
    // silent
    const script = `
      display notification "${notificationText}" with title "${notificationTitle}" sound name "Pop"
    `;
    await runAppleScript(script);
  } catch (error) {
    //
    captureException(buildException(error as Error, "Error sending push notification to macOS"));
  }
}
