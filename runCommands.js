const { exec } = require('child_process');
const path = require('path');

const fs = require('fs').promises;
// const path = require('path');

const readFileTool = {
  name: "read_file",
  description: "Reads the contents of a file. Use this to load source code, configs, or other file content. Do not use for binary files. 🔸 Use a relative path (e.g., 'src/App.tsx'), not an absolute path. Returns the file's contents as a string.",
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
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (err) {
      return `Error reading file: ${err.message}`;
    }
  }
};

const listFilesTool = {
  name: "list_files",
  description: "Lists all files and folders in a directory. Use this to explore the project structure or find filenames to read.🔸 Use a relative path (e.g., 'src/App.tsx'), not an absolute path.",
  parameters: {
    type: "object",
    properties: {
      dirpath: {
        type: "string",
        description: "Path to the directory (relative to the root). Use '.' for current directory.",
      },
    },
    required: ["dirpath"],
  },
  function: async (input) => {
    try {
      const { dirpath } = input;
      const fullPath = path.resolve(dirpath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const formatted = entries.map(entry => {
        return entry.isDirectory() ? `[DIR] ${entry.name}` : `      ${entry.name}`;
      });
      return formatted.join('\n');
    } catch (err) {
      return `Error listing files: ${err.message}`;
    }
  }
};

const editFileTool = {
  name: 'edit_file',
  description: 'Edits a file. By default, replaces the contents of a file with new content. You can also append by setting append = true. 🔸 Use a relative path (e.g., src/App.tsx), not an absolute path.',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'The file path to edit' },
      new_content: { type: 'string', description: 'The full new content to write or append to the file' },
      append: {
        type: 'boolean',
        description: 'Set to true to append instead of overwriting (default: false)',
        default: false,
      }
    },
    required: ['path', 'new_content'],
  },
  function: async ({ path: filePath, new_content, append = false }) => {
    const absPath = path.resolve(process.cwd(), filePath);
    try {
      if (append) {
        await fs.appendFile(absPath, new_content, 'utf8');
        return `Appended content to '${filePath}'.`;
      } else {
        await fs.writeFile(absPath, new_content, 'utf8');
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

const createViteProject = ({ name, template = "react-ts", cwd = process.cwd() }) => {
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
  readFileTool, listFilesTool, editFileTool,
   {
  name: "create_vite_project",
  description: "Creates a new Vite project with an optional template (e.g., react-ts). 🔸 The project folder will be created relative to the provided 'cwd' or the current working directory.",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "The name of the project (used as the folder name and CLI argument)"
      },
      template: {
        type: "string",
        description: "The Vite template to use (e.g., react-ts, vue, svelte-ts). Defaults to react-ts.",
        default: "react-ts"
      },
      cwd: {
        type: "string",
        description: "The base directory where the project folder should be created. Defaults to current working directory.",
        default: process.cwd()
      }
    },
    required: ["name"]
  },
  function: createViteProject
},


  {
    name: "install_dependencies",
    description: "Runs `npm install` to install project dependencies. 🔸 Set 'cwd' to the relative path of the project directory if needed.",
    parameters: {
      type: "object",
      properties: {
        cwd: { type: "string", description: "Project directory", default: process.cwd() }
      },
      required: []
    },
    function: installDeps
  },
  {
    name: "run_dev_server",
    description: "Runs `npm run dev` to start the development server. 🔸 Set 'cwd' to the relative path of the project directory if needed.",
    parameters: {
      type: "object",
      properties: {
        cwd: { type: "string", description: "Project directory", default: process.cwd() }
      },
      required: []
    },
    function: runDevServer
  },
  {
    name: "build_project",
    description: "Runs `npm run build` to build the production bundle. 🔸 Set 'cwd' to the relative path of the project directory if needed.",
    parameters: {
      type: "object",
      properties: {
        cwd: { type: "string", description: "Project directory", default: process.cwd() }
      },
      required: []
    },
    function: buildProject
  }
];
