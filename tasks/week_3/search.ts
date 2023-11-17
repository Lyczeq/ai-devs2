import { QdrantClient } from "@qdrant/js-client-rest";
import { Task, TaskResolver } from "../../lib/auth";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { Document } from "langchain/document";
import { v4 as uuid } from "uuid";

const COLLECTION_NAME = "unknowNews";

type SearchTask = Task & {
  question: string;
};

type Article = {
  title: string;
  url: string;
  info: string;
  date: string;
};

async function getArticles() {
  const response = await fetch("https://unknow.news/archiwum.json", {
    headers: {
      "Content-type": "application/json",
    },
  });

  return await response.json<ReadonlyArray<Article>>();
}

const embeddings = new OpenAIEmbeddings({ maxConcurrency: 5 });

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });
const result = await qdrant.getCollections();
const indexed = result.collections.find(
  (collection) => collection.name === COLLECTION_NAME
);
if (!indexed) {
  await qdrant.createCollection(COLLECTION_NAME, {
    vectors: { size: 1536, distance: "Cosine", on_disk: true },
  });
}

const collectionInfo = await qdrant.getCollection(COLLECTION_NAME);
if (!collectionInfo.points_count) {
  console.log("empty collection");
  const allArticles = await getArticles();
  console.log("aaa");
  console.log(allArticles.length);

  const articles = allArticles.slice(0, 300);

  let documents = articles.map(
    ({ date, info, title, url }) =>
      new Document({
        pageContent: info,
        metadata: {
          date,
          title,
          url,
          source: COLLECTION_NAME,
          content: info,
          id: uuid(),
        },
      })
  );

  const points = [];
  for (const document of documents) {
    const [embedding] = await embeddings.embedDocuments([document.pageContent]);
    points.push({
      id: document.metadata.id,
      payload: document.metadata,
      vector: embedding,
    });
  }

  console.log("after points");

  console.log({ points });

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    batch: {
      ids: points.map((point) => point.id),
      vectors: points.map((point) => point.vector),
      payloads: points.map((point) => point.payload),
    },
  });

  console.log("after upsert");
}

const taskResolver = new TaskResolver("search");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { question } = taskResolver.getTask() as SearchTask;
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

console.dir(search, {
  depth: 999,
});

taskResolver.sendAnswer(search.at(0)?.payload?.url ?? "");
