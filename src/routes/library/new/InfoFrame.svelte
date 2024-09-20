<script>
	import TagList from "./TagList.svelte";

    export let author = {id: 0, name: "you"}
    export let title = "New Page"
    export let time = {creation: new Date().toISOString(), edited: new Date().toISOString()}
    export let tags = [{id: 0, name: "new"}]
	export let edit = false

	function handleTitleInput(event) {
		title = event.target.textContent
	}
</script>

<div class="info-frame">
	<div class="bolt"></div>
	<aside>
		<p id="info-author"><a class="tag" href="{edit ? "/library/new" : "/library/user/" + author.id}">@{author.name}</a></p>
		<h2 id="info-title" contenteditable={edit} on:input={handleTitleInput}>{title}</h2>
		<p id="info-subtitle"><span id="info-time" title="last modified {time.edited}">{time.creation}</span></p>
		<p>HTML; text on canvas</p>
		<br>
		<TagList {tags} {edit}/>
	</aside>
	<div class="bolt"></div>
</div>

<style>
	#info-author {
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
		overflow-wrap: break-word;
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
</style>