import { LIBRARY_PATH, SECRET_PASSWORD } from "$env/static/private"
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import argon2 from "argon2";
// const options = {};
export const DB = new Database(LIBRARY_PATH/*, options*/);
DB.pragma('journal_mode = WAL');
DB.pragma('foreign_keys = TRUE');

const USERNAME_REGEX = /^[\w-]+$/
const USERNAME_MAX_LENGTH = 24
const PASSWORD_REGEX = /^[\w~\`!@#$%^&*()\-+={[}\]|\\:;"'<,>.?/]+$/
const PASSWORD_MIN_LENGTH = 6

const SECRET_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789" // base52
const SECRET_LENGTH = 12
const SESSION_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_" // base64
const SESSION_LENGTH = 128

// TODO: Return more explanatory 403 error messages

/*
=== MAIN ===

page: search for text to find id to search through revisions to find latest. tracks page deletion and whether it is open for public editing.
    page_id, title, date, user_id, folder_id, is_deleted, is_open, is_private, secret_code

text: contains whole text for one revision. grab this when using revision.
    text_id, text

tag: used to categorize pages and get collections of them.
    tag_id, name

user: marks comment authors, revision writers, media uploaders, and who is allowed to edit a page. (admins can perform various authoritative actions.)
    user_id (uuidv4), name, password, session_id, session_expiration, join_date, is_admin, is_trusted, is_deleted, is_owner

media: marks uploader and filenames.
    media_id, filename, user_id

folder: used to categorize pages in a hierarchy. folders can contain other folders. it is the main way to organize pages.
    folder_id, name, parent, user_id, is_open

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

//#region POST FUNCTIONS

// TODO: Stat tracking on post/delete functions
// TODO: Input IDs instead of names

async function postPage(sessionID, pageTitle, allowedEditors, allowedViewers, folderID, tags, content, isOpen, isPrivate, authorID, mediaIDs) {
    if (!await validateSession(sessionID)) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (getPageIDByTitle(pageTitle) === undefined) {return ReturnResult(false, 400, "Name taken", pageTitle)}

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
    tags.forEach(tag => { // creates new tag if name is invalid
        let tagResult = getTagIDByName(tag)
        if (tagResult === undefined) {
            tagIDs.push(DB.prepare(`INSERT INTO tag (name) VALUES(?);`).run(tag).lastInsertRowid)
        } else {
            tagIDs.push(tagResult)
        }
    })

    let dateTime = await getUniversalTime()
    let pageID =  DB.prepare(`INSERT INTO page (title, date, folder_id, is_deleted, is_open, is_private, secret_code) VALUES(?, ?, ?, 0, ?, ?);`)
            .run(pageTitle, dateTime, folderID, isOpen, isPrivate, generateRandomString(SECRET_CHARACTERS, SECRET_LENGTH)).lastInsertRowid

    editorIDs.forEach(editorID => {
        DB.prepare(`INSERT INTO editor_page (user_id, page_id) VALUES(?, ?);`).run(editorID, pageID)
    })

    viewerIDs.forEach(viewerID => {
        DB.prepare(`INSERT INTO viewer_page (user_id, page_id) VALUES(?, ?);`).run(viewerID, pageID)
    })

    tagIDs.forEach(tagID => {
        DB.prepare(`INSERT INTO page_tag (page_id, tag_id) VALUES(?, ?);`).run(pageID, tagID)
    })

    let revisionResult = postRevision(pageID, content, authorID, mediaIDs)
    if (!revisionResult.okay) {return revisionResult}
    else {return ReturnResult(true, 201, "Page created", pageID)}
}

async function postRevision(sessionID, pageID, content, authorID, mediaIDs) { // TODO: validate text content
    if (!await validateSession(sessionID)) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}

    if (!validateUser(authorID)) {return ReturnResult(false, 404, "Author does not exist", authorID)}

    mediaIDs.forEach(mediaID => {
        if (!validateMedia(mediaID)) {return ReturnResult(false, 404, "Media does not exist", mediaID)}
    })

    let textID = DB.prepare(`INSERT INTO text (text) VALUES(?);`).run(content).lastInsertRowid

    let dateTime = await getUniversalTime()
    let revisionID = DB.prepare(`INSERT INTO revision (date, page_id, text_id, user_id) VALUES(?, ?, ?, ?);`).run(dateTime, pageID, textID, authorID).lastInsertRowid

    mediaIDs.forEach(mediaID => {
        DB.prepare(`INSERT INTO media_revision (media_id, revision_id) VALUES(?, ?);`).run(mediaID, revisionID)
    })

    return ReturnResult(true, 201, "Revision created", revisionID)
}

async function postTag(sessionID, tagName) {
    if (!await validateSession(sessionID)) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (getTagIDByName(tagName) !== undefined) {return ReturnResult(false, 400, "Tag already exists", tagName)}
    let tagID = DB.prepare(`INSERT INTO tag (name) VALUES(?);`).run(tagName).lastInsertRowid

    return ReturnResult(true, 201, "Tag created", tagID)
}

async function postFolder(sessionID, folderName, parentFolder) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (parentFolder !== null && !validateFolder(parentFolder)) {return ReturnResult(false, 404, "Parent folder does not exist", parentFolder)}
    if (parentFolder !== null && !validateFolderEditAuthorization(parentFolder, USER_ID, false)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}
    if (validateFolderName(folderName, parentFolder) !== undefined) {return ReturnResult(false, 400, "Folder already exists", folderName)}
    let folderID = DB.prepare(`INSERT INTO tag (name) VALUES(?, ?);`).run(folderName, parentFolder).lastInsertRowid

    return ReturnResult(true, 201, "Folder created", folderID)
}

async function postComment(sessionID, content, parentCommentID = null, pageID, authorID) {
    if (!await validateSession(sessionID)) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (parentCommentID !== null && !validateComment(parentCommentID)) {return ReturnResult(false, 404, "Parent comment does not exist", parentCommentID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validateUser(authorID)) {return ReturnResult(false, 404, "User does not exist", authorID)}
    if (!validateWholeComment(content, parentCommentID, pageID, authorID)) {return ReturnResult(false, 400, "Comment already exists", "Same words, same parent comment, same page, same author.")}

    let commentID = DB.prepare(`INSERT INTO comment (text, date, parent, page_id, user_id, is_deleted) VALUES(?, ?, ?, ?, ?, 0);`)
            .run(content, getUniversalTime(), parentCommentID, pageID, authorID).lastInsertRowid

    return ReturnResult(true, 201, "Comment created", commentID)
}

async function postUser(name, password) {
    if (getUserIDByName(name) !== undefined) {return ReturnResult(false, 400, "Name taken", name)}
    if (name.length > USERNAME_MAX_LENGTH) {return ReturnResult(false, 400, "Username too long", name.length)}
    if (name.match(USERNAME_REGEX === null)) {return ReturnResult(false, 400, "Invalid username character(s)", "Valid characters are alphanumeric and -_")}
    if (password.length < PASSWORD_MIN_LENGTH) {return ReturnResult(false, 400, "Password not long enough", password.length)}
    if (password.match(PASSWORD_REGEX) === null) {return ReturnResult(false, 400, "Invalid password character(s)", `Valid characters are alphanumeric and ~\`!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/`)}

    try {
        let hash = await argon2.hash(password)
        let userID = DB.prepare(`INSERT INTO user (user_id, name, password, join_date, is_admin, is_deleted) VALUES(?, ?, ?, ?, 0, 0);`)
            .run(uuidv4(), name, hash, getUniversalTime()).lastInsertRowid
        return ReturnResult(true, 201, "User created", userID)
    } catch (err) {
        return ReturnResult(false, 500, "Pasword hashing failed", err.toString())
    }
}
//#endregion

//#region GET FUNCTIONS

//#endregion

//#region PUT FUNCTIONS

//#region == put page ==
async function putPageTitle(sessionID, pageID, newTitle) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (getPageIDByTitle(newTitle) === undefined) {return ReturnResult(false, 400, "Name taken", newTitle)}
    if (!validatePageEditAuthorization(pageID, USER_ID, false)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    DB.prepare(`UPDATE page SET title = ? WHERE page_id = ?;`).run(newTitle, pageID)
    return ReturnResult(true, 200, "Page title changed", newTitle)
}

async function putPageEditors(sessionID, pageID, newEditorIDs) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    newEditorIDs.forEach(editor => {
        if (!validateUser(editor)) {
            return ReturnResult(false, 404, "Editor does not exist", editor)
        }
    })

    DB.prepare(`DELETE FROM editor_page WHERE page_id = ?`).run(pageID)

    const INSERT_EDITOR = DB.prepare(`INSERT INTO editor_page (user_id, page_id) VALUES(?, ?);`)
    newEditorIDs.forEach(editorID => {
        INSERT_EDITOR.run(editorID, pageID)
    })

    return ReturnResult(true, 200, "Page editors changed", newEditorIDs.join(" / "))
}

async function putPageViewers(sessionID, pageID, newViewerIDs) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, false)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    newViewerIDs.forEach(viewer => {
        if (!validateUser(viewer)) {
            return ReturnResult(false, 404, "Viewer does not exist", viewer)
        }
    })

    DB.prepare(`DELETE FROM viewer_page WHERE page_id = ?`).run(pageID)

    const INSERT_VIEWER = DB.prepare(`INSERT INTO viewer_page (user_id, page_id) VALUES(?, ?);`)
    newViewerIDs.forEach(viewerID => {
        INSERT_VIEWER.run(viewerID, pageID)
    })

    return ReturnResult(true, 200, "Page viewers changed", newViewerIDs.join(" / "))
}

async function putPageTags(sessionID, pageID, tagNames) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, false)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    let tagIDs = []
    tagNames.forEach(tag => { // creates new tag if name is invalid
        let tagResult = getTagIDByName(tag)
        if (tagResult === undefined) {
            tagIDs.push(DB.prepare(`INSERT INTO tag (name) VALUES(?);`).run(tag).lastInsertRowid)
        } else {
            tagIDs.push(tagResult)
        }
    })

    DB.prepare(`DELETE FROM page_tag WHERE page_id = ?`).run(pageID)

    const INSERT_TAG = DB.prepare(`INSERT INTO page_tag (page_id, tag_id) VALUES(?, ?);`)
    tagIDs.forEach(tagID => {
        INSERT_TAG.run(pageID, tagID)
    })

    return ReturnResult(true, 200, "Page tags changed", tagIDs.join(" / "))
}

async function putPageBools(sessionID, pageID, isOpen, isPrivate) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    const OPEN = isOpen ? 1 : 0
    const PRIVATE = isPrivate ? 1 : 0

    DB.prepare(`UPDATE page SET is_open = ?, is_private = ? WHERE page_id = ?;`).run(OPEN, PRIVATE, pageID)

    return ReturnResult(true, 200, "Page openness/visibility changed", isOpen.toString() + "/" + isPrivate.toString())
}

async function resetPageSecretCode(sessionID, pageID) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    const CODE = generateRandomString(SECRET_CHARACTERS, SECRET_LENGTH)
    DB.prepare(`UPDATE page SET secret_code = ? WHERE page_id = ?;`).run(CODE, pageID)

    return ReturnResult(true, 200, "Page secret code reset", CODE)
}
//#endregion

//#region == put folder ==
async function putFolderName(sessionID, folderID, folderName) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validateFolder(folderID)) {return ReturnResult(false, 404, "Folder does not exist", folderID)}
    if (!validateFolderEditAuthorization(folderID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}
    const PARENT_ID = DB.prepare(`SELECT folder_id, parent FROM folder WHERE folder_id = ?;`).get(folderID).parent
    if (!validateFolderName(folderName, PARENT_ID)) {return ReturnResult(false, 400, "Folder name already exists in parent folder", folderName)}

    DB.prepare(`UPDATE folder SET name = ? WHERE folder_id = ?;`).run(folderName, folderID)
    return ReturnResult(true, 200, "Folder name changed", newTitle)
}

async function putFolderOpen(sessionID, folderID, isOpen) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validateFolder(folderID)) {return ReturnResult(false, 404, "Folder does not exist", folderID)}
    if (!validateFolderEditAuthorization(folderID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    DB.prepare(`UPDATE folder SET is_open = ? WHERE folder_id = ?;`).run(isOpen ? 1 : 0, folderID)
    return ReturnResult(true, 200, "Folder openness changed", isOpen.toString())
}

async function putFolderParent(sessionID, folderID, parentFolderID) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validateFolder(folderID)) {return ReturnResult(false, 404, "Folder does not exist", folderID)}
    if (!validateFolder(parentFolderID)) {return ReturnResult(false, 404, "Parent folder does not exist", parentFolderID)}
    if (!validateFolderEditAuthorization(folderID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}
    if (!validateFolderEditAuthorization(parentFolderID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}
    if (!validateFolderName(folderName, parentFolderID)) {return ReturnResult(false, 400, "Folder name already exists in parent folder", folderName)}

    DB.prepare(`UPDATE folder SET parent = ? WHERE folder_id = ?;`).run(parentFolderID, folderID)
    return ReturnResult(true, 200, "Folder parent changed", parentFolderID)
}
//#endregion

//#region == put user ==
async function putUserName(sessionID, name) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (getUserIDByName(name) !== undefined) {return ReturnResult(false, 400, "Name taken", name)}
    if (name.length > USERNAME_MAX_LENGTH) {return ReturnResult(false, 400, "Username too long", name.length)}
    if (name.match(USERNAME_REGEX === null)) {return ReturnResult(false, 400, "Invalid username character(s)", "Valid characters are alphanumeric and -_")}

    DB.prepare(`UPDATE user SET name = ? WHERE user_id = ?;`).run(name, USER_ID)
    return ReturnResult(true, 200, "Username changed", name)
}

async function putUserPassword(sessionID, password) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (password.length < PASSWORD_MIN_LENGTH) {return ReturnResult(false, 400, "Password not long enough", password.length)}
    if (password.match(PASSWORD_REGEX) === null) {return ReturnResult(false, 400, "Invalid password character(s)", `Valid characters are alphanumeric and ~\`!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/`)}

    try {
        let hash = await argon2.hash(password)
        DB.prepare(`UPDATE user SET password = ? WHERE user_id = ?;`).run(hash, USER_ID)
        return ReturnResult(true, 200, "Password changed", "Hashed and everything too")
    } catch (err) {
        return ReturnResult(false, 500, "Pasword hashing failed", err.toString())
    }
}

async function putUserTrusted(sessionID, targetID, isTrusted) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validateUserAdmin(USER_ID)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}
    if (!validateUser(targetID)) {return ReturnResult(false, 404, "Invalid target", targetID)}

    DB.prepare(`UPDATE user SET is_trusted = ? WHERE user_id = ?;`).run(isTrusted ? 1 : 0, targetID)
}

async function putUserAdmin(sessionID, targetID, isAdmin) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validateUserOwner(USER_ID)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}
    if (!validateUser(targetID)) {return ReturnResult(false, 404, "Invalid target", targetID)}

    DB.prepare(`UPDATE user SET is_admin = ? WHERE user_id = ?;`).run(isAdmin ? 1 : 0, targetID)
}

async function loginUser(name, password) {
    let userID = getUserIDByName(name)
    if (userID === undefined) {return ReturnResult(false, 404, "Username does not exist", name)}

    const HASH = DB.prepare(`SELECT user_id, password FROM user WHERE user_id = ?;`).get(userID).password
    try {
        if (await argon2.verify(HASH, password)) {
            let sessionID = generateRandomString(SESSION_CHARACTERS, SESSION_LENGTH)
            
            let present = new Date(await getUniversalTime())
            let future = present.setDate(present.getDate() + 14)

            DB.prepare(`INSERT INTO user (session_id, session_expiration) VALUES(?, ?));`)
                    .run(sessionID, future.toISOString())
            
            return ReturnResult(true, 201, "Session created", sessionID)
        } else {
            return ReturnResult(false, 400, "Invalid password", "Please try again...")
        }
    } catch (err) {
        return ReturnResult(false, 500, "Hash verification failed", err.toString())
    }
}
//#endregion
//#endregion

//#region DELETE FUNCTIONS
async function deletePage(sessionID, pageID, deleted) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    DB.prepare(`UPDATE page SET is_deleted = ? WHERE page_id = ?;`).run(deleted ? 1 : 0, pageID)
    return ReturnResult(true, 200, "Page deleted", pageID)
}

async function deleteFolder(sessionID, folderID) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validateFolder(folderID)) {return ReturnResult(false, 404, "Folder does not exist", folderID)}
    if (!validateFolderEditAuthorization(folderID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    const PAGE_QUERY = DB.prepare(`SELECT page_id, folder_id FROM page WHERE folder_id = ?;`).all(folderID)
    if (PAGE_QUERY.length > 0) {
        let results = []
        PAGE_QUERY.forEach(element => {
            results.push(element.page_id)
        })
        return ReturnResult(false, 400, "Folder still contains pages", results.join(" / "))
    }

    const FOLDER_QUERY = DB.prepare(`SELECT folder_id, parent FROM folder WHERE parent = ?;`).all(folderID)
    if (FOLDER_QUERY.length > 0) {
        let results = []
        FOLDER_QUERY.forEach(element => {
            results.push(element.folder_id)
        })
        return ReturnResult(false, 400, "Folder still contains subfolders", results.join(" / "))
    }

    DB.prepare(`DELETE FROM folder WHERE folder_id = ?;`).run(folderID)
    return ReturnResult(true, 200, "Folder deleted", folderID)
}

async function deleteTag(sessionID, tagID) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validateTag(tagID)) {return ReturnResult(false, 404, "Tag does not exist", tagID)}

    const TAG_QUERY = DB.prepare(`SELECT page_id, tag_id FROM page_tag WHERE tag_id = ?;`).all(tagID)
    if (TAG_QUERY.length > 0) {
        let results = []
        TAG_QUERY.forEach(element => {
            results.push(element.page_id)
        })
        return ReturnResult(false, 400, "Pages still use tag", results.join(" / "))
    }

    DB.prepare(`DELETE FROM tag WHERE tag_id = ?;`).run(tagID)
    return ReturnResult(true, 200, "Tag deleted", tagID)
}

async function deleteComment(sessionID, commentID, deleted) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validateComment(commentID)) {return ReturnResult(false, 404, "Comment does not exist", commentID)}

    const COMMENT_AUTHOR = DB.prepare(`SELECT comment_id, user_id FROM comment WHERE comment_id = ?;`).get(commentID).user_id
    if (COMMENT_AUTHOR !== USER_ID && !validateUserAdmin(USER_ID)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    DB.prepare(`UPDATE comment SET is_deleted = ? WHERE comment_id = ?;`).run(deleted ? 1 : 0, commentID)
    return ReturnResult(true, 200, "Comment deleted", commentID)
}

async function deleteUser(sessionID, targetID, deleted) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (USER_ID !== targetID && !validateUserAdmin(USER_ID)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    DB.prepare(`UPDATE user SET is_deleted = ? WHERE user_id = ?;`).run(deleted ? 1 : 0, targetID)
    return ReturnResult(true, 200, "User deleted", targetID)
}

async function deleteUserHard(sessionID, targetID, secret_password) { // PERMANENT!!!!!! will fuck up every instance of this user's ID
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session", sessionID)}
    if (!validateUserOwner(USER_ID)) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}
    if (secret_password !== SECRET_PASSWORD) {return ReturnResult(false, 403, "Unauthorized user", USER_ID)}

    DB.prepare(`DELETE FROM user WHERE user_id = ?;`).run(targetID)
    DB.prepare(`UPDATE page SET user_id = null WHERE user_id = ?`).run(targetID)
    DB.prepare(`UPDATE comment SET user_id = null WHERE user_id = ?`).run(targetID)
    DB.prepare(`UPDATE revision SET user_id = null WHERE user_id = ?`).run(targetID)
    DB.prepare(`UPDATE folder SET user_id = null WHERE user_id = ?`).run(targetID)
    DB.prepare(`UPDATE media SET user_id = null WHERE user_id = ?`).run(targetID)
    DB.prepare(`DELETE FROM editor_page WHERE user_id = ?`).run(targetID)
    DB.prepare(`DELETE FROM viewer_page WHERE user_id = ?`).run(targetID)

    return ReturnResult(true, 200, "User HARD deleted", targetID)
}

function logoutUser(sessionID) {
    if (DB.prepare(`UPDATE user SET session_id = null WHERE session_id = ?;`).run(sessionID).changes === 0) {
        return ReturnResult(false, 400, "Invalid session ID", sessionID)
    } else {
        return ReturnResult(true, 200, "Session ID invalidated", sessionID)
    }
}
//#endregion

//#region HELPER FUNCTIONS

async function getUniversalTime() { // returns YYYY-MM-DDTHH:MM:SS.sssZ, "N/A" if both time APIs fail
    let timeApiResponse = await fetch("https://timeapi.io/api/time/current/zone?timeZone=UTC")
    let timeApiResult = await timeApiResponse.json()
    if (timeApiResponse.ok) {
        let present = new Date(timeApiResult.dateTime.slice(0, -4) + "Z")
        return present.toISOString()
    }

    let worldTimeApiResponse = await fetch("http://worldtimeapi.org/api/timezone/UTC")
    let worldTimeApiResult = await worldTimeApiResponse.json()
    if (worldTimeApiResponse.ok) {
        let present = new Date(worldTimeApiResult.datetime.slice(0, -9) + "Z")
        return present.toISOString()
    }

    return "N/A"
}

async function validateSession(sessionID) { // false if sid does not exist or expired, returns user_id otherwise
    const SESSION_QUERY = DB.prepare(`SELECT user_id, session_id, session_expiration FROM user WHERE session_id = ?;`).get(sessionID)
    let dateTime = await getUniversalTime()
    if (SESSION_QUERY.session_id === sessionID && Date(SESSION_QUERY.session_expiration) > Date(dateTime)) {
        return SESSION_QUERY.user_id
    }
    return false
}

function validateUserAdmin(userID) { // false if user is NOT admin
    const RESULT = DB.prepare(`SELECT user_id, is_admin FROM user WHERE user_id = ?;`)
    if (RESULT === undefined) {return false}
    return RESULT.get(userID).is_admin === 1 ? true : false
}

function validateUserOwner(userID) { // false if user is NOT owner
    const RESULT = DB.prepare(`SELECT user_id, is_owner FROM user WHERE user_id = ?;`)
    if (RESULT === undefined) {return false}
    return RESULT.get(userID).is_owner === 1 ? true : false
}

function getPageIDByTitle(pageTitle) { // undefined if page does NOT exist, returns page primary key
    const ID_QUERY = DB.prepare(`SELECT page_id, title FROM page WHERE title = ?;`).get(pageTitle)
    return ID_QUERY.page_id
}

function validatePage(pageID) { // false if page does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM page WHERE page_id = ?);`).get(pageID)
    return result['EXISTS(SELECT 1 FROM page WHERE page_id = ?)'] === 1;
}

function validatePageEditAuthorization(pageID, userID, isCritical) { // false if user is not page creator or page editor or admin (on a closed page). isCritical = true means return false if not creator or admin (no editor or open)
    const PAGE_RESULTS = DB.prepare(`SELECT page_id, user_id, is_open FROM page WHERE page_id = ?;`).get(pageID)
    if (PAGE_RESULTS.user_id === userID) {return true}
    if (PAGE_RESULTS.is_open === 1 && !isCritical) {return true}

    const USER_RESULTS = DB.prepare(`SELECT user_id, is_admin FROM user WHERE user_id = ?;`).get(userID)
    if (USER_RESULTS === undefined || USER_RESULTS.is_admin === 1) {return true}

    if (isCritical) {return false}
    const EDITOR_RESULTS = DB.prepare(`SELECT EXISTS(SELECT 1 FROM editor_page WHERE user_id = ? AND page_id = ?)`).get(userID, pageID)
    if (EDITOR_RESULTS['EXISTS(SELECT 1 FROM editor_page WHERE user_id = ? AND page_id = ?)'] === 1) {return true}

    return false
}

function getFolderIDByName(folderName) { // undefined if folder does NOT exist, returns folder primary key
    let result = DB.prepare(`SELECT folder_id, name FROM folder WHERE name = ?;`).get(folderName)
    return result.folder_id
}

function validateFolderName(folderName, parentID) { // false if folder name does NOT exist with same parent
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM folder WHERE name = ? AND parent = ?);`).get(folderID, parentID)
    return result[`EXISTS(SELECT 1 FROM folder WHERE name = ? AND parent = ?)`] === 1;
}

function validateFolderEditAuthorization(folderID, userID, isCritical) { // false if user is NOT creator of folder OR admin AND parent folder is not open (if noncritical edit)
    if (DB.prepare(`SELECT user_id, is_admin FROM user WHERE user_id = ?;`).get(userID).is_admin === 1) {return true}
    let result = DB.prepare(`SELECT folder_id, user_id, parent FROM folder WHERE folder_id = ?;`).get(folderID)
    if (result === undefined) {return true}
    if (!isCritical && DB.prepare(`SELECT folder_id, is_open FROM folder WHERE folder_id = ?;`).get(result.parent).is_open) {return true}
    return userID === result.user_id
}

function validateFolder(folderID) { // false if folder does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM folder WHERE folder_id = ?);`).get(folderID)
    return result['EXISTS(SELECT 1 FROM folder WHERE folder_id = ?)'] === 1;
}

function getTagIDByName(tagName) { // undefined if tag does NOT exist, returns tag primary key
    let result = DB.prepare(`SELECT tag_id, name FROM tag WHERE name = ?;`).get(tagName)
    return result.tag_id
}

function validateTag(tagID) { // false if tag does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM tag WHERE tag_id = ?);`).get(tagID)
    return result['EXISTS(SELECT 1 FROM tag WHERE tag_id = ?)'] === 1;
}

function getUserIDByName(userName) { // undefined if user does NOT exist, returns user primary key
    let result = DB.prepare(`SELECT user_id, name FROM user WHERE name = ?;`).get(userName)
    return result.user_id
}

function validateUser(userID) { // false if user does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM user WHERE user_id = ?);`).get(userID)
    return result[`EXISTS(SELECT 1 FROM user WHERE user_id = ?)`] === 1;
}

function validateWholeComment(content, parentCommentID, pageID, authorID) { // false if comment exists with same content, parent, page, and author
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM comment WHERE text = ? AND parent = ? AND page_id = ? AND user_id = ?);`)
            .get(content, parentCommentID, pageID, authorID)
    return result[`EXISTS(SELECT 1 FROM comment WHERE text = ? AND parent = ? AND page_id = ? AND user_id = ?)`] === 0;
}

function validateComment(commentID) { // false if comment does not exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM comment WHERE comment_id = ?);`).get(commentID)
    return result[`EXISTS(SELECT 1 FROM comment WHERE comment_id = ?)`] === 0;
}

function generateRandomString(characters, size) {
    if (size <= 0) {return ""}
    let output = []
    
    for (let i = 0; i < size; i++) {
        output.push(characters.charAt(Math.floor(Math.random() * characters.length)))
    }

    return output.join('')
}
//#endregion

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
            is_trusted INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            is_owner INTEGER NOT NULL DEFAULT 0
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
            user_id TEXT,
            is_open INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY (parent) REFERENCES folder (folder_id),
            FOREIGN KEY (user_id) REFERENCES user (user_id)
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

SETUP_TABLES.forEach((stmt) => {stmt.run()})

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