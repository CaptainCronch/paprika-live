import { LIBRARY_PATH } from "$env/static/private"
import Database from 'better-sqlite3';
import NTP from 'ntp-time';
// const options = {};
export const DB = new Database(LIBRARY_PATH/*, options*/);
DB.pragma('journal_mode = WAL');
DB.pragma('foreign_keys = TRUE');

const TIME = new NTP.Client();

/*
=== MAIN ===

page: search for text to find id to search through revisions to find latest. tracks page deletion and whether it is open for public editing.
    page_id, title, folder_id, is_deleted, is_open

text: contains whole text for one revision. grab this when using revision.
    text_id, text

tag: used to categorize pages and get collections of them.
    tag_id, name

user: marks comment authors, revision writers, media uploaders, and who is allowed to edit a page. (admins can perform various authoritative actions.)
    user_id, name, join_date, is_admin

media: marks uploader and filenames.
    media_id, filename, user_id

folder: used to categorize pages in a hierarchy. folders can contain other folders. it is the main way to organize pages.
    folder_id, name, parent

comment: contains its own text content, a posting date, an optional comment that it replies to, id of which page it is on, and the user that posted it.
    comment_id, text, date, parent, page_id, user_id

revision: tracks edit date, page it belongs to, whole text content, containing folder, and author.
    revision_id, date, page_id, text_id, user_id

stat: contains various library-wide statistics. records snapshots over time.
    stat_id, total_pages, total_revisions, total_users, total_media, total_tags, total_folders, total_comments, total_hits, stat_time


=== JOIN TABLES ===

user_page: denotes what users are allowed to edit each page.
    user_id, page_id

page_tag: denotes what tags are in each page.
    page_id, tag_id

media_revision: denotes what media files are used by each revision.
    media_id, revision_id
*/

function newPage(pageTitle, allowedEditors, folderName, tags, content, isOpen, authorID, mediaIDs) { // TODO: create tag if it doesn't exist
    if (getPageIDByTitle(pageTitle) === undefined) {return {okay: false, reason: "Name Taken", value: pageTitle}}

    let editorIDs = []
    allowedEditors.forEach(editor => {
        let userResult = getUserIDByName(editor)
        if (userResult === undefined) {
            return {okay: false, reason: "Invalid User", value: editor}
        } else {
            editorIDs.push(userResult)
        }
    })

    let tagIDs = []
    tags.forEach(tag => {
        let tagResult = getTagIDByName(tag)
        if (tagResult === undefined) {
            return {okay: false, reason: "Invalid Tag", value: tag} // TODO: create tag if it doesn't exist
        } else {
            tagIDs.push(tagResult)
        }
    })

    let folderID = getFolderIDByName(folderName)
    if (folderID === undefined) {return {okay: false, reason: "Invalid Folder", value: folderName}}

    DB.prepare(`INSERT INTO page (title, folder_id, is_deleted, is_open) VALUES('?', ?, 0, ?);`).run(pageTitle, folderID, isOpen)

    let pageID = getPageIDByTitle(pageTitle)

    userIDs.forEach(userID => {
        DB.prepare(`INSERT INTO user_page (user_id, page_id) VALUES('?', ?)`).run(userID, pageID)
    })

    tagIDs.forEach(tagID => {
        DB.prepare(`INSERT INTO page_tag (page_id, tag_id) VALUES('?', ?)`).run(pageID, tagID)
    })

    let revisionResult = newRevision(pageID, content, authorID, mediaIDs)
    if (!revisionResult.okay) {return revisionResult}
    else {return {okay: true}}
}

function newRevision(pageID, content, authorID, mediaIDs) { // revision_id, date, page_id, text_id, author_id (media_revision)
    if (!validatePage(pageID)) {return {okay: false, reason: "Invalid Page", value: pageID}}

    if (!validateUser(authorID)) {return {okay: false, reason: "Invalid User", value: authorID}}

    mediaIDs.forEach(mediaID => {
        if (!validateMedia(mediaID)) {return {okay: false, reasion: "Invalid Media", value: mediaID}}
    })

    let textID = DB.prepare(`INSERT INTO text (text) VALUES('?')`).run(content).lastInsertRowid

    let date

    TIME.syncTime().then(time => date = time).catch(
        TIME.syncTime().then(time => date = time).catch(

        )
    )

    DB.prepare(`INSERT INTO revision (date, page_id, text_id, user_id)`).run()

    
}

function getPageIDByTitle(pageTitle) { // undefined if page does NOT exist, returns page primary key
    const ID_QUERY = DB.prepare(`SELECT page_id, title FROM page WHERE title = ?;`).get(pageTitle)
    return ID_QUERY.pageID
}

function validatePage(pageID) { // false if page does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM page WHERE page_id = ?);`).get(pageID)
    return result['EXISTS(SELECT 1 FROM page WHERE page_id = ?)'] === 1;
}

function getFolderIDByName(folderName) { // undefined if folder does NOT exist, returns folder primary key
    let result = DB.prepare(`SELECT folder_id, name FROM folder WHERE name = '?';`).get(folderName)
    return result.folder_id
}

function validateFolder(folderID) { // false if folder does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM folder WHERE folder_id = ?);`).get(folderID)
    return result['EXISTS(SELECT 1 FROM folder WHERE folder_id = ?)'] === 1;
}

function getTagIDByName(tagName) { // undefined if tag does NOT exist, returns tag primary key
    let result = DB.prepare(`SELECT tag_id, name FROM tag WHERE name = '?';`).get(tagName)
    return result.tag_id
}

function validateTag(tagID) { // false if tag does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM tag WHERE tag_id = ?);`).get(tagID)
    return result['EXISTS(SELECT 1 FROM tag WHERE tag_id = ?)'] === 1;
}

function getUserIDByName(userName) { // undefined if user does NOT exist, returns user primary key
    let result = DB.prepare(`SELECT user_id, name FROM user WHERE name = '?';`).get(userName)
    return result.user_id
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
            folder_id INTEGER NOT NULL,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            is_open INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (folder_id) REFERENCES folder (folder_id)
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
            user_id TEXT NOT NULL,
            FOREIGN KEY (page_id) REFERENCES page (page_id),
            FOREIGN KEY (text_id) REFERENCES text (text_id),
            FOREIGN KEY (user_id) REFERENCES user (user_id)
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS page_tag (
            page_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            FOREIGN KEY (page_id) REFERENCES page (page_id),
            FOREIGN KEY (tag_id) REFERENCES tag (tag_id)
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