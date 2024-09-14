import * as Library from "$lib/library.mjs"

export async function GET({ cookies, url }) {
    const SESSION = cookies.get("session")

    const PARAMETER = url.searchParams.entries().next().value
    let result
    switch (PARAMETER[0]) {
      case 'id':
        result = await Library.getCommentByID(SESSION, PARAMETER[1]); break;
      case 'page_id':
        result = await Library.getManyCommentsByPageID(SESSION, PARAMETER[1]); break;
      case 'user_id':
        result = await Library.getManyCommentsByUserID(SESSION, PARAMETER[1]); break;
      default:
        return new Response("Accepted parameters: id, page_id, user_id", {status: 400})
    }
    return new Response(JSON.stringify(result.value), {status: result.code, statusText: result.reason})
}

export async function POST({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")
  
    if (BODY.text == null ||
            BODY.parent === undefined ||
            BODY.page_id == null) {
        return new Response("Please provide text, parent (comment_id) (nullable), and page_id in request body", {status: 400})
    }
  
    const RESULT = await Library.postComment(SESSION, String(BODY.text), parseInt(BODY.parent), parseInt(BODY.page_id))
    return new Response(JSON.stringify(RESULT.value), {status: RESULT.code, statusText: RESULT.reason})
}

export async function DELETE({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")
  
    if (BODY.id == null ||
            BODY.set_deleted == null) {
        return new Response("Please provide id and set_deleted in request body", {status: 400})
    }
    const RESULT = await Library.deleteComment(SESSION, parseInt(BODY.id), BODY.set_deleted == true)
    return new Response(JSON.stringify(RESULT.value), {status: RESULT.code, statusText: RESULT.reason})
}