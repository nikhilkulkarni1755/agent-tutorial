const { AtpAgent } = require("@atproto/api");
const got = require("got");
const crypto = require("crypto");
const OAuth = require("oauth-1.0a");
const qs = require("querystring");
const readline = require("readline");
// const readline = require('./readline')
require("dotenv").config();

/** ---------- Common Utilities ---------- **/

function splitIntoSentences(content) {
  return content.match(/[^.!?]+[.!?]+[\])'"`’”]*|.+/g) || [];
}

function splitIntoTweets(content, maxLength = 280) {
  const sentences = splitIntoSentences(content);
  const tweets = [];
  let current = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if ((current + " " + trimmed).trim().length <= maxLength) {
      current = (current + " " + trimmed).trim();
    } else {
      if (current) tweets.push(current);
      current = trimmed;
    }
  }
  if (current) tweets.push(current);
  return tweets;
}

function promptInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(prompt, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function getUserId(oauth, token) {
  const url = "https://api.twitter.com/2/users/me";
  const header = oauth.toHeader(oauth.authorize({ url, method: "GET" }, token));

  const res = await got.get(url, {
    headers: { Authorization: header["Authorization"] },
    responseType: "json",
  });

  return res.body.data.id;
}

function getOAuthClient() {
  return OAuth({
    consumer: {
      key: process.env.TWITTER_API_KEY,
      secret: process.env.TWITTER_API_SECRET,
    },
    signature_method: "HMAC-SHA1",
    hash_function: (baseString, key) =>
      crypto.createHmac("sha1", key).update(baseString).digest("base64"),
  });
}

/** ---------- Tools ---------- **/

// function printTool(content) {
//   const sentences = splitIntoSentences(content);
//   console.log("📋 Draft - Sentence Breakdown:");
//   sentences.forEach((s, i) => console.log(`${i + 1}. ${s.trim()}`));
//   return sentences.map(s => s.trim());
// }

// const postToTwitter = async ({ content }) => {
//   const oauth = getOAuthClient();
//   const requestTokenURL =
//     "https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write";
//   const authorizeURL = new URL("https://api.twitter.com/oauth/authorize");
//   const accessTokenURL = "https://api.twitter.com/oauth/access_token";
//   const endpointURL = "https://api.twitter.com/2/tweets";

//   // Step 1: Get request token
//   const authHeader = oauth.toHeader(
//     oauth.authorize({ url: requestTokenURL, method: "POST" })
//   );
//   const reqTokenRes = await got.post(requestTokenURL, {
//     headers: { Authorization: authHeader["Authorization"] },
//   });
//   const oAuthRequestToken = qs.parse(reqTokenRes.body);

//   // Step 2: Authorize
//   authorizeURL.searchParams.append(
//     "oauth_token",
//     oAuthRequestToken.oauth_token
//   );
//   console.log("Authorize here:", authorizeURL.href);
//   const pin = await promptInput("Paste the PIN here: ");

//   // Step 3: Get access token
//   const accessRes = await got.post(
//     `${accessTokenURL}?oauth_verifier=${pin.trim()}&oauth_token=${
//       oAuthRequestToken.oauth_token
//     }`,
//     {
//       headers: { Authorization: authHeader["Authorization"] },
//     }
//   );
//   const oAuthAccessToken = qs.parse(accessRes.body);

//   const token = {
//     key: oAuthAccessToken.oauth_token,
//     secret: oAuthAccessToken.oauth_token_secret,
//   };

//   // Step 4: Post tweets (threaded)
//   const tweetChunks = splitIntoTweets(content);
//   let previousTweetId = null;
//   const results = [];

//   for (const tweetText of tweetChunks) {
//     const postHeader = oauth.toHeader(
//       oauth.authorize({ url: endpointURL, method: "POST" }, token)
//     );
//     const tweetBody = { text: tweetText };
//     if (previousTweetId) {
//       tweetBody.reply = { in_reply_to_tweet_id: previousTweetId };
//     }

//     const tweetRes = await got.post(endpointURL, {
//       json: tweetBody,
//       responseType: "json",
//       headers: {
//         Authorization: postHeader["Authorization"],
//         "user-agent": "v2CreateTweetJS",
//         "content-type": "application/json",
//         accept: "application/json",
//       },
//     });

//     previousTweetId = tweetRes.body.data?.id;
//     results.push(`Tweeted: ${tweetText} (ID: ${previousTweetId})`);
//   }

//   return results.join("\n");
// };
const postToTwitter = async ({ content }) => {
  const oauth = getOAuthClient();
  const requestTokenURL =
    "https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write";
  const authorizeURL = new URL("https://api.twitter.com/oauth/authorize");
  const accessTokenURL = "https://api.twitter.com/oauth/access_token";
  const endpointURL = "https://api.twitter.com/2/tweets";

  // Step 1: Get request token
  const authHeader = oauth.toHeader(
    oauth.authorize({ url: requestTokenURL, method: "POST" })
  );
  const reqTokenRes = await got.post(requestTokenURL, {
    headers: { Authorization: authHeader["Authorization"] },
  });
  const oAuthRequestToken = qs.parse(reqTokenRes.body);

  // Step 2: Authorize
  authorizeURL.searchParams.append(
    "oauth_token",
    oAuthRequestToken.oauth_token
  );
  console.log("Authorize here:", authorizeURL.href);
  const pin = await promptInput("Paste the PIN here: ");

  // Step 3: Get access token
  const accessRes = await got.post(
    `${accessTokenURL}?oauth_verifier=${pin.trim()}&oauth_token=${
      oAuthRequestToken.oauth_token
    }`,
    {
      headers: { Authorization: authHeader["Authorization"] },
    }
  );
  const oAuthAccessToken = qs.parse(accessRes.body);

  const token = {
    key: oAuthAccessToken.oauth_token,
    secret: oAuthAccessToken.oauth_token_secret,
  };

  // Step 4: Get user ID (needed to like tweets)
  const userId = await getUserId(oauth, token);

  // Step 5: Post tweets (threaded) and like them
  const tweetChunks = splitIntoTweets(content);
  let previousTweetId = null;
  const results = [];

  for (const tweetText of tweetChunks) {
    const postHeader = oauth.toHeader(
      oauth.authorize({ url: endpointURL, method: "POST" }, token)
    );
    const tweetBody = { text: tweetText };
    if (previousTweetId) {
      tweetBody.reply = { in_reply_to_tweet_id: previousTweetId };
    }

    const tweetRes = await got.post(endpointURL, {
      json: tweetBody,
      responseType: "json",
      headers: {
        Authorization: postHeader["Authorization"],
        "user-agent": "v2CreateTweetJS",
        "content-type": "application/json",
        accept: "application/json",
      },
    });

    previousTweetId = tweetRes.body.data?.id;
    results.push(`Tweeted: ${tweetText} (ID: ${previousTweetId})`);

    try {
      // Automatically like the tweet
      const likeURL = `https://api.twitter.com/2/users/${userId}/likes`;
      const likeHeader = oauth.toHeader(
        oauth.authorize({ url: likeURL, method: "POST" }, token)
      );

      await got.post(likeURL, {
        json: { tweet_id: previousTweetId },
        responseType: "json",
        headers: {
          Authorization: likeHeader["Authorization"],
          "user-agent": "v2LikeTweetJS",
          "content-type": "application/json",
          accept: "application/json",
        },
      });
    } catch (err) {
      if (err.response?.statusCode === 429) {
        console.warn(
          "⚠️ Rate limit hit on liking tweet. Skipping like for tweet ID:",
          previousTweetId
        );
      } else {
        console.error(
          "❌ Failed to like tweet ID",
          previousTweetId,
          err.message
        );
      }
    }
  }

  return results.join("\n");
};

const postToBluesky = async ({ content }) => {
  const agent = new AtpAgent({ service: "https://bsky.social" });

  await agent.login({
    identifier: process.env.BLUESKY_HANDLE,
    password: process.env.BLUESKY_PASSWORD,
  });

  const chunks = splitIntoTweets(content);
  let parentUri = null;
  let rootUri = null;
  const results = [];

  for (const text of chunks) {
    const postData = {
      $type: "app.bsky.feed.post",
      text,
      createdAt: new Date().toISOString(),
    };

    if (parentUri) {
      postData.reply = {
        root: { cid: rootUri.cid, uri: rootUri.uri },
        parent: { cid: parentUri.cid, uri: parentUri.uri },
      };
    }

    const res = await agent.api.app.bsky.feed.post.create(
      { repo: agent.session.did },
      postData
    );
    await agent.api.app.bsky.feed.like.create(
      { repo: agent.session.did },
      {
        $type: "app.bsky.feed.like",
        subject: {
          uri: res.uri,
          cid: res.cid,
        },
        createdAt: new Date().toISOString(),
      }
    );

    if (!rootUri) rootUri = res;
    parentUri = res;
    results.push(`Bluesky: ${text} (URI: ${res.uri})`);
  }

  return results.join("\n");
};

const postToBoth = async ({ content }) => {
  try {
    const twitterResult = await postToTwitter({ content });
    console.log("[Twitter] Success:\n", twitterResult);

    const blueskyResult = await postToBluesky({ content });
    console.log("[Bluesky] Success:\n", blueskyResult);

    return `✅ Both succeeded!\nTwitter:\n${twitterResult}\n\nBluesky:\n${blueskyResult}`;
  } catch (err) {
    console.error("[post_to_both] Error:", err);
    return { success: false, error: err.message || err.toString() };
  }
};

/** ---------- Module Exports ---------- **/

module.exports = [
  // {
  //   name: "printTool",
  //   description: "Prints numbered sentences from a draft content to help with editing and tweet preparation",
  //   parameters: {
  //     type: "object",
  //     properties: {
  //       content: { type: "string", description: "Draft to break into sentences" }
  //     },
  //     required: ["content"]
  //   },
  //   function: ({ content }) => printTool(content)
  // },
  {
    name: "post_to_twitter",
    description: "Posts a tweet to Twitter (with PIN-based OAuth)",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The tweet content" },
      },
      required: ["content"],
    },
    function: postToTwitter,
  },
  {
    name: "post_to_bluesky",
    description: "Posts to Bluesky with threading if needed",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The post content" },
      },
      required: ["content"],
    },
    function: postToBluesky,
  },
  {
    name: "post_to_both",
    description: "Posts to Twitter first, then Bluesky if successful",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to post on both" },
      },
      required: ["content"],
    },
    function: postToBoth,
  },
];
