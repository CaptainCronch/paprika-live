<script>
	import '$lib/css/styles.css';
	import Navigation from './Navigation.svelte';
</script>

<svelte:head>
	<title>paprika.live</title>
	<meta name="description" content="Home page" />
</svelte:head>

<Navigation/>

<main>
	<div id="inset-background">
		<h1>hello everyone</h1>
	</div>
</main>

<style>
	/* :global(body) {
		background-image: linear-gradient(90deg, rgba(227,227,202,0.5) 67%, rgba(39,35,32,0.5) 100%);
		min-height: 100vh;
		margin: 0;
	} */

	main {
		height: 50vh;
		width: 40%;
		margin: 0;
		padding: 0;
		filter: drop-shadow(0px 0px 30px rgb(0, 0, 0));
	}

	#inset-background {
		width: 100%;
		height: 100%;
		--corner-size-h: 50px;
		--corner-size-v: 20px;
		padding: 3em;
		background-image: url("$lib/images/white-marble-texture.jpg");
		clip-path: polygon(
			var(--corner-size-h) 0,
			calc(100% - var(--corner-size-h)) 0,
			100% var(--corner-size-v),
			100% calc(100% - var(--corner-size-v)),
			calc(100% - var(--corner-size-h)) 100%,
			var(--corner-size-h) 100%,
			0 calc(100% - var(--corner-size-v)),
			0 var(--corner-size-v)
			);
		box-shadow: 0px 0px 50px 10px rgb(0,0,0) inset;
	}

	h1 {
		margin: 0;
	}
</style>
