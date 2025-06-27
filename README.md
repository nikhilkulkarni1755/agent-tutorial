# Agent Tutorial

Discover how to build an agent inspired by this [tweet from @adamwathan](https://x.com/adamwathan/status/1929601562772398109) and the [original blog post](https://ampcode.com/how-to-build-an-agent).

---

## What’s Different?

- Switched the stack to **Node.js** with **OpenAI** for simplicity and convenience.
- Added request and response logging for better debugging and transparency.
- Core concepts and results remain faithful to the original tutorial.

---

## Setup

### Required Environment Variables

You will need to add the following keys to your `.env` file:

| Variable             | Description                      | Where to Get It                                                                                       |
| -------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY`     | Your OpenAI API key              | [Generate here](https://platform.openai.com/settings/organization/api-keys)                           |
| `BLUESKY_HANDLE`     | Your Bluesky app password handle | [Create app password](https://bsky.app/settings/app-passwords)                                        |
| `BLUESKY_PASSWORD`   | Your Bluesky app password        | [Create app password](https://bsky.app/settings/app-passwords)                                        |
| `TWITTER_API_KEY`    | Your Twitter API key             | [Developer portal](https://developer.x.com) → Create project & app → Keys and tokens → API key        |
| `TWITTER_API_SECRET` | Your Twitter API secret          | [Developer portal](https://developer.x.com) → Create project & app → Keys and tokens → API key secret |

---

## Getting Started

1. Clone this repo
2. Run `npm install`
3. Add your keys to `.env`
4. Start the app with `node index.js`
5. Watch the logs for requests and model outputs

---

_Happy coding! Feel free to open issues or contribute._
