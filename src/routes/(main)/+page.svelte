<script>
	import '$lib/css/styles.css';
	import Navigation from './Navigation.svelte';
</script>

<svelte:head>
	<title>paprika.live</title>
	<meta name="description" content="Home page" />
</svelte:head>

<Navigation>
<div class="picture-frame">
	<main>
		<h1>Ragstone</h1>
		<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis iusto explicabo eum fuga expedita. Nihil libero amet omnis in cumque eum doloribus reprehenderit minus, necessitatibus qui hic veritatis, dicta maiores.</p>
	</main>
</div>
</Navigation>

<style>
	main {
		padding: 2.5em 3em;
		width: 100%;
		height: 100%;
		max-height:100%;
		max-width:100%;
		margin: 0;
	}

	main::before{
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		width : 100%;
		height: 100%;
		background-image: url("$lib/images/canvas-texture.avif");
		background-size: 30em;
		filter: saturation(50%);
		z-index: -1;
	}

	.picture-frame {
		min-height: 50vh;
		max-width: 40em;
		margin: 0;
		border:solid 5vmin #eee;
		border-bottom-color:#fff;
		border-left-color:#eee;
		border-radius:2px;
		border-right-color:#eee;
		border-top-color:#ddd;
		box-shadow:0 0 5px 0 rgba(0,0,0,.25) inset, 0 0px 20px 5px rgb(0,0,0);
		display:inline-block;
		position:relative;
		pointer-events: none;
	}
	.picture-frame::before {
		border-radius:2px;
		bottom:-2vmin;
		box-shadow:0 2px 5px 0 rgba(0,0,0,.25) inset;
		content:"";
		left:-2vmin;
		position:absolute;
		right:-2vmin;
		top:-2vmin;
	}
	.picture-frame::after {
		border-radius:2px;
		bottom:-2.5vmin;
		box-shadow: 0 2px 5px 0 rgba(0,0,0,.25);
		content:"";
		left:-2.5vmin;
		position:absolute;
		right:-2.5vmin;
		top:-2.5vmin;
	}

	h1 {
		margin: 0;
	}

	p {
		font-weight: 500;
	}
</style>
