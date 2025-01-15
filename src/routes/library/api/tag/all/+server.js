import * as Library from "$lib/library.mjs"

export async function GET() {
    let result = await Library.getAllTags()
    let reason = result.code.toString()[0] == "2" ? "" : result.reason + ": " // if operation was successful then dont include the reason (so the response can be parsed as json)
    return new Response(reason + JSON.stringify(result.value), {status: result.code})
}