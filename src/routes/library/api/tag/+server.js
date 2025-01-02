import * as Library from "$lib/library.mjs"

export async function GET({ url }) {
    const PARAMETER = url.searchParams.entries().next().value
    let result
    switch (PARAMETER[0]) {
      case 'id':
        result = await Library.getTagByID(PARAMETER[1]); break;
      case 'name':
        result = await Library.getTagByName(PARAMETER[1]); break;
      case 'search':
        result = await Library.getManyTagsByNamePattern(PARAMETER[1]); break;
      default:
        return new Response("Accepted parameters: id, name, search", {status: 400})
    }
    let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(result.value), {status: result.code})
}

export async function POST({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")
  
    if (BODY.name == null) {return new Response("Please provide name in request body", {status: 400})}
    const RESULT = await Library.postTag(SESSION, String(BODY.name))
    let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(RESULT.value), {status: RESULT.code})
}

export async function DELETE({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")
  
    if (BODY.id == null) {
        return new Response("Please provide id in request body", {status: 400})
    }
  
    const RESULT = await Library.deleteTag(SESSION, BODY.id)
    let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(RESULT.value), {status: RESULT.code})
  }