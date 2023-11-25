import { ChatOpenAI } from "langchain/chat_models/openai";
import { Task, TaskResolver } from "../../lib/auth";
import { HumanMessage, SystemMessage } from "langchain/schema";
import OpenAI from "openai";

type OptimalDbTask = Task & {
  database: string;
};

type DatabaseData = Record<string, ReadonlyArray<string>>;

async function getDatabaseData(databaseUrl: string) {
  const response = await fetch(databaseUrl, {
    headers: {
      "Content-type": "application/json",
    },
  });

  return response.json<DatabaseData>();
}

// const openai = new OpenAI();
// c.chat.completions.create({ model: "gpt-3.5-turbo-16k" });

const openai = new ChatOpenAI({
  modelName: "gpt-4-1106-preview",
});

const taskResolver = new TaskResolver("optimaldb");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { database: databaseUrl } = taskResolver.getTask() as OptimalDbTask;

const db = await getDatabaseData(databaseUrl);
const formattedData = Object.entries(db).reduce((accumulator, currentValue) => {
  const [name, contentArray] = currentValue;
  const information = contentArray.join("");
  return { ...accumulator, [name]: information };
}, {} as Record<string, string>);
const { content } = await openai.call([
  new SystemMessage(
    `You will be given data in the JSON format follow these rules:
     - Each key is the name of the person and the value is an information about their life. Summarize information about their life, hobbies and favorite activities.
     - Summarize each person life
     - As a return keep the same format
    \`\`\`
    Example:
    // ADD EXAMPLE
    \`\`\`
    `
  ),
  new HumanMessage(JSON.stringify(formattedData)),
]);
console.log({ content });

await taskResolver.sendAnswer(content);
