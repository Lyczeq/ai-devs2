import { ChatOpenAI } from "langchain/chat_models/openai";
import { Task, TaskResolver } from "../../lib/auth";
import { HumanMessage, SystemMessage } from "langchain/schema";
import OpenAI from "openai";

type EmbeddingTask = Task & {
  hint1: string;
  hint2: string;
  hint3: string;
};

const openai = new OpenAI({});

const chatModel = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
});

const taskResolver = new TaskResolver("embedding");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { msg } = taskResolver.getTask() as EmbeddingTask;
const { content } = await chatModel.call([
  new SystemMessage(
    "You will be given a sentence that describes what needs to be done with a given word. Return just the word and nothing else."
  ),
  new HumanMessage(msg),
]);

const { data } = await openai.embeddings.create({
  model: "text-embedding-ada-002",
  input: content,
});

const answer = data.at(0);
if (!answer) {
  throw new Error("No answer");
}

await taskResolver.sendAnswer(answer.embedding);
