<script>
	import '$lib/css/styles.css';
	import Navigation from './Navigation.svelte';
</script>

<svelte:head>
	<title>paprika.live</title>
	<meta name="description" content="Home page" />
</svelte:head>

<Navigation/>

<div class="picture-frame">
	<main>
		<!-- <div id="background-filter"> -->
			<h1>hello everyone</h1>
		<!-- </div> -->
		<!-- <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="100%" height="300px">
			<defs>
			<filter id="filter">
				<feTurbulence baseFrequency="0.12" numOctaves="5" type="fractalNoise" result="result1" />
				<feDisplacementMap in2="result1" scale="10" result="result2" xChannelSelector="R" in="SourceGraphic" />
			</filter>
			</defs>
			<rect fill="#74b6be" filter="url(#filter)" width="100%" height="100%" x="0" y="0" />
		</svg> -->

		<!-- <svg id="main-background" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 682" preserveAspectRatio="XMinYMin">
			<defs>
				<filter id="filter">
					<feTurbulence baseFrequency="0.02" numOctaves="4" type="fractalNoise" result="result1" />
					<feDisplacementMap in2="result1" scale="50" result="result2" xChannelSelector="R" in="SourceGraphic" />
				</filter>
				<mask id="rugged-mask">
					<rect fill="#fff" filter="url(#filter)" width="100%" height="100%" x="0" y="0" />
				</mask>
			</defs>
		<image xlink:href="./src/lib/images/white-marble-texture.jpg" mask="url(#rugged-mask)"/>
		</svg> -->
		
	</main>
</div>

<style>
	/* :global(body) {
		background-image: linear-gradient(90deg, rgba(227,227,202,0.5) 67%, rgba(39,35,32,0.5) 100%);
		min-height: 100vh;
		margin: 0;
	} */
	
	.picture-frame {
		min-height: 50vh;
		width: 40%;
		margin: 0;
	}

	main {
		padding: 2.5em 3em;
		width: 100%;
		height: 100%;
		max-height:100%;
		max-width:100%;
		margin: 0;
		/* background-blend-mode: multiply; */
		
		/* filter: url("$lib/images/rugged.svg#filter"); */
		/* mask: url("$lib/images/rugged.svg#rugged-mask") no-repeat;
		mask-size: 100% 100%; */
		/* clip-path: polygon(3% 0, 7% 1%, 11% 0%, 16% 2%, 20% 0, 23% 2%, 28% 2%, 32% 1%, 35% 1%, 39% 3%, 41% 1%, 45% 0%, 47% 2%, 50% 2%, 53% 0, 58% 2%, 60% 2%, 63% 1%, 65% 0%, 67% 2%, 69% 2%, 73% 1%, 76% 1%, 79% 0, 82% 1%, 85% 0, 87% 1%, 89% 0, 92% 1%, 96% 0, 98% 3%, 99% 3%, 99% 6%, 100% 11%, 98% 15%, 100% 21%, 99% 28%, 100% 32%, 99% 35%, 99% 40%, 100% 43%, 99% 48%, 100% 53%, 100% 57%, 99% 60%, 100% 64%, 100% 68%, 99% 72%, 100% 75%, 100% 79%, 99% 83%, 100% 86%, 100% 90%, 99% 94%, 99% 98%, 95% 99%, 92% 99%, 89% 100%, 86% 99%, 83% 100%, 77% 99%, 72% 100%, 66% 98%, 62% 100%, 59% 99%, 54% 99%, 49% 100%, 46% 98%, 43% 100%, 40% 98%, 38% 100%, 35% 99%, 31% 100%, 28% 99%, 25% 99%, 22% 100%, 19% 99%, 16% 100%, 13% 99%, 10% 99%, 7% 100%, 4% 99%, 2% 97%, 1% 97%, 0% 94%, 1% 89%, 0% 84%, 1% 81%, 0 76%, 0 71%, 1% 66%, 0% 64%, 0% 61%, 0% 59%, 1% 54%, 0% 49%, 1% 45%, 0% 40%, 1% 37%, 0% 34%, 1% 29%, 0% 23%, 2% 20%, 1% 17%, 1% 13%, 0 10%, 1% 6%, 1% 3%); 
		box-shadow: 0px 0px 50px 10px rgb(0,0,0) inset,
			0px 0px 30px 10px rgb(0, 0, 0); */
	}
	main::before{
		content: "";
		position: absolute;
		left: 0;
		top: 0;
		width : 100%;
		height: 100%;
		background-image: url("$lib/images/canvas-texture.avif");
		background-size: 40rem;
		z-index: -1;
	}

	.picture-frame {
		border:solid 5vmin #eee;
		border-bottom-color:#fff;
		border-left-color:#eee;
		border-radius:2px;
		border-right-color:#eee;
		border-top-color:#ddd;
		box-shadow:0 0 5px 0 rgba(0,0,0,.25) inset, 0 0px 20px 5px rgb(0,0,0);
		display:inline-block;
		position:relative;
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

	/* #background-filter {
		width: 100%;
		height: 100%;
		background-image: url("$lib/images/white-marble-texture.jpg");
		
	} */

	/* #main-background {
		width: 100%;
		height: 100%;
	} */

	/* polygon(
			var(--corner-size-h) 0,
			calc(100% - var(--corner-size-h)) 0,
			100% var(--corner-size-v),
			100% calc(100% - var(--corner-size-v)),
			calc(100% - var(--corner-size-h)) 100%,
			var(--corner-size-h) 100%,
			0 calc(100% - var(--corner-size-v)),
			0 var(--corner-size-v)
			); */

	h1 {
		margin: 0;
	}
</style>
