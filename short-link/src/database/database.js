const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'db.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const defaultData = {
  shortLinks: [],
  nextId: 1
};

const adapter = new JSONFile(dbPath);
const db = new Low(adapter, defaultData);

async function initDatabase() {
  await db.read();
  console.log('Connected to lowdb database');
}

initDatabase();

module.exports = db;
