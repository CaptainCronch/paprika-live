import * as Library from "$lib/library.mjs"

export function GET({ cookies, url }) {
    console.log(cookies.getAll())
    for (const [key, value] of url.searchParams.entries()) {
        console.log(`${key}, ${value}`);
      }
    return new Response("yep!!")
}