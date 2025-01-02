import * as Library from "$lib/library.mjs"
import HttpDate from "http-date"

export async function PUT({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")

    if (BODY.name == null || BODY.password == null) {
        return new Response("Please provide name and password in request body", {status: 400})
    }

    const RESULT = await Library.loginUser(BODY.name, BODY.password)
    if (RESULT.code === 201) {
        let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(JSON.parse(RESULT.value).sessionID), {status: RESULT.code, headers: new Headers({
            "Set-Cookie": `session=${JSON.parse(RESULT.value).sessionID}; Expires=${new HttpDate(JSON.parse(RESULT.value).expiration).toString()}; HttpOnly; Secure; SameSite=Strict; Path=/`,
            "Access-Control-Expose-Headers": 'Set-Cookie',
        })})
    }
    let reason = result.code % 200 < 100 ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + RESULT.value, {status: RESULT.code})
}