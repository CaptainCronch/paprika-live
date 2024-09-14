<script>
	import ArticleFrame from "./ArticleFrame.svelte";
	import InfoFrame from "./InfoFrame.svelte";
	export let data;
    let author = {name: "cronch", id: 0}
    let title = "Name"
    let time = {creation: "12", edited: "15"}
    let tags = [{name: "epic", id: 0}, {name: "epic", id: 0}]
</script>

<svelte:head>
	<title>New Page</title>
	<meta name="description" content="Create new page"/>
</svelte:head>

<ArticleFrame>
    <h1>Welcome to the Library!</h1>
    <p>Here you can find all kinds of articles, from blog posts to personal articles, and from notes to wiki pages.</p>
    <br>
</ArticleFrame>

<InfoFrame {author} {title} {time} {tags}/>

<style>
	h1 {
		margin: 0;
	}

	p {
		font-weight: 500;
	}
</style>
