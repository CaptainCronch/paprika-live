import * as Library from "$lib/library.mjs"

export async function GET({ cookies }) {
    const SESSION = cookies.get("session")

    const RESULT = await Library.logoutUser(SESSION)
    let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(RESULT.value), {status: RESULT.code})
}
