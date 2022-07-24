const express = require('express');

const app = express();
const port = 3001;
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(cors());

const db = new sqlite3.Database('data.db', (err) => {
  if (err) {
    throw err;
  }

  // create tables if they don't exist
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, 
      created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  });
});

app.get('/notes', (req, res) => {
  db.all('SELECT * FROM notes', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'An error occurred, please try again later' });
    }

    return res.json({ success: true, data: rows });
  });
});

app.get('/notes/:id', (req, res) => {
  db.get('SELECT * FROM notes WHERE id = ?', req.params.id, (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'An error occurred, please try again later' });
    }

    if (!row) {
      return res.status(404).json({ success: false, message: 'Note does not exist' });
    }

    return res.json({ success: true, data: row });
  });
});

app.post('/notes', (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'title and content are required' });
  }

  db.run('INSERT INTO notes (title, content) VALUES (?, ?)', [title, content], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'An error occurred, please try again later' });
    }

    return res.json({
      success: true,
      data: {
        id: this.lastID,
        title,
        content,
      },
    });
  });
});

app.delete('/notes/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM notes WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'An error occurred, please try again later' });
    }

    if (!row) {
      return res.status(404).json({ success: false, message: 'Note does not exist' });
    }

    db.run('DELETE FROM notes WHERE id = ?', [id], (error) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'An error occurred, please try again later' });
      }

      return res.json({ success: true, message: 'Note deleted successfully' });
    });
  });
});

app.listen(port, () => {
  console.log(`Notes app listening on port ${port}`);
});
