// tools/fileTools.js
import fs from 'fs/promises';

export async function read_file(path) {
    console.log("🔨 Tool Called: read_file", path);
    try {
        const data = await fs.readFile(path, 'utf-8');
        return data;
    } catch (err) {
        return `❌ Error reading file: ${err.message}`;
    }
}

export async function write_file({ path, content }) {
    console.log("🔨 Tool Called: write_file", path);
    try {
        await fs.writeFile(path, content);
        return `✅ File written at ${path}`;
    } catch (err) {
        return `❌ Error writing file: ${err.message}`;
    }
}

export async function append_file({ path, content }) {
    console.log("🔨 Tool Called: append_file", path);
    try {
        await fs.appendFile(path, content);
        return `✅ Appended to ${path}`;
    } catch (err) {
        return `❌ Error appending file: ${err.message}`;
    }
}
