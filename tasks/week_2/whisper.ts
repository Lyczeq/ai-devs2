import { ChatOpenAI } from "langchain/chat_models/openai";
import { Task, TaskResolver } from "../../lib/auth";
import { HumanMessage, SystemMessage } from "langchain/schema";
import OpenAI, { toFile } from "openai";

type WhisperTask = Task & {
  hint: string;
};

const openai = new OpenAI({});

const chatModel = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
});

const taskResolver = new TaskResolver("whisper");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { msg } = taskResolver.getTask() as WhisperTask;

const { content: url } = await chatModel.call([
  new SystemMessage(
    "You'll be given the task that contains an url. Return the url and nothing else"
  ),
  new HumanMessage(msg),
]);

const audioResponse = await fetch(url);
const { text } = await openai.audio.transcriptions.create({
  model: "whisper-1",
  file: audioResponse,
});

console.log({ text });

await taskResolver.sendAnswer(text);
