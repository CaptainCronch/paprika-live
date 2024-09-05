import { LIBRARY_PATH } from "$env/static/private"
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import argon2 from "argon2";
// const options = {};
export const DB = new Database(LIBRARY_PATH/*, options*/);
DB.pragma('journal_mode = WAL');
DB.pragma('foreign_keys = TRUE');

const PASSWORD_REGEX = /^[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~\`!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/]+$/
const PASSWORD_MIN_LENGTH = 6

const SECRET_CHARACTERS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz" // base52
const SECRET_LENGTH = 12

/*
=== MAIN ===

page: search for text to find id to search through revisions to find latest. tracks page deletion and whether it is open for public editing.
    page_id, title, date, user_id, folder_id, is_deleted, is_open, is_private, secret_code

text: contains whole text for one revision. grab this when using revision.
    text_id, text

tag: used to categorize pages and get collections of them.
    tag_id, name

user: marks comment authors, revision writers, media uploaders, and who is allowed to edit a page. (admins can perform various authoritative actions.)
    user_id (uuidv4), name, password, session_id, session_expiration, join_date, is_admin, is_suspended

media: marks uploader and filenames.
    media_id, filename, user_id

folder: used to categorize pages in a hierarchy. folders can contain other folders. it is the main way to organize pages.
    folder_id, name, parent

comment: contains its own text content, a posting date, an optional comment that it replies to, id of which page it is on, and the user that posted it.
    comment_id, text, date, parent, page_id, user_id, is_deleted

revision: tracks edit date, page it belongs to, whole text content, containing folder, and author.
    revision_id, date, page_id, text_id, user_id

stat: contains various library-wide statistics. records snapshots over time.
    stat_id, total_pages, total_revisions, total_users, total_media, total_tags, total_folders, total_comments, total_hits, stat_time


=== JOIN TABLES ===

editor_page: denotes what users are allowed to edit each page.
    user_id, page_id

viewer_page: denotes what users are allowed to view each page.
    user_id, page_id

page_tag: denotes what tags are in each page.
    page_id, tag_id

media_revision: denotes what media files are used by each revision.
    media_id, revision_id
*/

// TODO: Stat tracking on post/delete functions
// TODO: Do all POST functions with IDs or all with names... (I just don't know how exactly they'll be used right noww)

/*
=== POST FUNCTIONS ===
*/

function postPage(pageTitle, allowedEditors, allowedViewers, folderName, tags, content, isOpen, isPrivate, authorID, mediaIDs) {
    if (getPageIDByTitle(pageTitle) === undefined) {return ReturnResult(false, 403, "Name taken", pageTitle)}

    let editorIDs = []
    allowedEditors.forEach(editor => {
        let userResult = getUserIDByName(editor)
        if (userResult === undefined) {
            return ReturnResult(false, 404, "Editor does not exist", editor)
        } else {
            editorIDs.push(userResult)
        }
    })

    let viewerIDs = []
    allowedViewers.forEach(viewer => {
        let userResult = getUserIDByName(viewer)
        if (userResult === undefined) {
            return ReturnResult(false, 404, "Viewer does not exist", viewer)
        } else {
            viewerIDs.push(userResult)
        }
    })

    let tagIDs = []
    tags.forEach(tag => { // creates new tag if input is invalid
        let tagResult = getTagIDByName(tag)
        if (tagResult === undefined) {
            tagIDs.push(DB.prepare(`INSERT INTO tag (name) VALUES('?');`).run(tag).lastInsertRowid)
        } else {
            tagIDs.push(tagResult)
        }
    })

    let folderID = getFolderIDByName(folderName)
    if (folderID === undefined) {return ReturnResult(false, 404, "Folder does not exist", folderName)}

    let pageID =  DB.prepare(`INSERT INTO page (title, date, folder_id, is_deleted, is_open, is_private, secret_code) VALUES('?', '?', ?, 0, ?, ?);`)
            .run(pageTitle, getUniversalTime(), folderID, isOpen, isPrivate, generateBase58String()).lastInsertRowid

    editorIDs.forEach(editorID => {
        DB.prepare(`INSERT INTO editor_page (user_id, page_id) VALUES('?', ?);`).run(editorID, pageID)
    })

    viewerIDs.forEach(viewerID => {
        DB.prepare(`INSERT INTO viewer_page (user_id, page_id) VALUES('?', ?);`).run(viewerID, pageID)
    })

    tagIDs.forEach(tagID => {
        DB.prepare(`INSERT INTO page_tag (page_id, tag_id) VALUES('?', ?);`).run(pageID, tagID)
    })

    let revisionResult = postRevision(pageID, content, authorID, mediaIDs)
    if (!revisionResult.okay) {return revisionResult}
    else {return ReturnResult(true, 201, "Page created", pageID)}
}

function postRevision(pageID, content, authorID, mediaIDs) { // TODO: validate text content
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}

    if (!validateUser(authorID)) {return ReturnResult(false, 404, "Author does not exist", authorID)}

    mediaIDs.forEach(mediaID => {
        if (!validateMedia(mediaID)) {return ReturnResult(false, 404, "Media does not exist", mediaID)}
    })

    let textID = DB.prepare(`INSERT INTO text (text) VALUES('?');`).run(content).lastInsertRowid

    let revisionID = DB.prepare(`INSERT INTO revision (date, page_id, text_id, user_id) VALUES('?', ?, ?, '?');`).run(getUniversalTime(), pageID, textID, authorID).lastInsertRowid

    mediaIDs.forEach(mediaID => {
        DB.prepare(`INSERT INTO media_revision (media_id, revision_id) VALUES(?, ?);`).run(mediaID, revisionID)
    })

    return ReturnResult(true, 201, "Revision created", revisionID)
}

function postTag(tagName) {
    if (getTagIDByName(tagName) !== undefined) {return ReturnResult(false, 403, "Tag already exists", tagName)}
    let tagID = DB.prepare(`INSERT INTO tag (name) VALUES('?');`).run(tagName).lastInsertRowid

    return ReturnResult(true, 201, "Tag created", tagID)
}

function postFolder(folderName, parentFolder = null) {
    if (parentFolder !== null && !validateFolder(parentFolder)) {return ReturnResult(false, 404, "Parent folder does not exist", parentFolder)}
    if (validateFolderName(folderName, parentFolder) !== undefined) {return ReturnResult(false, 403, "Folder already exists", folderName)}
    let folderID = DB.prepare(`INSERT INTO tag (name) VALUES('?', ?);`).run(folderName, parentFolder).lastInsertRowid

    return ReturnResult(true, 201, "Folder created", folderID)
}

function postComment(content, parentCommentID = null, pageID, authorID) {
    if (parentCommentID !== null && !validateComment(parentCommentID)) {return ReturnResult(false, 404, "Parent comment does not exist", parentCommentID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validateUser(authorID)) {return ReturnResult(false, 404, "User does not exist", authorID)}
    if (!validateWholeComment(content, parentCommentID, pageID, authorID)) {return ReturnResult(false, 403, "Comment already exists", "Same words, same parent comment, same page, same author.")}

    let commentID = DB.prepare(`INSERT INTO comment (text, date, parent, page_id, user_id, is_deleted) VALUES('?', '?', ?, ?, '?', 0);`)
            .run(content, getUniversalTime(), parentCommentID, pageID, authorID).lastInsertRowid

    return ReturnResult(true, 201, "Comment created", commentID)
}

function postUser(name, password) { // how is this supposed to return a code if it depends on a promise...
    if (getUserIDByName(name) !== undefined) {return ReturnResult(false, 403, "Name taken", name)}
    if (password.length < PASSWORD_MIN_LENGTH) {return ReturnResult(false, 403, "Password not long enough", password.length)}
    if (password.match(PASSWORD_REGEX) === null) {return ReturnResult(false, 403, "Invalid password character(s)", `Valid characters are ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~\`!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/`)}

    argon2.hash(password)
    .then(function() {
        let userID = DB.prepare(`INSERT INTO user (user_id, name, password, join_date, is_admin, is_suspended) VALUES('?', '?', '?', '?', 0, 0);`)
            .run(uuidv4(), name, hash, getUniversalTime()).lastInsertRowid
        return ReturnResult(true, 201, "User created", userID)
    })
    .catch(function(err) {return ReturnResult(false, 500, "Pasword hashing failed", err)})
}

/*
=== GET FUNCTIONS ===
*/

/*
=== PUT FUNCTIONS ===
*/

/*
=== DELETE FUNCTIONS ===
*/

/*
=== HELPER FUNCTIONS ===
*/

function getUniversalTime() { // returns YYYY-MM-DDTHH:MM:SS.sssZ, "N/A" if both time APIs fail
    let time

    fetch("https://timeapi.io/api/time/current/zone?timeZone=UTC")
    .then(response => {
        if (response.ok){
            return response.json()
        }
        return Promise.reject(response)
    })
    .then(body => time = body.dateTime.slice(0, -4) + "Z") // timeapi.io's response has one more milisecond character than worldtimeapi.org's
    .catch(function() {
        fetch("http://worldtimeapi.org/api/timezone/UTC")
        .then(response => {
            if (response.ok){
                return response.json()
            }
            return Promise.reject(response)
        })
        .then(body => time = body.datetime.slice(0, -9) + "Z") // worldtimeapi.org's response has the redundant UTC offset included (+00:00)
        .catch(function() {time = "N/A"})
    })
    return time
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

function validateFolderName(folderName, parentID) { // false if folder name does NOT exist with same parent
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM folder WHERE name = '?' AND parent = ?);`).get(folderID)
    return result[`EXISTS(SELECT 1 FROM folder WHERE folder_id = ?)`] === 1;
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
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM user WHERE user_id = '?');`).get(userID)
    return result[`EXISTS(SELECT 1 FROM user WHERE user_id = '?')`] === 1;
}

function validateWholeComment(content, parentCommentID, pageID, authorID) { // false if comment exists with same content, parent, page, and author
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM comment WHERE text = '?' AND parent = ? AND page_id = ? AND user_id = '?');`)
            .get(content, parentCommentID, pageID, authorID)
    return result[`EXISTS(SELECT 1 FROM comment WHERE text = '?' AND parent = ? AND page_id = ? AND user_id = '?')`] === 0;
}

function validateComment(commentID) { // false if comment does not exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM comment WHERE comment_id = ?);`).get(commentID)
    return result[`EXISTS(SELECT 1 FROM comment WHERE comment_id = ?)`] === 0;
}

function generateBase58String(size = SECRET_LENGTH) {
    if (size <= 0) {return ""}
    let output = []
    
    for (let i = 0; i < size; i++) {
        output.push(SECRET_CHARACTERS.charAt(Math.floor(Math.random() * SECRET_CHARACTERS.length)))
    }

    return output.join('')
}

const SETUP_TABLES = [
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS page (
            page_id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL UNIQUE,
            date TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            folder_id INTEGER NOT NULL,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            is_open INTEGER NOT NULL DEFAULT 0,
            is_private INTEGER NOT NULL DEFAULT 0,
            secret_code TEXT NOT NULL,
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
            password TEXT NOT NULL,
            session_id TEXT NOT NULL,
            session_expiration TEXT NOT NULL,
            join_date TEXT NOT NULL,
            is_admin INTEGER NOT NULL DEFAULT 0,
            is_suspended INTEGER NOT NULL DEFAULT 0
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS media (
            media_id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL UNIQUE,
            user_id TEXT,
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
            user_id TEXT,
            is_deleted INTEGER NOT NULL DEFAULT 0,
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
            user_id TEXT,
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
        CREATE TABLE IF NOT EXISTS editor_page (
            user_id TEXT,
            page_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES user (user_id),
            FOREIGN KEY (page_id) REFERENCES page (page_id)
        );
    `),
    DB.prepare(`
        CREATE TABLE IF NOT EXISTS viewer_page (
            user_id TEXT,
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

class ReturnResult {
    constructor(okay, code, reason, value) {
        this.okay = okay
        this.code = code
        this.reason = reason
        this.value = value
    }
}

// DB.prepare(`INSERT INTO user VALUES('1234', 'jonas', 'now', 0);`).run()
// let result = DB.prepare(`SELECT user_id, name FROM user WHERE name = ?;`).get("jonas")
// console.log(result)

//validateFolder(1, 0)
