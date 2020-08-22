"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const log4js_1 = __importDefault(require("log4js"));
const logger = log4js_1.default.getLogger();
logger.level = "all";
const resolveTrelloUrlFrom = (text) => {
    if (text) {
        return text.match(/https:\/\/trello\.com\/c\/.*/g) || [];
    }
    else {
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
const getAttachmentsOnACard = async (trelloContext, trelloCardId) => {
    const url = new URL(`https://trello.com/1/cards/${trelloCardId}/attachments`);
    url.search = new URLSearchParams({
        key: trelloContext.apiKey,
        token: trelloContext.apiToken,
    }).toString();
    const response = await node_fetch_1.default(url);
    if (!response.ok) {
        throw new Error(`cannot get card's attachments: ${trelloCardId} with response: ${await response.text()}`);
    }
    return await response.json();
};
const createAttachmentOnCard = async (trelloContext, id, url) => {
    const res = await node_fetch_1.default(`https://trello.com/1/cards/${id}/attachments`, {
        method: "POST",
        body: new URLSearchParams({
            key: trelloContext.apiKey,
            token: trelloContext.apiToken,
            url: url,
        }),
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`error occurred while updating ${id} with response: ${text}`);
    }
    logger.info(`successfully updated ${id}`);
};
const updateACard = async (trelloContext, id, idList) => {
    const res = await node_fetch_1.default(`https://trello.com/1/cards/${id}`, {
        method: "PUT",
        body: new URLSearchParams({
            key: trelloContext.apiKey,
            token: trelloContext.apiToken,
            idList: idList,
            pos: "top",
        }),
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`error occurred while updating ${id} with response: ${text}`);
    }
    logger.info(`successfully updated ${id}`);
};
const attachPrToCard = async (trelloContext, trelloUrls, prUrl) => {
    if (trelloUrls.length === 0) {
        logger.info("target card not fount");
        return;
    }
    logger.info(`target cards: ${trelloUrls}`);
    if (!prUrl) {
        throw new Error("pull-request url is not defined");
    }
    Promise.all(trelloUrls.map(async (url) => {
        const cardId = (url.match(/https:\/\/trello\.com\/c\/(.*)/) ||
            new Array(2))[1];
        const attachments = await getAttachmentsOnACard(trelloContext, cardId);
        if (attachments.findIndex((a) => a.url === prUrl) > -1) {
            logger.info(`${prUrl} is already attached to ${cardId}`);
            logger.info(`skipped updating ${cardId}`);
        }
        else {
            logger.info(`attaching github url to card: ${cardId}`);
            createAttachmentOnCard(trelloContext, cardId, prUrl);
        }
    }));
};
const moveCard = async (trelloContext, trelloUrls, destListId) => {
    if (trelloUrls.length === 0) {
        logger.info("target card not fount");
        return;
    }
    logger.info(`target cards: ${trelloUrls}`);
    if (!destListId) {
        throw new Error("dest-list-id is not defined");
    }
    Promise.all(trelloUrls.map(async (url) => {
        const cardId = (url.match(/https:\/\/trello\.com\/c\/(.*)/) ||
            new Array(2))[1];
        updateACard(trelloContext, cardId, destListId);
    }));
};
try {
    const targetActionName = core.getInput("target-action-name");
    logger.info(`target action is ${targetActionName}`);
    if (github.context.payload.pull_request) {
        switch (targetActionName) {
            case "attach-pr-to-card":
                attachPrToCard(createTrelloContext(), resolveTrelloUrlFrom(github.context.payload.pull_request.body), github.context.payload.pull_request.html_url);
                break;
            case "move-card":
                moveCard(createTrelloContext(), resolveTrelloUrlFrom(github.context.payload.pull_request.body), core.getInput("list-id-containing-completed-cards"));
                break;
            default:
                throw new Error(`target action name cannot be resolved: ${targetActionName}`);
        }
    }
}
catch (error) {
    core.setFailed(error.message);
}
//# sourceMappingURL=index.js.map