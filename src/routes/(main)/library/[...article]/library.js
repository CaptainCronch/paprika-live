import { LIBRARY_PATH } from "$env/static/private"
import Database from 'better-sqlite3';
// const options = {};
export const DB = new Database(LIBRARY_PATH/*, options*/);
DB.pragma('journal_mode = WAL');
DB.pragma('foreign_keys = TRUE');

/*
=== MAIN ===
page: search for text to find id to search through revisions to find latest. tracks page deletion and whether it is open for public editing.
text: contains whole text for one revision. grab this when using revision.
tag: used to categorize pages and get collections of them.
user: marks comment authors, revision writers, media uploaders, and who is allowed to edit a page. (admins can perform various authoritative actions.)
media: marks uploader and filenames.
folder: used to categorize pages in a hierarchy. folders can contain other folders. it is the main way to organize pages.
comment: contains its own text content, a posting date, an optional comment that it replies to, id of which page it is on, and the user that posted it.
revision: tracks edit date, page it belongs to, whole text content, and containing folder.
stat: contains various library-wide statistics. records snapshots over time.

=== JOIN TABLES ===
tag_revision: denotes what tags are in each revision.
user_revision: denotes what users wrote in each revision.
user_page: denotes what users are allowed to edit each page.
media_revision: denotes what media files are used by each revision.
*/

function newPage(pageTitle, allowedEditors, folderName, tags, content, isOpen, authorID, checked) {
    if (!validateTitle(pageTitle)) {return {okay: false, reason: "Invalid Name", value: pageTitle}}

    for (let editor in allowedEditors) {
        if (!getUserByName(editor)) {return {okay: false, reason: "Invalid User", value: editor}}
    }

    let result = validateRevisionRequirements(pageID, folderName, tags, authorID)
    if (!result.okay) {return result}

    DB.prepare(`INSERT INTO page (title, is_deleted, is_open) VALUES('?', 0, ?);`).run(pageTitle, isOpen);

    const ID_QUERY = DB.prepare(`SELECT page_id, title FROM page WHERE title = ?;`)
    newRevision(pageID, folderName, tags, content, isOpen, authorID, checked)
}

function newRevision(pageID, folderName, tags, content, isOpen, authorID, checked) {
    if (!checked) {
        validateRevisionRequirements(pageID, folderName, tags, authorID)
    }
}

function validateRevisionRequirements(pageID, folderName, tags, authorID) {
    if (!validatePage(pageID)) {return {okay: false, reason: "Invalid Page", value: pageID}}

    if (!validateFolder(folderName)) {return {okay: false, reason: "Invalid Folder", value: folderName}}

    for (let tag in tags) {
        if (!validateTag(tag)) {return {okay: false, reason: "Invalid Tag", value: tag}}
    }

    if (!validateUser(authorID)) {return {okay: false, reason: "Invalid User", value: authorID}}

    return {okay: true}
}

function validateTitle(pageTitle) { // false if page with title ALREADY exists (not valid!)
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM page WHERE title = ?);`).get(pageTitle)
    return result['EXISTS(SELECT 1 FROM page WHERE title = ?)'] === 0;
}

function getUserByName(userName) { // false if user does NOT exist, returns ID if user exists
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM user WHERE name = ?);`).get(userName)
    if (result['EXISTS(SELECT 1 FROM user WHERE name = ?)'] === 1) {
        let result = DB.prepare(`SELECT user_id, name FROM user WHERE name = ?;`).get(userName)
        return result.user_id
    } else {
        return false
    }
}

function validatePage(pageID) { // false if page does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM page WHERE page_id = ?);`).get(pageID)
    return result['EXISTS(SELECT 1 FROM page WHERE page_id = ?)'] === 1;
}

function validateFolder(folderName) { // false if folder does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM folder WHERE name = ?);`).get(folderName)
    return result['EXISTS(SELECT 1 FROM folder WHERE name = ?)'] === 1;
}

function validateTag(tagName) { // false if tag does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM tag WHERE name = ?);`).get(tagName)
    return result['EXISTS(SELECT 1 FROM tag WHERE name = ?)'] === 1;
}

function validateUser(userID) { // false if user does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM user WHERE user_id = ?);`).get(userID)
    return result['EXISTS(SELECT 1 FROM user WHERE user_id = ?)'] === 1;
}

const SETUP_TABLES = [
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS page (
            page_id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL UNIQUE,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            is_open INTEGER NOT NULL DEFAULT 0
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS text (
            text_id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS tag (
            tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS user (
            user_id TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL UNIQUE,
            join_date TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS media (
            media_id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL UNIQUE,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user (user_id)
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS folder (
            folder_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent INTEGER,
            FOREIGN KEY (parent) REFERENCES folder (folder_id)
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS comment (
            comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            date TEXT NOT NULL,
            parent INTEGER,
            page_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (parent) REFERENCES comment (comment_id),
            FOREIGN KEY (page_id) REFERENCES page (page_id),
            FOREIGN KEY (user_id) REFERENCES user (user_id)
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS revision (
            revision_id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            page_id INTEGER NOT NULL,
            text_id INTEGER NOT NULL,
            folder_id INTEGER NOT NULL,
            FOREIGN KEY (page_id) REFERENCES page (page_id),
            FOREIGN KEY (text_id) REFERENCES text (text_id),
            FOREIGN KEY (folder_id) REFERENCES page (folder_id)
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS tag_revision (
            tag_id INTEGER NOT NULL,
            revision_id INTEGER NOT NULL,
            FOREIGN KEY (tag_id) REFERENCES tag (tag_id),
            FOREIGN KEY (revision_id) REFERENCES revision (revision_id)
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_revision (
            user_id INTEGER NOT NULL,
            revision_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user (user_id),
            FOREIGN KEY (revision_id) REFERENCES revision (revision_id)
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_page (
            user_id INTEGER NOT NULL,
            page_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user (user_id),
            FOREIGN KEY (page_id) REFERENCES page (page_id)
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS media_revision (
            media_id INTEGER NOT NULL,
            revision_id INTEGER NOT NULL,
            FOREIGN KEY (media_id) REFERENCES media (media_id),
            FOREIGN KEY (revision_id) REFERENCES revision (revision_id)
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS stat (
            stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
            total_pages INTEGER NOT NULL,
            total_revisions INTEGER NOT NULL,
            total_users INTEGER NOT NULL,
            total_media INTEGER NOT NULL,
            total_tags INTEGER NOT NULL,
            total_folders INTEGER NOT NULL,
            total_comments INTEGER NOT NULL,
            total_hits INTEGER NOT NULL,
            stat_time TEXT NOT NULL
        );
    `)
];

SETUP_TABLES.forEach((stmt) => {
    stmt.run()
})

// DB.prepare(`INSERT INTO user VALUES('1234', 'jonas', 'now', 0)`).run()
// let result = DB.prepare(`SELECT user_id, name FROM user WHERE name = ?;`).get("jonas")
// console.log(result)