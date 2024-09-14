/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params }) {
    return {response: await fetch(`/library/api/page/whole?id=${params.slug}`).body}
}
