import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from "node-fetch";
import log4js from "log4js";

const logger = log4js.getLogger();

interface TrelloContext {
  apiKey: string;
  apiToken: string;
  boardId: string;
}

const resolveTrelloUrlFrom = (text?: string): Array<string> => {
  logger.info(text);
  if (text) {
    return text.match(/https:\/\/trello\.com\/c\/.*/g) || [];
  } else {
    return [];
  }
};

const createTrelloContext = () => {
  const apiKey = process.env["TRELLO_API_KEY"];
  const apiToken = process.env["TRELLO_API_TOKEN"];
  const boardId = core.getInput("board-id");

  if (!apiKey) {
    throw new Error("TRELLO_API_KEY not defined");
  }
  if (!apiToken) {
    throw new Error("TRELLO_API_TOKEN not defined");
  }
  if (!boardId) {
    throw new Error("board-id not defined");
  }
  return {
    apiKey,
    apiToken,
    boardId,
  };
};

const attachPrToCard = (
  trelloContext: TrelloContext,
  trelloUrls: Array<string>,
  prUrl?: string
) => {
  if (trelloUrls.length === 0) {
    logger.info("target card not fount");
    return;
  }

  logger.info(`target cards: ${trelloUrls}`);
  if (!prUrl) {
    throw new Error("pull-request url is not defined");
  }

  trelloUrls.forEach((url) => {
    const cardId = (url.match(/https:\/\/trello\.com\/c\/(.*)/) ||
      new Array(2))[1];
    logger.info(`Attaching github url to card: ${cardId}`);
    fetch(`https://trello.com/1/cards/${cardId}/attachments`, {
      method: "POST",
      body: new URLSearchParams({
        key: trelloContext.apiKey,
        token: trelloContext.apiToken,
        url: prUrl,
      }),
    })
      .then((r) => {
        r.text().then((text) => logger.info(`response: ${text}`));
        if (!r.ok) {
          throw new Error(`error occurred while updating ${url}`);
        }
        logger.info(`successfully updated ${url}`);
      })
      .catch((error) => {
        logger.info(`error: ${error}`);
        throw error;
      });
  });
};

const moveCard = (
  trelloContext: TrelloContext,
  trelloUrls: Array<string>,
  destListId: string
) => {
  logger.info("hoge");
};

try {
  const targetActionName = core.getInput("target-action-name");
  logger.info(`target action is ${targetActionName}`);

  if (github.context.payload.pull_request) {
    switch (targetActionName) {
      case "attach-pr-to-card":
        attachPrToCard(
          createTrelloContext(),
          resolveTrelloUrlFrom(github.context.payload.pull_request.body),
          github.context.payload.pull_request.html_url
        );
        break;
      case "move-card":
        moveCard(
          createTrelloContext(),
          resolveTrelloUrlFrom(github.context.payload.pull_request.body),
          core.getInput("dest-list-id")
        );
        break;
      default:
        throw new Error(
          `target action name cannot be resolved: ${targetActionName}`
        );
    }
  }
} catch (error) {
  core.setFailed(error.message);
}
