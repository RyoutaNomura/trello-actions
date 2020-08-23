import * as core from "@actions/core";
import * as github from "@actions/github";
import * as TrelloApi from "./trello-api";
import log4js from "log4js";

const logger = log4js.getLogger();
logger.level = "all";

const resolveTrelloUrlFrom = (text?: string): Array<string> => {
  if (text) {
    return text.match(/https:\/\/trello\.com\/c\/.*/g) || [];
  } else {
    return [];
  }
};

const createTrelloContext = (): TrelloApi.TrelloContext => {
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

const attachPrToCard = async (
  trelloContext: TrelloApi.TrelloContext,
  trelloUrls: Array<string>,
  prUrl?: string
): Promise<void> => {
  if (trelloUrls.length === 0) {
    logger.info("target card not fount");
    return;
  }

  logger.info(`target cards: ${trelloUrls}`);
  if (!prUrl) {
    throw new Error("pull-request url is not defined");
  }

  Promise.all(
    trelloUrls.map(async (url) => {
      const cardId = (url.match(/https:\/\/trello\.com\/c\/(.*)/) ||
        new Array(2))[1];

      const attachments = await TrelloApi.getAttachmentsOnACard(
        trelloContext,
        cardId
      );
      if (attachments.findIndex((a) => a.url === prUrl) > -1) {
        logger.info(`${prUrl} is already attached to ${cardId}`);
        logger.info(`skipped updating ${cardId}`);
      } else {
        logger.info(`attaching github url to card: ${cardId}`);
        TrelloApi.createAttachmentOnCard(trelloContext, cardId, {url:prUrl});
      }
    })
  );
};

const moveCard = async (
  trelloContext: TrelloApi.TrelloContext,
  trelloUrls: Array<string>,
  destListId: string
): Promise<void> => {
  if (trelloUrls.length === 0) {
    logger.info("target card not fount");
    return;
  }

  logger.info(`target cards: ${trelloUrls}`);
  if (!destListId) {
    throw new Error("dest-list-id is not defined");
  }

  Promise.all(
    trelloUrls.map(async (url) => {
      const cardId = (url.match(/https:\/\/trello\.com\/c\/(.*)/) ||
        new Array(2))[1];
      TrelloApi.updateACard(trelloContext, cardId, {idList:destListId});
    })
  );
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
          core.getInput("list-id-containing-completed-cards")
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
