// const { AtpAgent } = require('@atproto/api');
// const got = require('got');
// const crypto = require('crypto');
// const OAuth = require('oauth-1.0a');
// const qs = require('querystring');
// require('dotenv').config();

// function printTool(content) {
//   const sentences = content.match(/[^.!?]+[.!?]+[\])'"`’”]*|.+/g) || [];

//   console.log("📋 Draft - Sentence Breakdown:");
//   sentences.forEach((sentence, index) => {
//     console.log(`${index + 1}. ${sentence.trim()}`);
//   });

//   return sentences.map(s => s.trim());
// }

// function splitIntoTweets(content, maxLength = 280) {
//   const sentences = content.match(/[^.!?]+[.!?]+[\])'"`’”]*|.+/g) || [];
//   const tweets = [];
//   let currentTweet = "";

//   for (const sentence of sentences) {
//     const trimmed = sentence.trim();
//     if ((currentTweet + " " + trimmed).trim().length <= maxLength) {
//       currentTweet = (currentTweet + " " + trimmed).trim();
//     } else {
//       if (currentTweet) tweets.push(currentTweet);
//       currentTweet = trimmed;
//     }
//   }
//   if (currentTweet) tweets.push(currentTweet);
//   return tweets;
// }

// const postToBoth = async ({ content }) => {
//   try {
//     const twitterResult = await postToTwitter({ content });
//     console.log("[Twitter] Success:", twitterResult);

//     const blueskyResult = await postToBluesky({ content });
//     console.log("[Bluesky] Success:", blueskyResult);

//     return `✅ Both posts succeeded!
//     Twitter: ${twitterResult}
//     Bluesky: ${blueskyResult}`;
//   } catch (err) {
//     console.error("[post_to_both] Error:", err);
//     // Fail fast, only Twitter errors prevent Bluesky
//     return {
//       success: false,
//       error: err.message || err.toString()
//     };
//   }
// };




// const postToTwitter = async ({ content }) => {
//   const consumer_key = process.env.TWITTER_API_KEY;
//   const consumer_secret = process.env.TWITTER_API_SECRET;

//   const oauth = OAuth({
//     consumer: {
//       key: consumer_key,
//       secret: consumer_secret
//     },
//     signature_method: 'HMAC-SHA1',
//     hash_function: (baseString, key) =>
//       crypto.createHmac('sha1', key).update(baseString).digest('base64')
//   });

//   const requestTokenURL = 'https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write';
//   const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
//   const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
//   const endpointURL = `https://api.twitter.com/2/tweets`;

//   // const readline = require('./readline');
//   const readline = require('./readline').createInterface({
//     input: process.stdin,
//     output: process.stdout
//   });

//   const input = (prompt) =>
//     new Promise((resolve) => readline.question(prompt, (out) => {
//       readline.close();
//       resolve(out);
//     }));

//   // Step 1: Request Token
//   const authHeader = oauth.toHeader(oauth.authorize({
//     url: requestTokenURL,
//     method: 'POST'
//   }));

//   const reqTokenRes = await got.post(requestTokenURL, {
//     headers: {
//       Authorization: authHeader["Authorization"]
//     }
//   });

//   const oAuthRequestToken = qs.parse(reqTokenRes.body);

//   // Step 2: Ask user to authorize
//   authorizeURL.searchParams.append('oauth_token', oAuthRequestToken.oauth_token);
//   console.log('Please authorize here:', authorizeURL.href);
//   const pin = await input('Paste the PIN here: ');

//   // Step 3: Get Access Token
//   const accessTokenPath = `${accessTokenURL}?oauth_verifier=${pin.trim()}&oauth_token=${oAuthRequestToken.oauth_token}`;

//   const accessRes = await got.post(accessTokenPath, {
//     headers: {
//       Authorization: authHeader["Authorization"]
//     }
//   });

//   const oAuthAccessToken = qs.parse(accessRes.body);

//   // Step 4: Post Tweet
//   const token = {
//     key: oAuthAccessToken.oauth_token,
//     secret: oAuthAccessToken.oauth_token_secret
//   };

//   const postHeader = oauth.toHeader(oauth.authorize({
//     url: endpointURL,
//     method: 'POST'
//   }, token));

//   const tweetChunks = splitIntoTweets(content);
//   let previousTweetId = null;
//   let tweetResultMessages = [];
//   for (const tweetText of tweetChunks) {
//     const postHeader = oauth.toHeader(oauth.authorize({
//       url: endpointURL,
//       method: 'POST'
//     }, token));

//     const tweetBody = { text: tweetText };
//     if (previousTweetId) {
//       tweetBody.reply = { in_reply_to_tweet_id: previousTweetId };
//     }

//     const tweetRes = await got.post(endpointURL, {
//       json: tweetBody,
//       responseType: 'json',
//       headers: {
//         Authorization: postHeader["Authorization"],
//         'user-agent': "v2CreateTweetJS",
//         'content-type': "application/json",
//         'accept': "application/json"
//       }
//     });

//     previousTweetId = tweetRes.body.data?.id;
//     tweetResultMessages.push(`Tweeted: ${tweetText} (ID: ${previousTweetId})`);
//   }
//   // const tweetRes = await got.post(endpointURL, {
//   //   json: { text: content },
//   //   responseType: 'json',
//   //   headers: {
//   //     Authorization: postHeader["Authorization"],
//   //     'user-agent': "v2CreateTweetJS",
//   //     'content-type': "application/json",
//   //     'accept': "application/json"
//   //   }
//   // });
//   return tweetResultMessages.join('\n');
//   // console.log(`[Twitter] Posted: ${content}`);
//   // return `Posted to Twitter: ${content} (Tweet ID: ${tweetRes.body.data?.id})`;
// };

// const postToBluesky = async ({ content }) => {
//   const agent = new AtpAgent({ service: 'https://bsky.social' });

// await agent.login({
//   identifier: process.env.BLUESKY_HANDLE,
//   password: process.env.BLUESKY_PASSWORD,
// });

// const chunks = splitIntoTweets(content);
// let parentUri = null;
// let rootUri = null;
// let results = [];

// for (let i = 0; i < chunks.length; i++) {
//   const postData = {
//     $type: 'app.bsky.feed.post',
//     text: chunks[i],
//     createdAt: new Date().toISOString()
//   };

//   if (parentUri) {
//     postData.reply = {
//       root: { cid: rootUri.cid, uri: rootUri.uri },
//       parent: { cid: parentUri.cid, uri: parentUri.uri }
//     };
//   }

//   const res = await agent.api.app.bsky.feed.post.create(
//     { repo: agent.session.did },
//     postData
//   );

//   if (!rootUri) rootUri = res;
//   parentUri = res;
//   results.push(`Bluesky: ${chunks[i]} (URI: ${res.uri})`);
// }

// return results.join('\n');

// };

// module.exports = [
//   {
//     name: "printTool",
//     description: "Prints numbered sentences from a draft content to help with editing and tweet preparation",
//     parameters: {
//       type: "object",
//       properties: {
//         content: {
//           type: "string",
//           description: "The full draft content to break into sentences and display"
//         }
//       },
//       required: ["content"]
//     },
//     function: ({ content }) => printTool(content)
//   },
//   {
//     name: "post_to_bluesky",
//     description: "Posts a toot (post) to Bluesky with the given content",
//     parameters: {
//       type: "object",
//       properties: {
//         content: { type: "string", description: "The Bluesky post content" },
//       },
//       required: ["content"],
//     },
//     function: postToBluesky,
//   },
//   {
//     name: "post_to_twitter",
//     description: "Posts a tweet to Twitter with the given content (uses PIN-based OAuth)",
//     parameters: {
//       type: "object",
//       properties: {
//         content: { type: "string", description: "The Twitter post content" },
//       },
//       required: ["content"],
//     },
//     function: postToTwitter,
//   },
//   {
//   name: "post_to_both",
//   description: "Posts a message to Twitter first (via PIN-based OAuth). If Twitter succeeds, then posts the same message to Bluesky.",
//   parameters: {
//     type: "object",
//     properties: {
//       content: {
//         type: "string",
//         description: "The post content to publish on Twitter and Bluesky"
//       }
//     },
//     required: ["content"]
//   },
//   function: postToBoth
// }
// ];

const { AtpAgent } = require('@atproto/api');
const got = require('got');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');
const qs = require('querystring');
const readline = require('readline');
// const readline = require('./readline')
require('dotenv').config();

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
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(prompt, ans => {
    rl.close();
    resolve(ans);
  }));
}

function getOAuthClient() {
  return OAuth({
    consumer: {
      key: process.env.TWITTER_API_KEY,
      secret: process.env.TWITTER_API_SECRET
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (baseString, key) =>
      crypto.createHmac('sha1', key).update(baseString).digest('base64')
  });
}

/** ---------- Tools ---------- **/

function printTool(content) {
  const sentences = splitIntoSentences(content);
  console.log("📋 Draft - Sentence Breakdown:");
  sentences.forEach((s, i) => console.log(`${i + 1}. ${s.trim()}`));
  return sentences.map(s => s.trim());
}

const postToTwitter = async ({ content }) => {
  const oauth = getOAuthClient();
  const requestTokenURL = 'https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write';
  const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
  const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
  const endpointURL = 'https://api.twitter.com/2/tweets';

  // Step 1: Get request token
  const authHeader = oauth.toHeader(oauth.authorize({ url: requestTokenURL, method: 'POST' }));
  const reqTokenRes = await got.post(requestTokenURL, {
    headers: { Authorization: authHeader["Authorization"] }
  });
  const oAuthRequestToken = qs.parse(reqTokenRes.body);

  // Step 2: Authorize
  authorizeURL.searchParams.append('oauth_token', oAuthRequestToken.oauth_token);
  console.log('Authorize here:', authorizeURL.href);
  const pin = await promptInput('Paste the PIN here: ');

  // Step 3: Get access token
  const accessRes = await got.post(`${accessTokenURL}?oauth_verifier=${pin.trim()}&oauth_token=${oAuthRequestToken.oauth_token}`, {
    headers: { Authorization: authHeader["Authorization"] }
  });
  const oAuthAccessToken = qs.parse(accessRes.body);

  const token = {
    key: oAuthAccessToken.oauth_token,
    secret: oAuthAccessToken.oauth_token_secret
  };

  // Step 4: Post tweets (threaded)
  const tweetChunks = splitIntoTweets(content);
  let previousTweetId = null;
  const results = [];

  for (const tweetText of tweetChunks) {
    const postHeader = oauth.toHeader(oauth.authorize({ url: endpointURL, method: 'POST' }, token));
    const tweetBody = { text: tweetText };
    if (previousTweetId) {
      tweetBody.reply = { in_reply_to_tweet_id: previousTweetId };
    }

    const tweetRes = await got.post(endpointURL, {
      json: tweetBody,
      responseType: 'json',
      headers: {
        Authorization: postHeader["Authorization"],
        'user-agent': "v2CreateTweetJS",
        'content-type': "application/json",
        'accept': "application/json"
      }
    });

    previousTweetId = tweetRes.body.data?.id;
    results.push(`Tweeted: ${tweetText} (ID: ${previousTweetId})`);
  }

  return results.join('\n');
};

const postToBluesky = async ({ content }) => {
  const agent = new AtpAgent({ service: 'https://bsky.social' });

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
      $type: 'app.bsky.feed.post',
      text,
      createdAt: new Date().toISOString()
    };

    if (parentUri) {
      postData.reply = {
        root: { cid: rootUri.cid, uri: rootUri.uri },
        parent: { cid: parentUri.cid, uri: parentUri.uri }
      };
    }

    const res = await agent.api.app.bsky.feed.post.create(
      { repo: agent.session.did },
      postData
    );

    if (!rootUri) rootUri = res;
    parentUri = res;
    results.push(`Bluesky: ${text} (URI: ${res.uri})`);
  }

  return results.join('\n');
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
  {
    name: "printTool",
    description: "Prints numbered sentences from a draft content to help with editing and tweet preparation",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "Draft to break into sentences" }
      },
      required: ["content"]
    },
    function: ({ content }) => printTool(content)
  },
  {
    name: "post_to_twitter",
    description: "Posts a tweet to Twitter (with PIN-based OAuth)",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The tweet content" }
      },
      required: ["content"]
    },
    function: postToTwitter
  },
  {
    name: "post_to_bluesky",
    description: "Posts to Bluesky with threading if needed",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The post content" }
      },
      required: ["content"]
    },
    function: postToBluesky
  },
  {
    name: "post_to_both",
    description: "Posts to Twitter first, then Bluesky if successful",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to post on both" }
      },
      required: ["content"]
    },
    function: postToBoth
  }
];
