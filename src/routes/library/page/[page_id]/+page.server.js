/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params }) {
    let response = await fetch(`/library/api/page/whole?id=${params.page_id}`)
    let page
    if (response.ok) {
        page = await response.json()
    } else {
        console.log(await response.text())
        // send a message to the user that something went wrong
        // page = {body: await response.json(), status: response.status, statusText: response.statusText}
    }
    return {'page': page}
}
