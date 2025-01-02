import * as Library from "$lib/library.mjs"

export async function GET({ cookies, url }) {
    const SESSION = cookies.get("session")

    const PARAMETER = url.searchParams.entries().next().value
    if (PARAMETER[0] == 'id') {
        let result = await Library.getLatestRevisionByID(SESSION, PARAMETER[1]);
        let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(result.value), {status: result.code})
    } else {
        return new Response("Accepted parameters: id", {status: 400})
    }
}