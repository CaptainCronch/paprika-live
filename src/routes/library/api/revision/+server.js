import * as Library from "$lib/library.mjs"

export async function GET({ cookies, url }) {
    const SESSION = cookies.get("session")

    const PARAMETER = url.searchParams.entries().next().value
    let result
    switch (PARAMETER[0]) {
      case 'id':
        result = await Library.getRevisionByID(SESSION, PARAMETER[1]); break;
      case 'page_id':
        result = await Library.getManyRevisionsByPageID(SESSION, PARAMETER[1]); break;
      case 'text':
        result = await Library.getTextByID(SESSION, PARAMETER[1]); break;
      default:
        return new Response("Accepted parameters: id, page_id, text (revision_id)", {status: 400})
    }
    return new Response(result.reason + ": " + JSON.stringify(result.value), {status: result.code})
}

export async function POST({ request, cookies }) {
  const BODY = await request.json()
  const SESSION = cookies.get("session")

  if (BODY.page_id == null || BODY.text == null) {
      return new Response("Please provide page_id and text in request body", {status: 400})
  }

  const RESULT = await Library.postPage(SESSION, String(BODY.page_id), String(BODY.text))
  return new Response(RESULT.reason + ": " + JSON.stringify(RESULT.value), {status: RESULT.code})
}
