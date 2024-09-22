<script>
	import ArticleFrame from "./ArticleFrame.svelte";
	import InfoFrame from "./InfoFrame.svelte";
	import PageInfo from "./PageInfo.svelte";
	export let data;

	let title
	let tags
	let text
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
</script>

<svelte:head>
	<title>New Page</title>
	<meta name="description" content="Create new page"/>
</svelte:head>

<ArticleFrame bind:text editing/>

<InfoFrame bind:title bind:tags editing/>

<PageInfo on:submit={handleSubmit}/>

<style>
	h1 {
		margin: 0;
	}

	p {
		font-weight: 500;
	}
</style>
