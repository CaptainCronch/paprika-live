import * as Library from "$lib/library.mjs"

export async function GET({ cookies, url }) {
    const SESSION = cookies.get("session")

    const PARAMETER = url.searchParams.entries().next().value
    let result
    switch (PARAMETER[0]) {
      case 'id':
        result = await Library.getPageByID(SESSION, PARAMETER[1]); break;
      case 'title':
        result = await Library.getPageByTitle(SESSION, PARAMETER[1]); break;
      case 'search':
        result = await Library.getManyPagesByTitlePattern(SESSION, PARAMETER[1]); break;
      case 'user_id':
        result = await Library.getManyPagesByAuthorID(SESSION, PARAMETER[1]); break;
      case 'username':
        result = await Library.getManyPagesByAuthorName(SESSION, PARAMETER[1]); break;
      case 'before':
        result = await Library.getManyPagesByTime(SESSION, PARAMETER[1], true); break;
      case 'after':
        result = await Library.getManyPagesByTime(SESSION, PARAMETER[1], false); break;
      case 'folder':
        result = await Library.getManyPagesByFolderID(SESSION, PARAMETER[1]); break;
      case 'tag_id':
        result = await Library.getManyPagesByTagID(SESSION, PARAMETER[1]); break;
      case 'tag_name':
        result = await Library.getManyPagesByTagName(SESSION, PARAMETER[1]); break;
      default:
        return new Response("Accepted parameters: id, title, search, user_id, username, before (date), after (date), folder, tag_id, tag_name", {status: 400})
    }
    return new Response(result.value, {status: result.code, statusText: result.reason})
}

export async function POST({ request, cookies }) {
  const BODY = await request.json()
  const SESSION = cookies.get("session")

  if (BODY.title == null ||
          BODY.editors == null ||
          BODY.viewers == null ||
          BODY.folder === undefined ||
          BODY.tags == null ||
          BODY.is_open == null ||
          BODY.is_private == null ||
          BODY.text == null) {
      return new Response("Please provide title, editors, viewers, folder, tags, is_open, is_private, and text in request body", {status: 400})
  }

  const RESULT = await Library.postPage(SESSION, String(BODY.title), JSON.parse(BODY.editors), JSON.parse(BODY.viewers), parseInt(BODY.folder), JSON.parse(BODY.tags), BODY.is_open == true, BODY.is_private == true, String(BODY.text))
  return new Response(RESULT.value, {status: RESULT.code, statusText: RESULT.reason})
}

export async function PUT({ request, cookies }) {
  const BODY = await request.json()
  const SESSION = cookies.get("session")

  if (BODY.id == null) {
    return new Response("Please provide title, editors, viewers, folder, tags, is_open, is_private, or reset_secret_code in request body (id required)", {status: 400})
  }

  let result
  if (BODY.title != null) {
      result = await Library.putPageTitle(SESSION, BODY.id, BODY.title)
  } else if (BODY.editors != null || BODY.editors.size > 0) {
      result = await Library.putPageEditors(SESSION, BODY.id, JSON.parse(BODY.editors))
  } else if (BODY.viewers != null || BODY.viewers.size > 0) {
      result = await Library.putPageViewers(SESSION, BODY.id, JSON.parse(BODY.viewers))
  } else if (BODY.tags != null || BODY.tags.size > 0) {
    result = await Library.putPageTags(SESSION, BODY.id, JSON.parse(BODY.tags))
  } else if (BODY.folder != null) {
    result = await Library.putPageFolder(SESSION, BODY.id, BODY.folder)
  } else if (BODY.is_open != null) {
    result = await Library.putPageOpen(SESSION, BODY.id, BODY.is_open)
  } else if (BODY.is_private != null) {
    result = await Library.putPagePrivate(SESSION, BODY.id, BODY.is_private)
  } else if (BODY.reset_secret_code != null) {
    result = await Library.resetPageSecretCode(SESSION, BODY.id)
  } else {
      return new Response("Please provide title, editors, viewers, folder, tags, is_open, is_private, or reset_secret_code in request body (id required)", {status: 400})
  }
  return new Response(result.value, {status: result.code, statusText: result.reason})
}

export async function DELETE({ request, cookies }) {
  const BODY = await request.json()
  const SESSION = cookies.get("session")

  if (BODY.id == null || BODY.set_deleted == null) {
      return new Response("Please provide id and set_deleted in request body", {status: 400})
  }

  const RESULT = await Library.deleteUser(SESSION, BODY.id, BODY.set_deleted)
  return new Response(RESULT.value, {status: RESULT.code, statusText: RESULT.reason})
}