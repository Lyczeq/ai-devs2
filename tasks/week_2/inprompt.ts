import { ChatOpenAI } from "langchain/chat_models/openai";
import { Task, TaskResolver } from "../../lib/auth";
import { HumanMessage } from "langchain/schema";

type InmpromptTask = Task & {
  input: string[];
  question: string;
};

const taskResolver = new TaskResolver("inprompt");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { input } = taskResolver.getTask() as InmpromptTask;
const chat = new ChatOpenAI();
const { content } = await chat.call([new HumanMessage("How are you?")]);
console.log({ content });
