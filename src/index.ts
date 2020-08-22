import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from "node-fetch";
import log4js from "log4js";

const logger = log4js.getLogger();
logger.level = "all";

interface TrelloContext {
  apiKey: string;
  apiToken: string;
  boardId: string;
}

interface Attachment {
  id: string;
  btyes: string;
  date: string;
  edgeColor: string;
  idMember: string;
  isUpload: boolean;
  mimeType: string;
  name: string;
  previews: Array<string>;
  url: string;
  pos: number;
}

const resolveTrelloUrlFrom = (text?: string): Array<string> => {
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

const getAttachmentsOnACard = async (
  trelloContext: TrelloContext,
  trelloCardId: string
): Promise<Array<Attachment>> => {
  const url = new URL(`https://trello.com/1/cards/${trelloCardId}/attachments`);
  url.search = new URLSearchParams({
    key: trelloContext.apiKey,
    token: trelloContext.apiToken,
  }).toString();

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `cannot get card's attachments: ${trelloCardId} with response: ${await response.text()}`
    );
  }
  return await response.json();
};

const createAttachmentOnCard = async (
  trelloContext: TrelloContext,
  id: string,
  url: string
) => {
  const res = await fetch(`https://trello.com/1/cards/${id}/attachments`, {
    method: "POST",
    body: new URLSearchParams({
      key: trelloContext.apiKey,
      token: trelloContext.apiToken,
      url: url,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `error occurred while updating ${id} with response: ${text}`
    );
  }
  logger.info(`successfully updated ${id}`);
};

const updateACard = async (
  trelloContext: TrelloContext,
  id: string,
  idList: string
) => {
  const res = await fetch(`https://trello.com/1/cards/${id}`, {
    method: "PUT",
    body: new URLSearchParams({
      key: trelloContext.apiKey,
      token: trelloContext.apiToken,
      idList: idList,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `error occurred while updating ${id} with response: ${text}`
    );
  }
  logger.info(`successfully updated ${id}`);
};

const attachPrToCard = async (
  trelloContext: TrelloContext,
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

      const attachments = await getAttachmentsOnACard(trelloContext, cardId);
      if (attachments.findIndex((a) => a.url === prUrl) > -1) {
        logger.info(`${prUrl} is already attached to ${cardId}`);
        logger.info(`skipped updating ${cardId}`);
      } else {
        logger.info(`attaching github url to card: ${cardId}`);
        createAttachmentOnCard(trelloContext, cardId, prUrl);
      }
    })
  );
};

const moveCard = async (
  trelloContext: TrelloContext,
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
      updateACard(trelloContext, cardId, destListId);
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
