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
    logger.info(text);
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
const attachPrToCard = (trelloContext, trelloUrls, prUrl) => {
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
        node_fetch_1.default(`https://trello.com/1/cards/${cardId}/attachments`, {
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
const moveCard = (trelloContext, trelloUrls, destListId) => {
    logger.info("hoge");
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
                moveCard(createTrelloContext(), resolveTrelloUrlFrom(github.context.payload.pull_request.body), core.getInput("dest-list-id"));
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