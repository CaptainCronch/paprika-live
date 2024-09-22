import * as Library from "$lib/library.mjs"

export async function GET({ cookies, url }) {
    const SESSION = cookies.get("session")

    const PARAMETER = url.searchParams.entries().next().value
    if (PARAMETER[0] == 'id') {
        let result = await Library.getLatestRevisionByID(SESSION, PARAMETER[1]);
        return new Response(result.reason + ": " + JSON.stringify(result.value), {status: result.code})
    } else {
        return new Response("Accepted parameters: id", {status: 400})
    }
}