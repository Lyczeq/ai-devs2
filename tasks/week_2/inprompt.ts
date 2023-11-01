import { ChatOpenAI } from "langchain/chat_models/openai";
import { Task, TaskResolver } from "../../lib/auth";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { Document } from "langchain/document";
import { categorizePersonDescriptionWithTheirName } from "../../lib/inprompt";

type InmpromptTask = Task & {
  input: string[];
  question: string;
};

const taskResolver = new TaskResolver("inprompt");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { input, question } = taskResolver.getTask() as InmpromptTask;

// await categorizePersonDescriptionWithTheirName(input);

const documents = await Bun.file("./inprompt.json").json<
  ReadonlyArray<Document<{ source: string }>>
>();

const groupedDataByName = documents.reduce((accumulator, currentDocument) => {
  const name = currentDocument.metadata.source;

  if (accumulator[name]) {
    const content = accumulator[name];
    accumulator[name] = [...content, currentDocument.pageContent];
    return accumulator;
  }

  accumulator[name] = [currentDocument.pageContent];
  return accumulator;
}, {} as Record<string, ReadonlyArray<string>>);

const findNameModel = new ChatOpenAI();

const { content: name } = await findNameModel.call([
  new SystemMessage(
    "Extract human name in the following question. Return the name and nothing else."
  ),
  new HumanMessage(`Question: ${question}`),
]);

const contentForSpecificPerson = groupedDataByName[name];

const answerModel = new ChatOpenAI();

const { content: answer } = await answerModel.call([
  new SystemMessage(`Context: ${contentForSpecificPerson}`),
  new HumanMessage(`Answer on this question: ${question}.`),
]);
console.log({ answer });

await taskResolver.sendAnswer(answer);
