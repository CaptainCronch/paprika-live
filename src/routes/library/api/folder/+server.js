import * as Library from "$lib/library.mjs"

export async function GET({ url }) {
    const PARAMETER = url.searchParams.entries().next().value
    let result
    switch (PARAMETER[0]) {
      case 'id':
        result = await Library.getFolderByID(PARAMETER[1]); break;
      case 'parent':
        result = await Library.getManyFoldersByParentID(PARAMETER[1]); break;
      case 'search':
        result = await Library.getManyFoldersByNamePattern(PARAMETER[1]); break;
      default:
        return new Response("Accepted parameters: id, parent (folder_id), search", {status: 400})
    }
    let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(result.value), {status: result.code,})
}

export async function POST({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")
  
    if (BODY.name == null ||
            BODY.parent === undefined ||
            BODY.is_open == null) {
        return new Response("Please provide name, parent (folder_id) (nullable), and is_open in request body", {status: 400})
    }
  
    let result = await Library.postFolder(SESSION, String(BODY.name), BODY.parent === null ? null : parseInt(BODY.parent), BODY.is_open == true)
    let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(result.value), {status: result.code})
}

export async function PUT({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")

    if (BODY.id == null) {
        return new Response("Please provide name, parent (folder_id), or is_open in request body (id required)", {status: 400})
    }

    let result
    if (BODY.name != null) {
        result = await Library.putFolderName(SESSION, BODY.id, String(BODY.name))
    } else if (BODY.parent !== undefined) {
        result = await Library.putFolderParent(SESSION, BODY.id, BODY.parent === null ? null : parseInt(BODY.parent))
    } else if (BODY.is_open != null) {
        result = await Library.putFolderOpen(SESSION, BODY.id, BODY.is_open == true)
    } else {
        return new Response("Please provide name, parent (folder_id) (nullable), or is_open in request body (id required)", {status: 400})
    }
    let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(result.value), {status: result.code})
}

export async function DELETE({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")
  
    if (BODY.id == null) {return new Response("Please provide id in request body", {status: 400})}
    let result = await Library.deleteFolder(SESSION, parseInt(BODY.id))
    let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(result.value), {status: result.code})
}
