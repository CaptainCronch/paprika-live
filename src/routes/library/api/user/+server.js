import * as Library from "$lib/library.mjs"

export async function GET({ cookies, url }) {
    const SESSION = cookies.get("session")

    const PARAMETER = url.searchParams.entries().next().value
    let result
    switch (PARAMETER[0]) {
      case 'id':
        result = await Library.getUserByID(SESSION, PARAMETER[1]); break;
      case 'name':
        result = await Library.getUserByName(SESSION, PARAMETER[1]); break;
      case 'search':
        result = await Library.getManyUsersByNamePattern(SESSION, PARAMETER[1]); break;
      default:
        return new Response("Accepted parameters: id, name, search", {status: 400})
    }
    return new Response(result.reason + ": " + JSON.stringify(result.value), {status: result.code})
}

export async function POST({ request }) {
    const BODY = await request.json()

    if (BODY.name == null || BODY.password == null) {
        return new Response("Please provide name and password in request body", {status: 400})
    }

    const RESULT = await Library.postUser(String(BODY.name), String(BODY.password))
    return new Response(RESULT.reason + ": " + JSON.stringify(RESULT.value), {status: RESULT.code})
}

export async function PUT({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")

    let result
    if (BODY.name != null) {
        result = await Library.putUserName(SESSION, BODY.password)
    } else if (BODY.password != null) {
        result = await Library.putUserPassword(SESSION, BODY.password)
    } else if (BODY.is_admin != null) {
        result = await Library.putUserAdmin(SESSION, BODY.password)
    } else {
        return new Response("Please provide name, password, or is_admin in request body", {status: 400})
    }
    return new Response(result.reason + ": " + JSON.stringify(result.value), {status: result.code})
}

export async function DELETE({ request, cookies }) {
    const BODY = await request.json()
    const SESSION = cookies.get("session")

    if (BODY.id == null || BODY.set_deleted == null) {
        return new Response("Please provide id and set_deleted in request body", {status: 400})
    }

    let result
    if (BODY.secret_password != null) {
        result = await Library.deleteUserHard(SESSION, BODY.id, BODY.secret_password)
    } else {
        result = await Library.deleteUser(SESSION, BODY.id, BODY.set_deleted)
    }
    return new Response(result.reason + ": " + JSON.stringify(result.value), {status: result.code})
}