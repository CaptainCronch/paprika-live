import * as Library from "$lib/library.mjs"

export async function GET() {
    let result = await Library.getAllTags()
    return new Response(result.reason + ": " + JSON.stringify(result.value), {status: result.code})
}