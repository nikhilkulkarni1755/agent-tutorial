// const puppeteer = require('puppeteer');
// const path = require('path');
// const fs = require('fs');

// const browserTools = [
//   {
//     name: "launch_browser_and_goto_google",
//     description: "Launch browser and navigate directly to Google.com",
//     parameters: {
//       type: "object",
//       properties: {
//         headless: { type: "boolean", description: "Run headless (default: true)" },
//         width: { type: "number", description: "Browser width (default: 1920)" },
//         height: { type: "number", description: "Browser height (default: 1080)" }
//       }
//     },
//     function: async ({ headless = true, width = 1920, height = 1080 }) => {
//       try {
//         const browser = await puppeteer.launch({
//           headless,
//           args: ['--no-sandbox', '--disable-setuid-sandbox']
//         });
        
//         const page = await browser.newPage();
//         await page.setViewport({ width, height });
        
//         // Navigate directly to Google
//         await page.goto('https://google.com', { 
//           waitUntil: 'networkidle2',
//           timeout: 30000 
//         });
        
//         const title = await page.title();
        
//         // Store globally for screenshot tool
//         global.browserInstance = browser;
//         global.pageInstance = page;
        
//         return `Browser launched and navigated to Google.com successfully (${width}x${height}, headless: ${headless}). Page title: "${title}"`;
//       } catch (error) {
//         return `Failed to launch browser and navigate to Google: ${error.message}`;
//       }
//     }
//   },

//   {
//     name: "screenshot_google",
//     description: "Take a screenshot of the current Google page",
//     parameters: {
//       type: "object",
//       properties: {
//         filename: { type: "string", description: "Filename for screenshot (default: google-screenshot.png)" },
//         fullPage: { type: "boolean", description: "Capture full page (default: true)" }
//       }
//     },
//     function: async ({ filename = "google-screenshot.png", fullPage = true }) => {
//       if (!global.pageInstance) {
//         return "Error: Browser not launched. Use launch_browser_and_goto_google first.";
//       }
      
//       try {
//         const screenshotPath = path.join(process.cwd(), filename);
        
//         await global.pageInstance.screenshot({
//           path: screenshotPath,
//           fullPage
//         });
        
//         return `Google screenshot saved as ${filename}`;
//       } catch (error) {
//         return `Failed to take Google screenshot: ${error.message}`;
//       }
//     }
//   },

//   {
//     name: "close_browser",
//     description: "Close the browser instance",
//     parameters: {
//       type: "object",
//       properties: {}
//     },
//     function: async () => {
//       if (global.browserInstance) {
//         await global.browserInstance.close();
//         global.browserInstance = null;
//         global.pageInstance = null;
//         return "Browser closed successfully";
//       }
//       return "No browser instance to close";
//     }
//   }
// ];

// module.exports = browserTools;
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const browserTools = [
//   {
//     name: "launch_browser_goto_google",
//     description: "Launch browser and navigate to Google.com",
//     parameters: {
//       type: "object",
//       properties: {
//         headless: { type: "boolean", description: "Run headless (default: true)" },
//         width: { type: "number", description: "Browser width (default: 1920)" },
//         height: { type: "number", description: "Browser height (default: 1080)" }
//       }
//     },
//     function: async ({ headless = true, width = 1920, height = 1080 }) => {
//       try {
//         const browser = await puppeteer.launch({
//           headless,
//           args: ['--no-sandbox', '--disable-setuid-sandbox']
//         });
        
//         const page = await browser.newPage();
//         await page.setViewport({ width, height });
        
//         await page.goto('https://google.com', { 
//           waitUntil: 'networkidle2',
//           timeout: 30000 
//         });
        
//         const title = await page.title();
        
//         global.browserInstance = browser;
//         global.pageInstance = page;
        
//         return `Browser launched and Google.com loaded (${width}x${height}, headless: ${headless}). Ready to search.`;
//       } catch (error) {
//         return `Failed to launch browser: ${error.message}`;
//       }
//     }
//   },

// {
//   name: "google_search",
//   description: "Search for a topic on Google using direct URL",
//   parameters: {
//     type: "object",
//     properties: {
//       query: { type: "string", description: "Search query/topic" }
//     },
//     required: ["query"]
//   },
//   function: async ({ query }) => {
//     if (!global.pageInstance) {
//       return "Error: Browser not launched. Use launch_browser_goto_google first.";
//     }
    
//     try {
//       // Direct URL search - much more reliable
//       const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      
//       await global.pageInstance.goto(searchUrl, { 
//         waitUntil: 'domcontentloaded',
//         timeout: 30000 
//       });
      
//       // Wait for search results container to appear
//       await global.pageInstance.waitForSelector('#search, #rso', { timeout: 10000 });
      
//       // Get the page title to confirm search worked
//       const title = await global.pageInstance.title();
      
//       return `Successfully searched Google for: "${query}" - Page loaded: ${title}`;
//     } catch (error) {
//       return `Failed to search for "${query}": ${error.message}`;
//     }
//   }
// },

{
  name: "launch_browser_goto_bing",
  description: "Launch browser and navigate to Bing.com",
  parameters: {
    type: "object",
    properties: {
      headless: { type: "boolean", description: "Run headless (default: true)" },
      width: { type: "number", description: "Browser width (default: 1920)" },
      height: { type: "number", description: "Browser height (default: 1080)" }
    }
  },
  function: async ({ headless = true, width = 1920, height = 1080 }) => {
    try {
      const browser = await puppeteer.launch({
        headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setViewport({ width, height });
      
      await page.goto('https://www.bing.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      const title = await page.title();
      
      global.browserInstance = browser;
      global.pageInstance = page;
      
      return `Browser launched and Bing.com loaded (${width}x${height}, headless: ${headless}). Ready to search.`;
    } catch (error) {
      return `Failed to launch browser: ${error.message}`;
    }
  }
},

{
  name: "bing_search",
  description: "Search for a topic on Bing using direct URL",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query/topic" }
    },
    required: ["query"]
  },
  function: async ({ query }) => {
    if (!global.pageInstance) {
      return "Error: Browser not launched. Use launch_browser_goto_bing first.";
    }
    
    try {
      // Bing search URL format
      const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
      
      await global.pageInstance.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      // Wait for Bing search results container
      await global.pageInstance.waitForSelector('#b_results, .b_algo', { timeout: 10000 });
      
      // Get the page title to confirm search worked
      const title = await global.pageInstance.title();
      
      return `Successfully searched Bing for: "${query}" - Page loaded: ${title}`;
    } catch (error) {
      return `Failed to search for "${query}": ${error.message}`;
    }
  }
},
//   {
//     name: "screenshot_search_results",
//     description: "Take a screenshot of the current Google search results",
//     parameters: {
//       type: "object",
//       properties: {
//         filename: { type: "string", description: "Filename for screenshot (optional)" },
//         fullPage: { type: "boolean", description: "Capture full page (default: true)" }
//       }
//     },
//     function: async ({ filename, fullPage = true }) => {
//       if (!global.pageInstance) {
//         return "Error: Browser not launched. Use launch_browser_goto_google first.";
//       }
      
//       try {
//         const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//         const screenshotName = filename || `google-search-${timestamp}.png`;
//         const screenshotPath = path.join(process.cwd(), screenshotName);
        
//         await global.pageInstance.screenshot({
//           path: screenshotPath,
//           fullPage
//         });
        
//         return `Screenshot of Google search results saved as ${screenshotName}`;
//       } catch (error) {
//         return `Failed to take screenshot: ${error.message}`;
//       }
//     }
//   },
// {
//   name: "screenshot_search_results",
//   description: "Take a screenshot of the current search results after waiting for page to load",
//   parameters: {
//     type: "object",
//     properties: {
//       filename: { type: "string", description: "Filename for screenshot (optional)" },
//       fullPage: { type: "boolean", description: "Capture full page (default: true)" }
//     }
//   },
//   function: async ({ filename, fullPage = true }) => {
//     if (!global.pageInstance) {
//       return "Error: Browser not launched. Use launch_browser_goto_bing first.";
//     }
    
//     try {
//       // Wait 2 seconds for page to fully load
//       await global.pageInstance.waitForTimeout(2000);
      
//       const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//       const screenshotName = filename || `bing-search-${timestamp}.png`;
//       const screenshotPath = path.join(process.cwd(), screenshotName);
      
//       await global.pageInstance.screenshot({
//         path: screenshotPath,
//         fullPage
//       });
      
//       return `Screenshot of search results saved as ${screenshotName} (waited 2 seconds for loading)`;
//     } catch (error) {
//       return `Failed to take screenshot: ${error.message}`;
//     }
//   }
// },
// {
//   name: "screenshot_search_results",
//   description: "Take a screenshot of the current search results after waiting for page to load",
//   parameters: {
//     type: "object",
//     properties: {
//       filename: { type: "string", description: "Filename for screenshot (optional)" },
//       fullPage: { type: "boolean", description: "Capture full page (default: true)" }
//     }
//   },
//   function: async ({ filename, fullPage = true }) => {
//     if (!global.pageInstance) {
//       return "Error: Browser not launched. Use launch_browser_goto_bing first.";
//     }
    
//     try {
//       // Wait 2 seconds for page to fully load
//       await global.pageInstance.waitForTimeout(2000);
      
//       const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//       const screenshotName = filename || `bing-search-${timestamp}.png`;
      
//       // Use simple path without path.join if path module isn't available
//       const screenshotPath = screenshotName;
      
//       await global.pageInstance.screenshot({
//         path: screenshotPath,
//         fullPage
//       });
      
//       return `Screenshot of search results saved as ${screenshotName} (waited 2 seconds for loading)`;
//     } catch (error) {
//       return `Failed to take screenshot: ${error.message}`;
//     }
//   }
// },

{
  name: "screenshot_search_results",
  description: "Take a screenshot of the current search results after waiting for page to load",
  parameters: {
    type: "object",
    properties: {
      filename: { type: "string", description: "Filename for screenshot (optional)" },
      fullPage: { type: "boolean", description: "Capture full page (default: true)" }
    }
  },
  function: async ({ filename, fullPage = true }) => {
    if (!global.pageInstance) {
      return "Error: Browser not launched. Use launch_browser_goto_bing first.";
    }
    
    try {
      // Wait for page to fully load
    //   await global.pageInstance.waitForTimeout(3000);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate timestamp for unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotName = filename || `bing-search-${timestamp}.png`;
      
      // Use absolute path to ensure file is saved in correct location
      const screenshotPath = path.join(process.cwd(), screenshotName);
      
      // Check if page is ready by waiting for search results
      try {
        await global.pageInstance.waitForSelector('#b_results, .b_algo', { timeout: 5000 });
      } catch (e) {
        console.log('Search results selector not found, proceeding with screenshot anyway');
      }
      
      // Take screenshot with error handling
      await global.pageInstance.screenshot({
        path: screenshotPath,
        fullPage: fullPage,
        type: 'png'
      });
      
      // Verify file was created
      if (fs.existsSync(screenshotPath)) {
        const stats = fs.statSync(screenshotPath);
        return `Screenshot saved successfully as ${screenshotName} (${stats.size} bytes) at ${screenshotPath}`;
      } else {
        return `Error: Screenshot file ${screenshotName} was not created`;
      }
      
    } catch (error) {
      console.error('Screenshot error:', error);
      return `Failed to take screenshot: ${error.message}`;
    }
  }
},
  {
    name: "close_browser",
    description: "Close the browser instance",
    parameters: {
      type: "object",
      properties: {}
    },
    function: async () => {
      if (global.browserInstance) {
        await global.browserInstance.close();
        global.browserInstance = null;
        global.pageInstance = null;
        return "Browser closed successfully";
      }
      return "No browser instance to close";
    }
  }
];

module.exports = browserTools;