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
    return new Response(JSON.stringify(result.value), {status: result.code, statusText: result.reason})
}

export async function POST({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")
  
    if (BODY.name == null) {return new Response("Please provide name in request body", {status: 400})}
    const RESULT = await Library.postTag(SESSION, String(BODY.name))
    return new Response(JSON.stringify(RESULT.value), {status: RESULT.code, statusText: RESULT.reason})
}

export async function DELETE({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")
  
    if (BODY.id == null) {
        return new Response("Please provide id in request body", {status: 400})
    }
  
    const RESULT = await Library.deleteTag(SESSION, BODY.id)
    return new Response(JSON.stringify(RESULT.value), {status: RESULT.code, statusText: RESULT.reason})
  }