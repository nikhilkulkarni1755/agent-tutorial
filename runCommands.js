const { exec } = require("child_process");
const path = require("path");

const fs = require("fs").promises;
// const path = require('path');

const moveItem = {
  name: "move_item",
  description:
    "Moves a file or folder from one path to another. 🔸 Use relative paths.",
  parameters: {
    type: "object",
    properties: {
      from: {
        type: "string",
        description:
          "The path to the file or folder to move (relative to the project root)",
      },
      to: {
        type: "string",
        description: "The destination path (relative to the project root)",
      },
    },
    required: ["from", "to"],
  },
  function: async ({ from, to }) => {
    try {
      const fromPath = path.resolve(from);
      const toPath = path.resolve(to);
      await fs.rename(fromPath, toPath);
      return `✅ Moved '${from}' to '${to}'.`;
    } catch (err) {
      return `❌ Error moving '${from}' to '${to}': ${err.message}`;
    }
  },
};

// const deployToGCPAppEngine = {
//   name: "deploy_to_gcp",
//   description:
//     "Deploys an app to Google App Engine using `gcloud app deploy`. 🔸 Requires a valid `app.yaml` in the target folder and authenticated `gcloud` CLI.",
//   parameters: {
//     type: "object",
//     properties: {
//       cwd: {
//         type: "string",
//         description:
//           "The directory where the `app.yaml` is located. Defaults to current directory.",
//         default: process.cwd(),
//       },
//       promote: {
//         type: "boolean",
//         description:
//           "Whether to promote the deployed version to receive all traffic. Defaults to true.",
//         default: true,
//       },
//       project: {
//         type: "string",
//         description: "Optionally specify the GCP project ID to deploy to.",
//       },
//     },
//     required: [],
//   },
//   function: async ({ cwd = process.cwd(), promote = true, project }) => {
//     const promoteFlag = promote ? "--promote" : "--no-promote";
//     const projectFlag = project ? `--project=${project}` : "";
//     const command = `gcloud app deploy ${promoteFlag} ${projectFlag}`.trim();

//     return await runCommand({ command, cwd });
//   },
// };
const deployToAmplifyHosting = {
  name: "deploy_to_amplify",
  description:
    "Deploys a static site to AWS Amplify Hosting using Amplify CLI. 🔸 Assumes `dist` folder is ready and AWS CLI is configured.",
  parameters: {
    type: "object",
    properties: {
      cwd: {
        type: "string",
        description:
          "The directory containing the `dist` folder. Defaults to current directory.",
        default: process.cwd(),
      },
    },
    required: [],
  },
  function: async ({ cwd = process.cwd() }) => {
    const initCommand = `amplify init --yes`;
    const addHostingCommand = `amplify add hosting --yes`;
    const publishCommand = `amplify publish`;

    try {
      await runCommand({ command: initCommand, cwd });
      await runCommand({ command: addHostingCommand, cwd });
      return await runCommand({ command: publishCommand, cwd });
    } catch (err) {
      return `❌ Amplify deployment failed: ${err}`;
    }
  },
};

const readFileTool = {
  name: "read_file",
  description:
    "Reads the contents of a file. Use this to load source code, configs, or other file content. Do not use for binary files. 🔸 Use a relative path (e.g., 'src/App.tsx'), not an absolute path. Returns the file's contents as a string.",
  parameters: {
    type: "object",
    properties: {
      filepath: {
        type: "string",
        description: "Path to the file relative to the root of the project",
      },
    },
    required: ["filepath"],
  },
  function: async (input) => {
    try {
      const { filepath } = input;
      const fullPath = path.resolve(filepath);
      const content = await fs.readFile(fullPath, "utf-8");
      return content;
    } catch (err) {
      return `Error reading file: ${err.message}`;
    }
  },
};

const listFilesTool = {
  name: "list_files",
  description:
    "Lists all files and folders in a directory. Use this to explore the project structure or find filenames to read.🔸 Use a relative path (e.g., 'src/App.tsx'), not an absolute path.",
  parameters: {
    type: "object",
    properties: {
      dirpath: {
        type: "string",
        description:
          "Path to the directory (relative to the root). Use '.' for current directory.",
      },
    },
    required: ["dirpath"],
  },
  function: async (input) => {
    try {
      const { dirpath } = input;
      const fullPath = path.resolve(dirpath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const formatted = entries.map((entry) => {
        return entry.isDirectory()
          ? `[DIR] ${entry.name}`
          : `      ${entry.name}`;
      });
      return formatted.join("\n");
    } catch (err) {
      return `Error listing files: ${err.message}`;
    }
  },
};

const editFileTool = {
  name: "edit_file",
  description:
    "Edits a file. By default, replaces the contents of a file with new content. You can also append by setting append = true. 🔸 Use a relative path (e.g., src/App.tsx), not an absolute path.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "The file path to edit" },
      new_content: {
        type: "string",
        description: "The full new content to write or append to the file",
      },
      append: {
        type: "boolean",
        description:
          "Set to true to append instead of overwriting (default: false)",
        default: false,
      },
    },
    required: ["path", "new_content"],
  },
  function: async ({ path: filePath, new_content, append = false }) => {
    const absPath = path.resolve(process.cwd(), filePath);
    try {
      if (append) {
        await fs.appendFile(absPath, new_content, "utf8");
        return `Appended content to '${filePath}'.`;
      } else {
        await fs.writeFile(absPath, new_content, "utf8");
        return `File '${filePath}' successfully overwritten.`;
      }
    } catch (err) {
      return `Error editing file: ${err.message}`;
    }
  },
};

const runCommand = ({ command, cwd = process.cwd() }) => {
  return new Promise((resolve, reject) => {
    console.log(`[Runner] Executing in ${cwd}: ${command}`);
    exec(command, { cwd, shell: true }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Runner] Error: ${stderr}`);
        reject(`❌ Command failed: ${stderr}`);
      } else {
        console.log(`[Runner] Output: ${stdout}`);
        resolve(`✅ Command succeeded:\n${stdout}`);
      }
    });
  });
};

// 🛠️ Hardcoded command wrappers

const createViteProject = ({
  name,
  template = "react-ts",
  cwd = process.cwd(),
}) => {
  if (!name) throw new Error("Project name is required.");
  const fullCommand = `npm create vite@latest ${name} -- --template ${template}`;
  return runCommand({ command: fullCommand, cwd });
};

const installDeps = ({ cwd = process.cwd() }) =>
  runCommand({ command: "npm install", cwd });

const runDevServer = ({ cwd = process.cwd() }) =>
  runCommand({ command: "npm run dev", cwd });

const buildProject = ({ cwd = process.cwd() }) =>
  runCommand({ command: "npm run build", cwd });

//
// module.exports = [readFileTool, listFilesTool, editFileTool];
module.exports = [
  readFileTool,
  listFilesTool,
  editFileTool,
  moveItem,
  deployToAmplifyHosting,
  {
    name: "create_vite_project",
    description:
      "Creates a new Vite project with an optional template (e.g., react-ts). 🔸 The project folder will be created relative to the provided 'cwd' or the current working directory.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "The name of the project (used as the folder name and CLI argument)",
        },
        template: {
          type: "string",
          description:
            "The Vite template to use (e.g., react-ts, vue, svelte-ts). Defaults to react-ts.",
          default: "react-ts",
        },
        cwd: {
          type: "string",
          description:
            "The base directory where the project folder should be created. Defaults to current working directory.",
          default: process.cwd(),
        },
      },
      required: ["name"],
    },
    function: createViteProject,
  },

  {
    name: "install_dependencies",
    description:
      "Runs `npm install` to install project dependencies. 🔸 Set 'cwd' to the relative path of the project directory if needed.",
    parameters: {
      type: "object",
      properties: {
        cwd: {
          type: "string",
          description: "Project directory",
          default: process.cwd(),
        },
      },
      required: [],
    },
    function: installDeps,
  },
  {
    name: "run_dev_server",
    description:
      "Runs `npm run dev` to start the development server. 🔸 Set 'cwd' to the relative path of the project directory if needed.",
    parameters: {
      type: "object",
      properties: {
        cwd: {
          type: "string",
          description: "Project directory",
          default: process.cwd(),
        },
      },
      required: [],
    },
    function: runDevServer,
  },
  {
    name: "build_project",
    description:
      "Runs `npm run build` to build the production bundle. 🔸 Set 'cwd' to the relative path of the project directory if needed.",
    parameters: {
      type: "object",
      properties: {
        cwd: {
          type: "string",
          description: "Project directory",
          default: process.cwd(),
        },
      },
      required: [],
    },
    function: buildProject,
  },
];
