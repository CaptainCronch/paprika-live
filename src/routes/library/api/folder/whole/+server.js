import * as Library from "$lib/library.mjs"

export async function GET({ cookies, url }) {
    const SESSION = cookies.get("session")

    const PARAMETER = url.searchParams.entries().next().value
    let result
    let code
    switch (PARAMETER[0]) {
      case 'parent':
        result = await Library.getWholeFolderByParentID(SESSION, PARAMETER[1] === "null" ? null : PARAMETER[1]); break;
      default:
        return new Response("Accepted search parameters: id (parent folder) (nullable)", {status: 400})
    }

    let reason
    if (result.code.toString()[0] == "2") { // if operation was successful then dont include the reason (so the response can be parsed as json)
      result = result.value
      reason = ""

      for (let index = 0; index < result.pages.length; index++) {
        const page = result.pages[index];
        result.pages[index].authorName = (await Library.getUserByID(SESSION, page.authorID, SESSION)).value.name // authenticated session because it was already used above
        
        let tagNames = []
        for (let index = 0; index < page.tagIDs.length; index++) {
          const TAG_ID = page.tagIDs[index];
          tagNames.push((await Library.getTagByID(TAG_ID)).value.name)
        }
        result.pages[index].tagNames = tagNames
      }
    }
    else {
      reason = result.reason + ": "
      code = result.code
      result = result.value
    }
    return new Response(reason + JSON.stringify(result), {status: code})
}