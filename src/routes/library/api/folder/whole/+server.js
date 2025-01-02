import * as Library from "$lib/library.mjs"

export async function GET({ cookies, url }) {
    const SESSION = cookies.get("session")

    const PARAMETER = url.searchParams.entries().next().value
    let result
    switch (PARAMETER[0]) {
      case 'parent':
        result = await Library.getWholeFolderByParentID(SESSION, PARAMETER[1] === "null" ? null : PARAMETER[1]); break;
      default:
        return new Response("Accepted search parameters: id (parent folder) (nullable)", {status: 400})
    }
    let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(result.value), {status: result.code})
}