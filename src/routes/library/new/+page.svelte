<script>
	import ArticleFrame from "./ArticleFrame.svelte";
	import InfoFrame from "./InfoFrame.svelte";
	export let data;
</script>

<svelte:head>
	<title>New Page</title>
	<meta name="description" content="Create new page"/>
</svelte:head>

<ArticleFrame>
    <h1>Welcome to the Library!</h1>
    <p>Here you can find all kinds of articles, from blog posts to personal articles, and from notes to wiki pages.</p>
</ArticleFrame>

<InfoFrame edit/>

<style>
	h1 {
		margin: 0;
	}

	p {
		font-weight: 500;
	}
</style>
