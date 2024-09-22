import * as Library from "$lib/library.mjs"

export async function GET({ cookies }) {
    const SESSION = cookies.get("session")

    const RESULT = await Library.logoutUser(SESSION)
    return new Response(RESULT.reason + ": " + JSON.stringify(RESULT.value), {status: RESULT.code})
}
