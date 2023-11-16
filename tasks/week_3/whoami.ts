import { HumanMessage, SystemMessage } from "langchain/schema";
import { Task, TaskResolver } from "../../lib/auth";
import { ChatOpenAI } from "langchain/chat_models/openai";

type WhoAmITask = Task & {
  hint: string;
};

const taskResolver = new TaskResolver("whoami");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { hint } = taskResolver.getTask() as WhoAmITask;

const hints: Array<HumanMessage> = [];

hints.push(new HumanMessage(hint));
const client = new ChatOpenAI({
  modelName: "gpt-4",
});

let answer = "NO";

do {
  const { content } = await client.call([
    new SystemMessage(
      "Based on the given hints guess the person that describe them. When you're not sure who's the person, return 'NO' and nothing else. If you know the person return it's last name and first name, nothing else."
    ),
    ...hints,
  ]);
  answer = content;
  await taskResolver.fetchTask();
  const { hint } = taskResolver.getTask() as WhoAmITask;
  hints.push(new HumanMessage(hint));
} while (answer === "NO");

await taskResolver.sendAnswer(answer);
