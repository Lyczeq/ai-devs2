import { HumanMessage, SystemMessage } from "langchain/schema";
import { Task, TaskResolver } from "../../lib/auth";
import { ChatOpenAI } from "langchain/chat_models/openai";

type ToolsTask = Task & {
  question: string;
};

const taskResolver = new TaskResolver("tools");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { question } = taskResolver.getTask() as ToolsTask;

const openai = new ChatOpenAI({
  modelName: "gpt-4",
});

const { content } = await openai.call([
  new SystemMessage(
    `Decide whether the task that you receive should be added to the ToDo list or to the calendar (if time is provided). Follow these rules:
    - When there's a ToDo task return data in JSON format as follows:
        {tool: "ToDo", "desc": "{description of the task}" }"
    Example:
    User: "Przypomnij mi, abym zapisał się na AI Devs 3.0"
    AI: ${JSON.stringify({
      tool: "ToDo",
      desc: "Przypomnij mi, abym zapisał się na AI Devs 3.0",
    })}

    - When there's a calendar task return data in JSON format as follows:
    {tool: "ToDo", "desc": "{description of the task}", "date": {date} }"
    IMPORTANT: always use YYYY-MM-DD format for dates
    IMPORTANT: Today is ${new Date().toString()}
    Example:
    User: "Jutro mam spotkanie z Marianem"
    AI: ${JSON.stringify({
      tool: "Calendar,desc:Spotkanie z Marianem",
      date: "2023-11-23",
    })}
    `
  ),
  new HumanMessage(question),
]);

await taskResolver.sendAnswer(JSON.parse(content));
