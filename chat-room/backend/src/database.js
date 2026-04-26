const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'chat.db');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('Database loaded from file:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('New database created in memory');
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'group',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS room_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS read_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(message_id, user_id)
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id, created_at DESC)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC)
  `);

  saveDatabase();
  
  return db;
}

function saveDatabase() {
  if (db) {
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }
}

function normalizeArgs(sql, paramsOrCallback, callback) {
  let params = [];
  let cb = null;
  
  if (typeof paramsOrCallback === 'function') {
    cb = paramsOrCallback;
    params = [];
  } else if (Array.isArray(paramsOrCallback)) {
    params = paramsOrCallback;
    cb = callback;
  } else if (paramsOrCallback !== undefined) {
    params = [paramsOrCallback];
    cb = callback;
  }
  
  return { params, callback: cb };
}

function run(sql, paramsOrCallback, callback) {
  const { params, callback: cb } = normalizeArgs(sql, paramsOrCallback, callback);
  
  try {
    const result = db.run(sql, params);
    saveDatabase();
    
    const lastIdResult = db.exec("SELECT last_insert_rowid() as id");
    const lastId = lastIdResult[0]?.values[0]?.[0];
    const changes = result.getRowsModified();
    
    if (cb) {
      cb.call({ lastID: lastId, changes: changes }, null);
    }
    
    return { lastID: lastId, changes: changes };
  } catch (error) {
    console.error('SQL Error in run:', error.message, 'SQL:', sql, 'Params:', params);
    if (cb) {
      cb(error);
    }
    throw error;
  }
}

function get(sql, paramsOrCallback, callback) {
  const { params, callback: cb } = normalizeArgs(sql, paramsOrCallback, callback);
  
  try {
    const stmt = db.prepare(sql);
    
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    
    if (cb) {
      cb(null, result);
    }
    return result;
  } catch (error) {
    console.error('SQL Error in get:', error.message, 'SQL:', sql, 'Params:', params);
    if (cb) {
      cb(error);
    }
    throw error;
  }
}

function all(sql, paramsOrCallback, callback) {
  const { params, callback: cb } = normalizeArgs(sql, paramsOrCallback, callback);
  
  try {
    const results = [];
    const stmt = db.prepare(sql);
    
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (cb) {
      cb(null, results);
    }
    return results;
  } catch (error) {
    console.error('SQL Error in all:', error.message, 'SQL:', sql, 'Params:', params);
    if (cb) {
      cb(error);
    }
    throw error;
  }
}

function serialize(callback) {
  if (callback) {
    callback();
  }
}

const dbAdapter = {
  init: initDatabase,
  run,
  get,
  all,
  serialize
};

module.exports = dbAdapter;
