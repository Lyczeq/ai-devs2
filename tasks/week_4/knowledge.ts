import { ChatOpenAI } from "langchain/chat_models/openai";
import { Task, TaskResolver } from "../../lib/auth";
import { HumanMessage, SystemMessage } from "langchain/schema";

type KnowledgeTask = Task & {
  question: string;
};

type Rate = {
  currency: string;
  code: string;
  mid: string;
};

type GetCurrencyRatesResponse = ReadonlyArray<{ rates: ReadonlyArray<Rate> }>;

type CountryData = {
  name: {
    common: string;
  };
  population: string;
};

type GetCountriesDataResponse = ReadonlyArray<CountryData>;

async function getCurrencyRates() {
  const response = await fetch("http://api.nbp.pl/api/exchangerates/tables/A", {
    headers: {
      Accept: "application/json",
    },
  });

  return response.json<GetCurrencyRatesResponse>();
}

async function getCountriesData() {
  const response = await fetch("https://restcountries.com/v3.1/all", {
    headers: {
      Accept: "application/json",
    },
  });

  return response.json<GetCountriesDataResponse>();
}

const taskResolver = new TaskResolver("knowledge");
await taskResolver.getAuthTokenForTask();
await taskResolver.fetchTask();
const { question } = taskResolver.getTask() as KnowledgeTask;
const a = await getCountriesData();

const openai = new ChatOpenAI({
  modelName: "gpt-4",
});

const { content } = await openai.call([
  new SystemMessage(
    "If question is about the population of the country return: 'NO. {name of the country}.'\n Example:```User: Podaj populację Francji.\n AI: POPULATION.France```\n If question is about the currency return: 'NO. {short currency name}.'\n Example: ```User: Jaki jest dzisiejszy kurs dolara amerykańskiego?\n AI: CURRENCY.USD```\n If question is about general knowledge just answer.\n Example:```User: jak nazywa się stolica Czech?\n AI: Prague\n``` IMPORTANT Answer in English"
  ),
  new HumanMessage(question),
]);

if (content.includes("POPULATION")) {
  const questionPopulation = content.replace("POPULATION.", "");
  const countries = await getCountriesData();

  const countryToFind = countries.find(
    (country) => country.name.common === questionPopulation
  );

  if (!countryToFind) {
    console.log("Oops, something went wrong!");
  } else {
    taskResolver.sendAnswer(countryToFind.population);
  }
} else if (content.includes("CURRENCY")) {
  const questionCurrency = content.replace("CURRENCY.", "");
  const rates = await getCurrencyRates();
  const currencyToFind = rates[0].rates.find(
    (rate) => rate.code === questionCurrency
  );
  if (currencyToFind) {
    taskResolver.sendAnswer(currencyToFind.mid);
  } else {
    console.log("Oops, something went wrong!");
  }
} else {
  taskResolver.sendAnswer(content);
}
