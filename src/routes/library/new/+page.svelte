<script>
	import ArticleFrame from "./ArticleFrame.svelte";
	import InfoFrame from "./InfoFrame.svelte";
	import PageInfo from "./PageInfo.svelte";

	let title = $state()
	let tags = $state()
	let text = $state()
	let submitted = false

	async function handleSubmit(event) { // editors viewers folder is_open is_private
		let response = await fetch("/library/api/page", {
			body: JSON.stringify({
				'title': title,
				'tags': tags,
				'text': text,
				'editors': event.detail.editors,
				'viewers': event.detail.readers,
				'folder': event.detail.folder !== "" ? event.detail.folder : null,
				'is_open': event.detail.open,
				'is_private': event.detail.private,
			}),
			method: "POST",
		})
		if (response.ok) {
			alert("Page successfully created!")
		} else {
			let body = await response.text()
			alert(body)
		}
	}

	function handleBeforeUnload(event) {
		event.preventDefault()
		event.returnValue = true
	}
</script>

<svelte:head>
	<title>New Page</title>
	<meta name="description" content="Create new page"/>
</svelte:head>

<svelte:window onbeforeunload={handleBeforeUnload}/>

<ArticleFrame editing={true} bind:text/>

<InfoFrame bind:title bind:tags editing={true}/>

<PageInfo on:submit={handleSubmit}/>

<style>
	/* h1 {
		margin: 0;
	}

	p {
		font-weight: 500;
	} */
</style>
