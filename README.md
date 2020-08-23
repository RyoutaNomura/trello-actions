# trello-actions

This action operates trello's cards, according to github's pull request.
It works only if event is pull-request

## Inputs

### `target-action-name`
**Required** The name of action of trello operation. Two operations can be executed.
1. `attach-pr-to-card` This target attaches pull request url to trello's card.
2. `move-card` This target moves card to certain trello's list.

### `trello-api-key`
**Required** API key to use trello's REST API. Recommended to use Github secret to store this value.

### `trello-api-token`
**Required** API token to use trello's REST API. Recommended to use Github secret to store this value.

### `board-id`
**Required** Board id of Trello to operate.

### `list-id-containing-completed-cards`
Trello's list id to move cards to after pull request merge.
(Required if target-action-name is `move-card`)

## Outputs

Noting.

## Example usage

### `attach-pr-to-card`
```
on: 
  pull_request:
    types: [opened, edited, reopened]
    branches: [master]

jobs:
  attach-pr-to-trello-card:
    runs-on: ubuntu-latest
    name: attach PR's url to trello card if PR's description contains trello url
    steps:
      - name: Trello action
        uses: RyoutaNomura/trello-actions@v0.1
        with:
          target-action-name: 'attach-pr-to-card'
          board-id: 'hoge'
          trello-api-key: ${{secrets.TRELLO_API_KEY}}
          trello-api-token: ${{secrets.TRELLO_API_TOKEN}}
```

### `move-card`
```
on: 
  pull_request:
    types: [closed]
    branches: [master]

jobs:
  move-card-after-merged:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Trello action
        uses: RyoutaNomura/trello-actions@v0.1
        with:
          target-action-name: 'move-card'
          board-id: '5f295471389a00455867bc20'
          list-id-containing-completed-cards: 'hoge'
          trello-api-key: ${{secrets.TRELLO_API_KEY}}
          trello-api-token: ${{secrets.TRELLO_API_TOKEN}}
```
