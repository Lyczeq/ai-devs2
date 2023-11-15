import { ChatOpenAI } from "langchain/chat_models/openai";
import { Task, TaskResolver } from "../../lib/auth";
import { HumanMessage, SystemMessage } from "langchain/schema";

type ScraperTask = Task & { input: string; question: string };

function validateReponse(response: string) {
  if (response.match(/bot/)) {
    console.log("bb");
    return {
      isValid: false,
      text: "Artykuł nie został wysłany. Wykryto bota",
    };
  }

  if (response.match(/server/)) {
    console.log("aa");
    return {
      isValid: false,
      text: "Artykuł nie został wysłany. Błąd serwera.",
    };
  }

  return {
    isValid: true,
  };
}

const chatModel = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
});

const taskResolver = new TaskResolver("scraper");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { input, question, msg } = taskResolver.getTask() as ScraperTask;
const response = await fetch(input, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
  },
});
const text = await response.text();
const validResponseContent = validateReponse(text);
if (validResponseContent.isValid) {
  const { content } = await chatModel.call([
    new SystemMessage(msg),
    new SystemMessage(text),
    new HumanMessage(question),
  ]);
  taskResolver.sendAnswer(content);
}
