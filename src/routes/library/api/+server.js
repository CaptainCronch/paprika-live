import "$lib/library.mjs"

export function GET() {
	return new Response(`/api
  /page
    /whole
      GET
        ?id=pageID
        ?title=title
    GET
      ?id=pageID
      ?title=title
      ?search=pattern
      ?user_id=userID
      ?username=username
      ?before=date
      ?after=date
      ?folder=folderID
      ?tag_id=tagID
      ?tag_name=tagName
    POST/PUT
      title: title
      editors: [userIDs]
      viewers: [userIDs]
      folder: folderID
      tags: [tagNames]
      is_open: bool
      is_private: bool
      text: text -- (POST only) --
      reset_secret_code: pageID -- (PUT only) --
    DELETE
      ID: pageID
      setDeleted: bool
  /revision
    /whole
      GET
        ?id=revisionID
    /latest
      GET
        ?page_id=pageID
    GET
      ?id=revisionID
      ?page_id=pageID
      ?text=revisionID
    POST
      page: pageID
      text: text
  /tag
    /all
      GET
    GET
      ?id=tagID
      ?name=name
      ?search=pattern
    POST
      name: tagName
    DELETE
      ID: tagID
  /folder
    GET
      ?id=folderID
      ?parent=folderID
      ?search=folderName
    POST/PUT
      name: folderName
      parent: folderID (nullable)
      is_open: bool
    DELETE
      id: folderID
  /comment
    GET
      ?id=commentID
      ?page_id=pageID
      ?user_id=userID
    POST
      text: text
      parent: commentID
      page_id: pageID
    DELETE
      id: commentID
      set_deleted: bool
  /user
    /login
      PUT
        name: name
        password: password
    /logout
      GET
    GET
      ?id=userID
      ?name=username
      ?search=pattern
    POST/PUT
      name: username
      password: password
      is_admin: bool (PUT only)
    DELETE
      id: userID
      set_deleted: bool
      secret_password: secret!
  /stat
    /all
      GET
        ?before=date
        ?after=date
    GET
  GET (api info/help) (this is what you are looking at currently.)`)
}
