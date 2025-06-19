const fs = require('fs').promises;
const path = require('path');

const readFileTool = {
  name: "read_file",
  description: "Reads the contents of a file. Use this to load source code, configs, or other file content. Do not use for binary files. Returns the file's contents as a string.",
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
  description: "Lists all files and folders in a directory. Use this to explore the project structure or find filenames to read.",
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
  description: 'Edits a file. By default, replaces the contents of a file with new content. You can also append by setting append = true.',
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

module.exports = [readFileTool, listFilesTool, editFileTool];
