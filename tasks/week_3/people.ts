import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Task, TaskResolver } from "../../lib/auth";
import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuid } from "uuid";
import { Document } from "langchain/document";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemMessage } from "langchain/schema";

const COLLECTION_NAME = "PEOPLE";

type Person = {
  imie: string;
  nazwisko: string;
  wiek: number;
  o_mnie: string;
  ulubiona_postac_z_kapitana_bomby: string;
  ulubiony_serial: string;
  ulubiony_film: string;
  ulubiony_kolor: string;
};

async function getPeopleData() {
  const response = await fetch("https://zadania.aidevs.pl/data/people.json", {
    headers: {
      "Content-type": "application/json",
    },
  });

  return response.json<ReadonlyArray<Person>>();
}

type PeopleTask = Task & {
  question: string;
};

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
const collections = await qdrant.getCollections();
const embeddings = new OpenAIEmbeddings({ maxConcurrency: 10 });

const collection = collections.collections.find(
  (collection) => collection.name === COLLECTION_NAME
);

if (!collection) {
  await qdrant.createCollection(COLLECTION_NAME, {
    vectors: { size: 1536, distance: "Cosine", on_disk: true },
  });
}

const collectionInfo = await qdrant.getCollection(COLLECTION_NAME);
if (!collectionInfo.points_count) {
  const people = await getPeopleData();
  //   const people = allPeople.slice(0, 10);
  const documents = people.map(
    ({
      imie,
      nazwisko,
      o_mnie,
      ulubiona_postac_z_kapitana_bomby,
      ulubiony_film,
      ulubiony_kolor,
      ulubiony_serial,
      wiek,
    }) => {
      const content = `Jestem ${imie} ${nazwisko}. Mam ${wiek} lat. ${o_mnie}. Ulubiony kolor: ${ulubiony_kolor}. Ulubiony serial: ${ulubiony_serial}. Ulubiony film: ${ulubiony_film}`;
      return new Document({
        pageContent: `${imie} ${nazwisko}`,
        metadata: {
          ulubiona_postac_z_kapitana_bomby,
          ulubiony_film,
          ulubiony_kolor,
          ulubiony_serial,
          imie,
          nazwisko,
          source: COLLECTION_NAME,
          content: content,
          id: uuid(),
        },
      });
    }
  );

  console.log("here");

  const points = [];
  for (const document of documents) {
    const [embedding] = await embeddings.embedDocuments([document.pageContent]);
    points.push({
      id: document.metadata.id,
      payload: document.metadata,
      vector: embedding,
    });
  }

  console.log("here2");

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    batch: {
      ids: points.map((point) => point.id),
      vectors: points.map((point) => point.vector),
      payloads: points.map((point) => point.payload),
    },
  });
}

const taskResolver = new TaskResolver("people");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { question } = taskResolver.getTask() as PeopleTask;
const questionEmbedding = await embeddings.embedQuery(question);

const search = await qdrant.search(COLLECTION_NAME, {
  vector: questionEmbedding,
  limit: 1,
  filter: {
    must: [
      {
        key: "source",
        match: {
          value: COLLECTION_NAME,
        },
      },
    ],
  },
});

console.log(JSON.stringify(search));

const openai = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
});

const personInformation = search.at(0)?.payload?.content;
if (personInformation) {
  const { content } = await openai.call([
    new SystemMessage(
      `Answer on the given question. Context: ${personInformation}`
    ),
    new HumanMessage(question),
  ]);
  console.log({ content });
  await taskResolver.sendAnswer(content);
}
