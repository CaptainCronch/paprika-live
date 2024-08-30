<script>
	import Navigation from '../../Navigation.svelte';
	import Library from './Library.svelte'
	// export let data;
</script>

<svelte:head>
	<title>paprika.live</title>
	<meta name="description" content="Home page" />
</svelte:head>

<Library>
<div class="picture-frame">
	<main>
		<h1>Welcome to the Library!</h1>
		<p>Here you can find all kinds of articles, from blog posts to personal articles, and from notes to wiki pages.</p>
		<br>
		<!-- <p>{data.params.article}</p> -->
		<a href="/">paprika.live</a>
	</main>
</div>

<div class="info-frame">
	<div class="bolt"></div>
	<aside>
		<p id="info-authors">
			<a class="tag" href="#info-authors">@cronch</a>,
			<a class="tag" href="#info-authors">@somebody-else</a> and
			<a class="tag" href="#info-authors">@me</a>
		</p>
		<h2 id="info-title">Library Introduction</h2>
		<p id="info-subtitle"><span id="info-time" title="last modified 2024-8-6T7:45:15+07:00">2024-8-6T7:45:15+07:00</span></p>
		<p>HTML; text on canvas</p>
		<br>
		<p id="info-tags">
			<a class="tag" href="#info-authors">#meta</a>,
			<a class="tag" href="#info-authors">#library</a>,
			<a class="tag" href="#info-authors">#welcome</a>
		</p>
	</aside>
	<div class="bolt"></div>
</div>
</Library>

<style>

	aside p {
		margin: 10px 0 0 0;
	}

	.tag {
		text-decoration: underline;
		color: inherit;
	}

	#info-authors {
		margin: 0;
		font-size: 0.8em;
		font-weight: 400;
	}

	#info-time {
		cursor: help;
	}

	#info-time::after {
		display: none;
	}

	#info-subtitle {
		margin: 0;
		font-style: italic;
		font-weight: 400;
		font-size: 0.8em;
		text-decoration: underline dotted;
	}

	#info-title {
		margin: 0;
		font-size: 1.5em;
		font-weight: 800;
	}

	aside {
		padding: 2.5em 0;
		width: 18em;
		line-height: 1.2;
	}

	.bolt {
		width: 20px;
		height: 20px;
		background-image: radial-gradient(circle, rgb(58, 58, 58) 40%, rgb(197, 197, 197) 100%);
		background-position: -1px 1px;
		background-size: 21px;
		border-radius: 100%;
		margin: 1em;
	}

	.info-frame {
		box-shadow: 0px 10px 20px 10px rgb(0,0,0);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		/* left: 100vw; */
		background-image: url("$lib/images/white-marble-texture.jpg");
		border-radius: 3px;
	}

	main * {
		pointer-events: auto;
	}

	main {
		padding: 2.5em 3em;
		width: 100%;
		height: 100%;
		margin: 0;
		background-image: url("$lib/images/canvas-texture.avif");
		background-size: 35em;
		pointer-events: auto;
	}

	main::before{
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		width : 100%;
		height: 100%;
		pointer-events: none;
	}

	.picture-frame {
		width: 40em;
		margin: 0;
		border:solid 5vmin #eee;
		border-bottom-color:#fff;
		border-left-color:#eee;
		border-radius:2px;
		border-right-color:#eee;
		border-top-color:#ddd;
		box-shadow:0 0 5px 0 rgba(0,0,0,.25) inset, 0px 10px 20px 10px rgb(0,0,0);
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
		pointer-events: none;
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
		pointer-events: none;
	}

	h1 {
		margin: 0;
	}

	p {
		font-weight: 500;
	}
</style>
