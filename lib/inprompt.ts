import { ChatOpenAI } from "langchain/chat_models/openai";
import { BaseMessage, HumanMessage, SystemMessage } from "langchain/schema";
import { Document } from "langchain/document";

export async function categorizePersonDescriptionWithTheirName(
  input: ReadonlyArray<string>
) {
  const documents = input.map((content) => {
    return new Document({ pageContent: content });
  });

  const descriptionsModel = new ChatOpenAI({
    maxConcurrency: 10,
    modelName: "gpt-4",
  });
  const descriptionPromise: Array<Promise<BaseMessage>> = [];

  for (const doc of documents) {
    descriptionPromise.push(
      descriptionsModel.call([
        new SystemMessage(
          "Extract human name in the document. Return the name and nothing else."
        ),
        new HumanMessage(`Document: ${doc.pageContent}`),
      ])
    );
  }

  const descriptions = await Promise.all(descriptionPromise);
  descriptions.forEach((description, index) => {
    documents[index].metadata["source"] = description.content;
  });

  await Bun.write("./inprompt.json", JSON.stringify(documents, null, 2));
}
