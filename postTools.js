const { AtpAgent } = require('@atproto/api');
const got = require('got');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');
const qs = require('querystring');
require('dotenv').config();

const postToBoth = async ({ content }) => {
  try {
    const twitterResult = await postToTwitter({ content });
    console.log("[Twitter] Success:", twitterResult);

    const blueskyResult = await postToBluesky({ content });
    console.log("[Bluesky] Success:", blueskyResult);

    return `✅ Both posts succeeded!
    Twitter: ${twitterResult}
    Bluesky: ${blueskyResult}`;
  } catch (err) {
    console.error("[post_to_both] Error:", err);
    // Fail fast, only Twitter errors prevent Bluesky
    return {
      success: false,
      error: err.message || err.toString()
    };
  }
};




const postToTwitter = async ({ content }) => {
  const consumer_key = process.env.TWITTER_API_KEY;
  const consumer_secret = process.env.TWITTER_API_SECRET;

  const oauth = OAuth({
    consumer: {
      key: consumer_key,
      secret: consumer_secret
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (baseString, key) =>
      crypto.createHmac('sha1', key).update(baseString).digest('base64')
  });

  const requestTokenURL = 'https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write';
  const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
  const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
  const endpointURL = `https://api.twitter.com/2/tweets`;

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const input = (prompt) =>
    new Promise((resolve) => readline.question(prompt, (out) => {
      readline.close();
      resolve(out);
    }));

  // Step 1: Request Token
  const authHeader = oauth.toHeader(oauth.authorize({
    url: requestTokenURL,
    method: 'POST'
  }));

  const reqTokenRes = await got.post(requestTokenURL, {
    headers: {
      Authorization: authHeader["Authorization"]
    }
  });

  const oAuthRequestToken = qs.parse(reqTokenRes.body);

  // Step 2: Ask user to authorize
  authorizeURL.searchParams.append('oauth_token', oAuthRequestToken.oauth_token);
  console.log('Please authorize here:', authorizeURL.href);
  const pin = await input('Paste the PIN here: ');

  // Step 3: Get Access Token
  const accessTokenPath = `${accessTokenURL}?oauth_verifier=${pin.trim()}&oauth_token=${oAuthRequestToken.oauth_token}`;

  const accessRes = await got.post(accessTokenPath, {
    headers: {
      Authorization: authHeader["Authorization"]
    }
  });

  const oAuthAccessToken = qs.parse(accessRes.body);

  // Step 4: Post Tweet
  const token = {
    key: oAuthAccessToken.oauth_token,
    secret: oAuthAccessToken.oauth_token_secret
  };

  const postHeader = oauth.toHeader(oauth.authorize({
    url: endpointURL,
    method: 'POST'
  }, token));

  const tweetRes = await got.post(endpointURL, {
    json: { text: content },
    responseType: 'json',
    headers: {
      Authorization: postHeader["Authorization"],
      'user-agent': "v2CreateTweetJS",
      'content-type': "application/json",
      'accept': "application/json"
    }
  });

  console.log(`[Twitter] Posted: ${content}`);
  return `Posted to Twitter: ${content} (Tweet ID: ${tweetRes.body.data?.id})`;
};

const postToBluesky = async ({ content }) => {
  const agent = new AtpAgent({ service: 'https://bsky.social' });

  await agent.login({
    identifier: process.env.BLUESKY_HANDLE,
    password: process.env.BLUESKY_PASSWORD,
  });

  const response = await agent.api.app.bsky.feed.post.create(
    { repo: agent.session.did },
    {
      $type: 'app.bsky.feed.post',
      text: content,
      createdAt: new Date().toISOString(),
    }
  );

  console.log(`[Bluesky] Posted: ${content}`);
  return `Posted to Bluesky: ${content} (URI: ${response.uri})`;
};

module.exports = [
  {
    name: "post_to_bluesky",
    description: "Posts a toot (post) to Bluesky with the given content",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The Bluesky post content" },
      },
      required: ["content"],
    },
    function: postToBluesky,
  },
  {
    name: "post_to_twitter",
    description: "Posts a tweet to Twitter with the given content (uses PIN-based OAuth)",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "The Twitter post content" },
      },
      required: ["content"],
    },
    function: postToTwitter,
  },
  {
  name: "post_to_both",
  description: "Posts a message to Twitter first (via PIN-based OAuth). If Twitter succeeds, then posts the same message to Bluesky.",
  parameters: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The post content to publish on Twitter and Bluesky"
      }
    },
    required: ["content"]
  },
  function: postToBoth
}
];