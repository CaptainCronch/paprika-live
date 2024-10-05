import * as Library from "$lib/library.mjs"

export async function GET({ cookies, url }) {
    const SESSION = cookies.get("session")

    const PARAMETER = url.searchParams.entries().next().value
    let result
    switch (PARAMETER[0]) {
      case 'parent':
        result = await Library.getWholeFolderByParentID(SESSION, PARAMETER[1]); break;
      default:
        return new Response("Accepted search parameters: id (parent folder) (nullable)", {status: 400})
    }
    return new Response(result.reason + ": " + JSON.stringify(result.value), {status: result.code})
}