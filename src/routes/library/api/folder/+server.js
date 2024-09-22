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
    return new Response(result.reason + ": " + JSON.stringify(result.value), {status: result.code,})
}

export async function POST({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")
  
    if (BODY.name == null ||
            BODY.parent === undefined ||
            BODY.is_open == null) {
        return new Response("Please provide name, parent (folder_id) (nullable), and is_open in request body", {status: 400})
    }
  
    const RESULT = await Library.postFolder(SESSION, String(BODY.name), parseInt(BODY.parent), BODY.is_open == true)
    return new Response(RESULT.reason + ": " + JSON.stringify(RESULT.value), {status: RESULT.code})
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
        result = await Library.putFolderParent(SESSION, BODY.id, parseInt(BODY.parent))
    } else if (BODY.is_open != null) {
        result = await Library.putFolderOpen(SESSION, BODY.id, BODY.is_open == true)
    } else {
        return new Response("Please provide name, parent (folder_id) (nullable), or is_open in request body (id required)", {status: 400})
    }
    return new Response(result.reason + ": " + JSON.stringify(result.value), {status: result.code})
}

export async function DELETE({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")
  
    if (BODY.id == null) {return new Response("Please provide id in request body", {status: 400})}
    const RESULT = await Library.deleteFolder(SESSION, parseInt(BODY.id))
    return new Response(RESULT.reason + ": " + JSON.stringify(RESULT.value), {status: RESULT.code})
}
