/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params }) {
    let response = await fetch(`/library/api/folder/whole?parent=${params.folder_id === undefined ? null : parseInt(params.folder_id)}`)
    let contents
    if (response.ok) {
        contents = await response.json()
    } else {
        contents = {body: await response.text(), status: response.status, statusText: response.statusText}
    }
    return contents
}