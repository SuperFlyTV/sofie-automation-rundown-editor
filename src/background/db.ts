import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('data.db')

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            id string PRIMARY KEY,
            document JSON NOT NULL
        );
    `)

    db.run(`
        CREATE TABLE IF NOT EXISTS playlists (
            id string PRIMARY KEY,
            document JSON NOT NULL
        );
    `)
    
    db.run(`
        CREATE TABLE IF NOT EXISTS rundowns (
            id TEXT PRIMARY KEY,
            playlistId TEXT,
            document TEXT NOT NULL,
            FOREIGN KEY (playlistId) REFERENCES playlists(id)
        );
    `)
    
    db.run(`
        CREATE TABLE IF NOT EXISTS segments (
            id TEXT PRIMARY KEY,
  			playlistId TEXT,
            rundownId TEXT NOT NULL,
            document TEXT NOT NULL,
            FOREIGN KEY (playlistId) REFERENCES playlists(id),
            FOREIGN KEY (rundownId) REFERENCES rundowns(id)
        );
    `)
    
    db.run(`
        CREATE TABLE IF NOT EXISTS parts (
            id TEXT PRIMARY KEY,
  			playlistId TEXT,
            rundownId TEXT NOT NULL,
            segmentId TEXT NOT NULL,
            document TEXT NOT NULL,
            FOREIGN KEY (playlistId) REFERENCES playlists(id),
            FOREIGN KEY (rundownId) REFERENCES rundowns(id),
            FOREIGN KEY (segmentId) REFERENCES segments(id)
        );
    `)

    db.run(`
        CREATE TABLE IF NOT EXISTS pieces (
            id TEXT PRIMARY KEY,
  			playlistId TEXT,
            segmentId TEXT NOT NULL,
            rundownId TEXT NOT NULL,
            partId TEXT NOT NULL,
            document TEXT NOT NULL,
            FOREIGN KEY (playlistId) REFERENCES playlists(id),
            FOREIGN KEY (rundownId) REFERENCES rundowns(id),
            FOREIGN KEY (segmentId) REFERENCES segments(id)
            FOREIGN KEY (partId) REFERENCES parts(id)
        );
    `)
})

export { db }
