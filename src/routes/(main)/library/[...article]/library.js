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

// TODO: Stat tracking on post/delete functions

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
*/

//#region POST FUNCTIONS

async function postPage(sessionID, pageTitle, allowedEditors, allowedViewers, folderID, tags, content, isOpen, isPrivate) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (getPageIDFromTitle(pageTitle) === undefined) {return ReturnResult(false, 400, "Name taken", pageTitle)}
    if (folderID !== null && !validateFolderEditAuthorization(folderID, USER_ID, false)) {return ReturnResult(false, 403, "Unauthorized to add page to this folder")}

    let unvalidatedUser
    allowedEditors.forEach(editor => {if (!validateUser(editor)) {unvalidatedUser = editor}})
    if (unvalidatedUser !== undefined) {return ReturnResult(false, 404, "Editor does not exist", unvalidatedUser)}

    allowedViewers.forEach(viewer => {if (!validateUser(viewer)) {unvalidatedUser = viewer}})
    if (unvalidatedUser !== undefined) {return ReturnResult(false, 404, "Viewer does not exist", unvalidatedUser)}

    let tagIDs = []
    tags.forEach(tag => { // creates new tag if name is invalid
        let tagResult = getTagIDFromName(tag)
        if (tagResult === undefined) {
            tagIDs.push(DB.prepare(`INSERT INTO tag (name) VALUES(?);`).run(tag).lastInsertRowid)
        } else {
            tagIDs.push(tagResult)
        }
    })

    let dateTime = time()
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

    let revisionResult = await postRevision(sessionID, pageID, content, mediaIDs)
    if (!revisionResult.okay) {return revisionResult}
    else {return ReturnResult(true, 201, "Page created", pageID)}
}

async function postRevision(sessionID, pageID, content) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validateUser(USER_ID)) {return ReturnResult(false, 404, "Author does not exist", USER_ID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, false)) {return ReturnResult(false, 403, "Unauthorized to add revision to page", USER_ID)}

    let textID = DB.prepare(`INSERT INTO text (text) VALUES(?);`).run(content).lastInsertRowid

    let dateTime = time()
    let revisionID = DB.prepare(`INSERT INTO revision (date, page_id, text_id, user_id) VALUES(?, ?, ?, ?);`).run(dateTime, pageID, textID, USER_ID).lastInsertRowid

    return ReturnResult(true, 201, "Revision created", revisionID)
}

async function postTag(sessionID, tagName) {
    if (!await validateSession(sessionID)) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (getTagIDFromName(tagName) !== undefined) {return ReturnResult(false, 400, "Tag already exists", tagName)}
    let tagID = DB.prepare(`INSERT INTO tag (name) VALUES(?);`).run(tagName).lastInsertRowid

    return ReturnResult(true, 201, "Tag created", tagID)
}

async function postFolder(sessionID, folderName, parentFolder) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (parentFolder !== null && !validateFolder(parentFolder)) {return ReturnResult(false, 404, "Parent folder does not exist", parentFolder)}
    if (parentFolder !== null && !validateFolderEditAuthorization(parentFolder, USER_ID, false)) {return ReturnResult(false, 403, "Unauthorized to add subfolder to this folder", USER_ID)}
    if (validateFolderName(folderName, parentFolder) !== undefined) {return ReturnResult(false, 400, "Folder already exists", folderName)}
    let folderID = DB.prepare(`INSERT INTO tag (name) VALUES(?, ?);`).run(folderName, parentFolder).lastInsertRowid

    return ReturnResult(true, 201, "Folder created", folderID)
}

async function postComment(sessionID, content, parentCommentID = null, pageID, authorID) {
    if (!await validateSession(sessionID)) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (parentCommentID !== null && !validateComment(parentCommentID)) {return ReturnResult(false, 404, "Parent comment does not exist", parentCommentID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validateUser(authorID)) {return ReturnResult(false, 404, "User does not exist", authorID)}
    if (!validateWholeComment(content, parentCommentID, pageID, authorID)) {return ReturnResult(false, 400, "Comment already exists", "Same words, same parent comment, same page, same author.")}

    let commentID = DB.prepare(`INSERT INTO comment (text, date, parent, page_id, user_id, is_deleted) VALUES(?, ?, ?, ?, ?, 0);`)
            .run(content, time(), parentCommentID, pageID, authorID).lastInsertRowid

    return ReturnResult(true, 201, "Comment created", commentID)
}

async function postUser(name, password) {
    if (getUserIDFromName(name) !== undefined) {return ReturnResult(false, 400, "Name taken", name)}
    if (name.length > USERNAME_MAX_LENGTH) {return ReturnResult(false, 400, "Username too long", name.length)}
    if (name.match(USERNAME_REGEX === null)) {return ReturnResult(false, 400, "Invalid username character(s)", "Valid characters are alphanumeric and -_")}
    if (password.length < PASSWORD_MIN_LENGTH) {return ReturnResult(false, 400, "Password not long enough", password.length)}
    if (password.match(PASSWORD_REGEX) === null) {return ReturnResult(false, 400, "Invalid password character(s)", `Valid characters are alphanumeric and ~\`!@#$%^&*()_\-+={[}\]|\\:;"'<,>.?/`)}

    try {
        let hash = await argon2.hash(password)
        let userID = DB.prepare(`INSERT INTO user (user_id, name, password, join_date, is_admin, is_deleted) VALUES(?, ?, ?, ?, 0, 0);`)
            .run(uuidv4(), name, hash, time()).lastInsertRowid
        return ReturnResult(true, 201, "User created", userID)
    } catch (err) {
        return ReturnResult(false, 500, "Pasword hashing failed", err.toString())
    }
}
//#endregion

//#region GET FUNCTIONS

//#region == get page ==
async function getPageByID(sessionID, pageID, validatedUserID = null) { // validatedUserID skips over session verification (so mass GETs only verify once)
    let userID = null
    if (sessionID !== null && validatedUserID === null) {
        const VERIFICATION_RESULT = await validateSession(sessionID)
        if (!VERIFICATION_RESULT) {return ReturnResult(false, 401, "Invalid session ID")}
        userID = VERIFICATION_RESULT
    }
    else if (validatedUserID !== null && validatedUserID !== false) {userID = validatedUserID}

    if (pageID === undefined) {return ReturnResult(false, 404, "Page not found", pageID)}
    if (!validatePageViewAuthorization(pageID, userID)) {return ReturnResult(false, 403, "Unauthorized to view this page", pageID)}

    const DATA = DB.prepare(`SELECT * FROM page WHERE page_id = ?;`).get(pageID)

    const EDITOR_RESULTS = DB.prepare(`SELECT user_id, page_id FROM editor_page WHERE page_id = ?;`).all(pageID)
    let editorIDs = []
    EDITOR_RESULTS.forEach(element => {editorIDs.push(element.user_id)})

    const VIEWER_RESULTS = DB.prepare(`SELECT user_id, page_id FROM viewer_page WHERE page_id = ?;`).all(pageID)
    let viewerIDs = []
    VIEWER_RESULTS.forEach(element => {viewerIDs.push(element.user_id)})

    const TAG_RESULTS = DB.prepare(`SELECT page_id, tag_id FROM page_tag WHERE page_id = ?;`).all(pageID)
    let tagIDs = []
    TAG_RESULTS.forEach(element => {tagIDs.push(element.tag_id)})

    let output = {
        pageID: DATA.page_id,
        title: DATA.title,
        date: DATA.date,
        authorID: DATA.user_id,
        folderID: DATA.folder_id,
        isDeleted: DATA.is_deleted == 1,
        isOpen: DATA.is_open == 1,
        isPrivate: DATA.is_private == 1,
        tagIDs: tagIDs,
        editorIDs: editorIDs,
        viewerIDs: viewerIDs,
    }

    if (userID !== null && userID === DATA.user_id) {
        output.secretCode = DATA.secret_code
    }

    return ReturnResult(true, 200, "Page retrieved", output)
}

async function getPageByTitle(sessionID, title) {
    const PAGE_ID = getPageIDFromTitle(title)
    if (PAGE_ID === undefined) {return ReturnResult(false, 404, "Page not found", title)}

    return await getPageByID(sessionID, PAGE_ID)
}

async function getManyPagesByID(sessionID, array) {
    const USER_ID = await validateSession(sessionID)
    
    let pageIDs = []
    array.forEach(element => {pageIDs.push(element.page_id)})

    let outputs = []
    for (let i = 0; i < pageIDs.length; i++) {
        const PAGE_QUERY = await getPageByID(sessionID, pageIDs[i], USER_ID)
        if (PAGE_QUERY.okay) {outputs.push(PAGE_QUERY.value)}
    }

    return ReturnResult(true, 200, "Pages retrieved", outputs)
}

async function getManyPagesByTitlePattern(sessionID, pattern) {
    const RESULTS = DB.prepare(`SELECT page_id, title FROM page WHERE title LIKE %?%;`).all(pattern)
    if (RESULTS.length < 1) {return ReturnResult(false, 404, "No pages matching title pattern found", pattern)}
    return await getManyPagesByID(sessionID, RESULTS)
}

async function getManyPagesByAuthorID(sessionID, targetID) {
    if (!validateUser(targetID)) {return ReturnResult(false, 404, "User not found")}
    return await getManyPagesByID(sessionID, DB.prepare(`SELECT page_id, user_id FROM page WHERE user_id = ?;`).all(targetID))
}

async function getManyPagesByAuthorName(sessionID, targetName) {
    const TARGET_ID = getUserIDFromName(targetName)
    if (TARGET_ID === undefined) {return ReturnResult(false, 404, "User with provided name not found", targetName)}

    return await getManyPagesByAuthorID(sessionID, TARGET_ID)
}

async function getManyPagesByTime(sessionID, time, before) {
    let results
    if (before) {results = DB.prepare(`SELECT page_id, date FROM page WHERE date <= ?`).all(time)}
    else {results = DB.prepare(`SELECT page_id, date FROM page WHERE date >= ?`).all(time)}

    return await getManyPagesByID(sessionID, results)
}

async function getManyPagesByFolderID(sessionID, folderID) {
    if (!validateFolder(folderID)) {return ReturnResult(false, 404, "Folder not found", folderID)}
    return await getManyPagesByID(sessionID, DB.prepare(`SELECT page_id, folder_id FROM page WHERE folder_id = ?`).all(folderID))
}

async function getManyPagesByTagID(sessionID, tagID) {
    if (!validateTag(tagID)) {return ReturnResult(false, 404, "Tag not found", tagID)}
    return await getManyPagesByID(sessionID, DB.prepare(`SELECT page_id, tag_id FROM page_tag WHERE tag_id = ?`).all(tagID))
}

async function getManyPagesByTagName(sessionID, tagName) {
    const TAG_ID = getTagIDFromName(tagName)
    if (TAG_ID === undefined) {return ReturnResult(false, 404, "Tag with provided name not found", tagName)}

    return await getManyPagesByTagID(sessionID, TAG_ID)
}
//#endregion

//#region == get revision ==
async function getRevisionByID(sessionID, revisionID, validatedUserID = null) { // validatedUserID skips over session verification (so mass GETs only verify once)
    let userID = null
    if (sessionID !== null && validatedUserID === null) {
        const VERIFICATION_RESULT = await validateSession(sessionID)
        if (!VERIFICATION_RESULT) {return ReturnResult(false, 401, "Invalid session ID")}
        userID = VERIFICATION_RESULT
    }
    else if (validatedUserID !== null && validatedUserID !== false) {userID = validatedUserID}

    if (revisionID === undefined) {return ReturnResult(false, 404, "Revision not found", revisionID)}
    const REVISION = DB.prepare(`SELECT * FROM revision WHERE revision_id = ?;`).get(revisionID)
    if (!validatePageViewAuthorization(REVISION.page_id, userID)) {return ReturnResult(false, 403, "Unauthorized to view this page", REVISION.page_id)}

    const OUTPUT = {
        'revisionID': REVISION.revision_id,
        date: REVISION.date,
        pageID: REVISION.page_id,
        textID: REVISION.text_id,
        'userID': REVISION.user_id,
    }

    return ReturnResult(true, 200, "Revision retrieved", OUTPUT)
}

async function getLatestRevisionByPageID(sessionID, pageID) {
    const LAST_REVISION_ID = DB.prepare(`SELECT MAX(revision_id) FROM revision WHERE page_id = ?;`).pluck(true).get(pageID)
    return await getRevisionByID(sessionID, LAST_REVISION_ID)
}

async function getManyRevisionsByPageID(sessionID, pageID) {
    const USER_ID = await validateSession(sessionID)
    const REVISIONS = DB.prepare(`SELECT revision_id, page_id FROM revision WHERE page_id = ?;`).all(pageID)

    let revisionIDs = []
    REVISIONS.forEach(element => {revisionIDs.push(element.revision_id)})

    let outputs = []
    for (let i = 0; i < revisionIDs.length; i++) {
        const REVISION_QUERY = await getPageByID(sessionID, revisionIDs[i], USER_ID)
        if (REVISION_QUERY.okay) {outputs.push(REVISION_QUERY.value)}
    }

    return ReturnResult(true, 200, "Pages retrieved", outputs)
}

async function getTextByID(sessionID, revisionID) {
    let userID = null
    if (sessionID !== null) {
        const VERIFICATION_RESULT = await validateSession(sessionID)
        if (!VERIFICATION_RESULT) {return ReturnResult(false, 401, "Invalid session ID")}
        userID = VERIFICATION_RESULT
    }

    const REVISION = DB.prepare(`SELECT page_id, text_id FROM revision WHERE revision_id = ?;`)
    if (!validatePageViewAuthorization(REVISION.page_id, userID)) {return ReturnResult(false, 403, "Unauthorized to view this page")}

    return ReturnResult(true, 200, "Retrieved text", DB.prepare(`SELECT text_id, text FROM text WHERE text_id = ?;`).get(REVISION.text_id))
}
//#endregion

//#region == get tag ==
async function getTagByID(tagID) {
    if (!validateTag(tagID)) {return ReturnResult(false, 404, "Tag not found", tagID)}
    const TAG = DB.prepare(`SELECT * FROM tag WHERE tag_id = ?;`).get(tagID)

    return ReturnResult(true, 200, "Tag retrieved", {'tagID': TAG.tag_id, 'name': TAG.name})
}

async function getTagByName(name) {
    const TAG_ID = getTagIDFromName(name)
    if (TAG_ID === undefined) {return ReturnResult(false, 404, "Tag with name not found", name)}
    const TAG = DB.prepare(`SELECT * FROM tag WHERE tag_id = ?;`).get(TAG_ID)

    return ReturnResult(true, 200, "Tag retrieved", {'tagID': TAG.tag_id, 'name': TAG.name})
}

async function getManyTagsByNamePattern(pattern) {
    const TAGS = DB.prepare(`SELECT * FROM tag WHERE name LIKE %?%;`).all(pattern)
    if (TAGS.length < 1) {return ReturnResult(false, 404, "No tags found matching pattern")}

    let output = []
    TAGS.forEach(element => {output.push({'tagID': element.tag_id, 'name': element.name})})

    return ReturnResult(true, 200, "Tags retrieved", output)
}

async function getAllTags() {
    const TAGS = DB.prepare(`SELECT * FROM tag;`).all()
    let output = []
    TAGS.forEach(element => {output.push({'tagID': element.tag_id, 'name': element.name})})

    return ReturnResult(true, 200, "Tags retrieved", output)
}
//#endregion

//#region == get folder ==
async function getFolderByID(folderID) { // folder_id, name, parent, user_id, is_open
    if (!validateFolder(tagID)) {return ReturnResult(false, 404, "Folder not found", folderID)}
    const FOLDER = DB.prepare(`SELECT * FROM folder WHERE folder_id = ?;`).get(folderID)

    const OUTPUT = {
        'folderID': FOLDER.folder_id,
        name: FOLDER.name,
        parentID: FOLDER.parent,
        userID: FOLDER.user_id,
        isOpen: FOLDER.is_open == 1,
    }
    return ReturnResult(true, 200, "Folder retrieved", OUTPUT)
}

async function getManyFoldersByNamePattern(pattern) {
    const FOLDERS = DB.prepare(`SELECT * FROM folder WHERE name LIKE %?%;`).all(pattern)
    if (FOLDERS.length < 1) {return ReturnResult(false, 404, "No folders found matching pattern")}

    let output = []
    FOLDERS.forEach(element => {
        const OBJECT = {
            'folderID': element.folder_id,
            name: element.name,
            parentID: element.parent,
            userID: element.user_id,
            isOpen: element.is_open == 1,
        }
        output.push(OBJECT)
    })

    return ReturnResult(true, 200, "Folders retrieved", output)
}

async function getManyFoldersByParentID(parentID) {
    const FOLDERS = DB.prepare(`SELECT * FROM folder WHERE parent = ?;`).all(parentID)
    if (FOLDERS.length < 1) {return ReturnResult(false, 404, "No subfolders found")}

    let output = []
    FOLDERS.forEach(element => {
        const OBJECT = {
            'folderID': element.folder_id,
            name: element.name,
            parentID: element.parent,
            userID: element.user_id,
            isOpen: element.is_open == 1,
        }
        output.push(OBJECT)
    })

    return ReturnResult(true, 200, "Folders retrieved", output)
}
//#endregion
//#endregion

//#region PUT FUNCTIONS

//#region == put page ==
async function putPageTitle(sessionID, pageID, newTitle) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (getPageIDFromTitle(newTitle) === undefined) {return ReturnResult(false, 400, "Name taken", newTitle)}
    if (!validatePageEditAuthorization(pageID, USER_ID, false)) {return ReturnResult(false, 403, "Unauthorized to edit this page", USER_ID)}

    DB.prepare(`UPDATE page SET title = ? WHERE page_id = ?;`).run(newTitle, pageID)
    return ReturnResult(true, 200, "Page title changed", newTitle)
}

async function putPageEditors(sessionID, pageID, newEditorIDs) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized to edit this page", USER_ID)}

    let unvalidatedUser
    newEditorIDs.forEach(editor => {if (!validateUser(editor)) {unvalidatedUser = editor}})
    if (unvalidatedUser !== undefined) {return ReturnResult(false, 404, "Editor does not exist", unvalidatedUser)}

    DB.prepare(`DELETE FROM editor_page WHERE page_id = ?`).run(pageID)

    const INSERT_EDITOR = DB.prepare(`INSERT INTO editor_page (user_id, page_id) VALUES(?, ?);`)
    newEditorIDs.forEach(editorID => {
        INSERT_EDITOR.run(editorID, pageID)
    })

    return ReturnResult(true, 200, "Page editors changed", newEditorIDs.join(" / "))
}

async function putPageViewers(sessionID, pageID, newViewerIDs) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, false)) {return ReturnResult(false, 403, "Unauthorized to edit this page", USER_ID)}

    let unvalidatedUser
    newViewerIDs.forEach(viewer => {if (!validateUser(viewer)) {unvalidatedUser = viewer}})
    if (unvalidatedUser !== undefined) {return ReturnResult(false, 404, "Editor does not exist", unvalidatedUser)}

    DB.prepare(`DELETE FROM viewer_page WHERE page_id = ?`).run(pageID)

    const INSERT_VIEWER = DB.prepare(`INSERT INTO viewer_page (user_id, page_id) VALUES(?, ?);`)
    newViewerIDs.forEach(viewerID => {
        INSERT_VIEWER.run(viewerID, pageID)
    })

    return ReturnResult(true, 200, "Page viewers changed", newViewerIDs.join(" / "))
}

async function putPageTags(sessionID, pageID, tagNames) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, false)) {return ReturnResult(false, 403, "Unauthorized to edit this page", USER_ID)}

    let tagIDs = []
    tagNames.forEach(tag => { // creates new tag if name is invalid
        let tagResult = getTagIDFromName(tag)
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
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized to edit this page", USER_ID)}

    const OPEN = isOpen ? 1 : 0
    const PRIVATE = isPrivate ? 1 : 0

    DB.prepare(`UPDATE page SET is_open = ?, is_private = ? WHERE page_id = ?;`).run(OPEN, PRIVATE, pageID)

    return ReturnResult(true, 200, "Page openness/visibility changed", isOpen.toString() + "/" + isPrivate.toString())
}

async function resetPageSecretCode(sessionID, pageID) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized to edit this page", USER_ID)}

    const CODE = generateRandomString(SECRET_CHARACTERS, SECRET_LENGTH)
    DB.prepare(`UPDATE page SET secret_code = ? WHERE page_id = ?;`).run(CODE, pageID)

    return ReturnResult(true, 200, "Page secret code reset", CODE)
}
//#endregion

//#region == put folder ==
async function putFolderName(sessionID, folderID, folderName) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validateFolder(folderID)) {return ReturnResult(false, 404, "Folder does not exist", folderID)}
    if (!validateFolderEditAuthorization(folderID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized to edit this folder", USER_ID)}
    const PARENT_ID = DB.prepare(`SELECT folder_id, parent FROM folder WHERE folder_id = ?;`).get(folderID).parent
    if (!validateFolderName(folderName, PARENT_ID)) {return ReturnResult(false, 400, "Folder name already exists in parent folder", folderName)}

    DB.prepare(`UPDATE folder SET name = ? WHERE folder_id = ?;`).run(folderName, folderID)
    return ReturnResult(true, 200, "Folder name changed", newTitle)
}

async function putFolderOpen(sessionID, folderID, isOpen) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validateFolder(folderID)) {return ReturnResult(false, 404, "Folder does not exist", folderID)}
    if (!validateFolderEditAuthorization(folderID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized to edit this folder", USER_ID)}

    DB.prepare(`UPDATE folder SET is_open = ? WHERE folder_id = ?;`).run(isOpen ? 1 : 0, folderID)
    return ReturnResult(true, 200, "Folder openness changed", isOpen.toString())
}

async function putFolderParent(sessionID, folderID, parentFolderID) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validateFolder(folderID)) {return ReturnResult(false, 404, "Folder does not exist", folderID)}
    if (!validateFolder(parentFolderID)) {return ReturnResult(false, 404, "Parent folder does not exist", parentFolderID)}
    if (!validateFolderEditAuthorization(folderID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized to edit this folder", USER_ID)}
    if (!validateFolderEditAuthorization(parentFolderID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized to add subfolder to this folder", USER_ID)}
    if (!validateFolderName(folderName, parentFolderID)) {return ReturnResult(false, 400, "Folder name already exists in parent folder", folderName)}

    DB.prepare(`UPDATE folder SET parent = ? WHERE folder_id = ?;`).run(parentFolderID, folderID)
    return ReturnResult(true, 200, "Folder parent changed", parentFolderID)
}
//#endregion

//#region == put user ==
async function putUserName(sessionID, name) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (getUserIDFromName(name) !== undefined) {return ReturnResult(false, 400, "Name taken", name)}
    if (name.length > USERNAME_MAX_LENGTH) {return ReturnResult(false, 400, "Username too long", name.length)}
    if (name.match(USERNAME_REGEX === null)) {return ReturnResult(false, 400, "Invalid username character(s)", "Valid characters are alphanumeric and -_")}

    DB.prepare(`UPDATE user SET name = ? WHERE user_id = ?;`).run(name, USER_ID)
    return ReturnResult(true, 200, "Username changed", name)
}

async function putUserPassword(sessionID, password) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
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
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validateUserAdmin(USER_ID)) {return ReturnResult(false, 403, "Unauthorized to edit this user", USER_ID)}
    if (!validateUser(targetID)) {return ReturnResult(false, 404, "Invalid target", targetID)}

    DB.prepare(`UPDATE user SET is_trusted = ? WHERE user_id = ?;`).run(isTrusted ? 1 : 0, targetID)
}

async function putUserAdmin(sessionID, targetID, isAdmin) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validateUserOwner(USER_ID)) {return ReturnResult(false, 403, "Unauthorized to edit this user", USER_ID)}
    if (!validateUser(targetID)) {return ReturnResult(false, 404, "Invalid target", targetID)}

    DB.prepare(`UPDATE user SET is_admin = ? WHERE user_id = ?;`).run(isAdmin ? 1 : 0, targetID)
}

async function loginUser(name, password) {
    let userID = getUserIDFromName(name)
    if (userID === undefined) {return ReturnResult(false, 404, "Username does not exist", name)}

    const HASH = DB.prepare(`SELECT user_id, password FROM user WHERE user_id = ?;`).get(userID).password
    try {
        if (await argon2.verify(HASH, password)) {
            let sessionID = generateRandomString(SESSION_CHARACTERS, SESSION_LENGTH)
            
            let present = new Date(time())
            present.setDate(present.getDate() + 14)

            DB.prepare(`INSERT INTO user (session_id, session_expiration) VALUES(?, ?));`)
                    .run(sessionID, present.getTime())
            
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
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validatePage(pageID)) {return ReturnResult(false, 404, "Page does not exist", pageID)}
    if (!validatePageEditAuthorization(pageID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized to delete this page", USER_ID)}

    DB.prepare(`UPDATE page SET is_deleted = ? WHERE page_id = ?;`).run(deleted ? 1 : 0, pageID)
    return ReturnResult(true, 200, "Page deleted", pageID)
}

async function deleteFolder(sessionID, folderID) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validateFolder(folderID)) {return ReturnResult(false, 404, "Folder does not exist", folderID)}
    if (!validateFolderEditAuthorization(folderID, USER_ID, true)) {return ReturnResult(false, 403, "Unauthorized to delete this folder", USER_ID)}

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
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
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
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validateComment(commentID)) {return ReturnResult(false, 404, "Comment does not exist", commentID)}

    const COMMENT_AUTHOR = DB.prepare(`SELECT comment_id, user_id FROM comment WHERE comment_id = ?;`).get(commentID).user_id
    if (COMMENT_AUTHOR !== USER_ID && !validateUserAdmin(USER_ID)) {return ReturnResult(false, 403, "Unauthorized to delete this comment", USER_ID)}

    DB.prepare(`UPDATE comment SET is_deleted = ? WHERE comment_id = ?;`).run(deleted ? 1 : 0, commentID)
    return ReturnResult(true, 200, "Comment deleted", commentID)
}

async function deleteUser(sessionID, targetID, deleted) {
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (USER_ID !== targetID && !validateUserAdmin(USER_ID)) {return ReturnResult(false, 403, "Unauthorized to delete this user", USER_ID)}

    DB.prepare(`UPDATE user SET is_deleted = ? WHERE user_id = ?;`).run(deleted ? 1 : 0, targetID)
    return ReturnResult(true, 200, "User deleted", targetID)
}

async function deleteUserHard(sessionID, targetID, secret_password) { // PERMANENT!!!!!! will fuck up every instance of this user's ID
    const USER_ID = await validateSession(sessionID)
    if (!USER_ID) {return ReturnResult(false, 401, "Invalid session ID", sessionID)}
    if (!validateUserOwner(USER_ID)) {return ReturnResult(false, 403, "Unauthorized to delete this user", USER_ID)}
    if (secret_password !== SECRET_PASSWORD) {return ReturnResult(false, 403, "Unauthorized to delete this user", USER_ID)}

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

function time() {return new Date().getTime()}

async function validateSession(sessionID) { // false if sid does not exist or expired, returns user_id otherwise
    if (sessionID === null) {return false}
    const SESSION_QUERY = DB.prepare(`SELECT user_id, session_id, session_expiration FROM user WHERE session_id = ?;`).get(sessionID)
    if (SESSION_QUERY.session_id === sessionID && SESSION_QUERY.session_expiration > time()) {
        return SESSION_QUERY.user_id
    }
    return false
}

function validateUserAdmin(userID) { // false if user is NOT admin
    if (userID === null) {return false}
    const RESULT = DB.prepare(`SELECT user_id, is_admin FROM user WHERE user_id = ?;`)
    if (RESULT === undefined) {return false}
    return RESULT.get(userID).is_admin === 1 ? true : false
}

function validateUserOwner(userID) { // false if user is NOT owner
    if (userID === null) {return false}
    const RESULT = DB.prepare(`SELECT user_id, is_owner FROM user WHERE user_id = ?;`)
    if (RESULT === undefined) {return false}
    return RESULT.get(userID).is_owner === 1 ? true : false
}

function getPageIDFromTitle(pageTitle) { // undefined if page does NOT exist, returns page primary key
    const ID_QUERY = DB.prepare(`SELECT page_id, title FROM page WHERE title = ?;`).get(pageTitle)
    return ID_QUERY.page_id
}

function validatePage(pageID) { // false if page does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM page WHERE page_id = ?);`).get(pageID)
    return result['EXISTS(SELECT 1 FROM page WHERE page_id = ?)'] === 1;
}

function validatePageEditAuthorization(pageID, userID, isCritical) { // false if page is deleted (if user is not author) or user is not page creator or page editor or admin (on a closed page). isCritical = true means return false if not creator or admin (no editor or open)
    if (userID === null) {return false}
    const PAGE_RESULTS = DB.prepare(`SELECT page_id, user_id, is_open, is_deleted FROM page WHERE page_id = ?;`).get(pageID)

    const USER_RESULTS = DB.prepare(`SELECT user_id, is_admin FROM user WHERE user_id = ?;`).get(userID)
    if (USER_RESULTS.is_admin == 1) {return true}
    if (PAGE_RESULTS.user_id === userID) {return true}
    if (PAGE_RESULTS.is_deleted == 1) {return false}
    if (PAGE_RESULTS.is_open == 1 && !isCritical) {return true}

    if (isCritical) {return false}
    const EDITOR_RESULTS = DB.prepare(`SELECT EXISTS(SELECT 1 FROM editor_page WHERE user_id = ? AND page_id = ?)`).get(userID, pageID)
    if (EDITOR_RESULTS['EXISTS(SELECT 1 FROM editor_page WHERE user_id = ? AND page_id = ?)'] === 1) {return true}

    return false
}

function validatePageViewAuthorization(pageID, userID) { // false if page is deleted (if user is not author) or user is not page creator or page editor or admin or null (on a private page)
    const PAGE_RESULTS = DB.prepare(`SELECT page_id, user_id, is_private, is_deleted FROM page WHERE page_id = ?;`).get(pageID)
    if (userID === null && PAGE_RESULTS.is_private == 0 && PAGE_RESULTS.is_deleted == 0) {return true}
    else if (userID === null) {return false}
    const USER_RESULTS = DB.prepare(`SELECT user_id, is_admin FROM user WHERE user_id = ?;`).get(userID)

    if (USER_RESULTS.is_admin == 1) {return true}
    if (PAGE_RESULTS.user_id === userID) {return true}
    if (PAGE_RESULTS.is_deleted == 1) {return false}
    if (PAGE_RESULTS.is_private == 0) {return true}

    const EDITOR_RESULTS = DB.prepare(`SELECT EXISTS(SELECT 1 FROM viewer_page WHERE user_id = ? AND page_id = ?)`).get(userID, pageID)
    if (EDITOR_RESULTS['EXISTS(SELECT 1 FROM viewer_page WHERE user_id = ? AND page_id = ?)'] === 1) {return true}

    return false
}

function getFolderIDFromName(folderName) { // undefined if folder does NOT exist, returns folder primary key
    let result = DB.prepare(`SELECT folder_id, name FROM folder WHERE name = ?;`).get(folderName)
    return result.folder_id
}

function validateFolderName(folderName, parentID) { // false if folder name does NOT exist with same parent
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM folder WHERE name = ? AND parent = ?);`).get(folderID, parentID)
    return result[`EXISTS(SELECT 1 FROM folder WHERE name = ? AND parent = ?)`] === 1;
}

function validateFolderEditAuthorization(folderID, userID, isCritical) { // false if user is NOT creator of folder OR admin AND parent folder is not open (if noncritical edit)
    if (userID === null) {return false}
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

function getTagIDFromName(tagName) { // undefined if tag does NOT exist, returns tag primary key
    let result = DB.prepare(`SELECT tag_id, name FROM tag WHERE name = ?;`).get(tagName)
    return result.tag_id
}

function validateTag(tagID) { // false if tag does NOT exist
    let result = DB.prepare(`SELECT EXISTS(SELECT 1 FROM tag WHERE tag_id = ?);`).get(tagID)
    return result['EXISTS(SELECT 1 FROM tag WHERE tag_id = ?)'] === 1;
}

function getUserIDFromName(userName) { // undefined if user does NOT exist, returns user primary key
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