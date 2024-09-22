<script>
	export let editing = false
	export let text = ""

	function handleKey(event) {
		text = event.target.textContent
	}
</script>

<div class="picture-frame">
	<main contenteditable={editing} on:keyup={handleKey}>
		{#if !editing}
			<slot/>
		{:else}
			Start typing HTML here!
		{/if}
	</main>
</div>

<style>
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
</style>