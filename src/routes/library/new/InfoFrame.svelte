<script>
	import TagList from "./TagList.svelte";

    export let author = {id: 0, name: "your username here"}
    export let title = "New Page"
    export let time = {creation: new Date().toISOString(), edited: new Date().toISOString()}
    export let tags = [{id: 0, name: "new tag"}]
	export let editing = false
	// export let folders = [{name: "fold", id: 0}, {name: "fold", id: 0}]

	function handleTitleInput(event) {
		title = event.target.textContent
	}
</script>

<div class="info-frame">
	<div class="bolt"></div>
	<aside>
		<p id="info-author"><a class="tag" href="{editing ? "/library/new" : "/library/user/" + author.id}">@{author.name}</a></p>
		<h2 id="info-title" contenteditable={editing} on:input={handleTitleInput}>{title}</h2>
		<p id="info-subtitle"><span id="info-time" title="last modified {time.edited}">{time.creation}</span></p>
		<!-- <p style="margin-top: 15px;">
			{#each folders as folder, index}
			{#if index !== 0}<span class="arrow">&gt;</span>{/if}<a class="folder" href={"/library/folder/" + folder.id}>{folder.name}</a>
			{/each}
		</p> -->
		<p>HTML; text on canvas</p>
		<br>
		<TagList bind:tags {editing}/>
	</aside>
	<div class="bolt"></div>
</div>

<style>
	/* .arrow {
		margin: 0 5px;
	}

	.folder {
		margin: 0;
		padding: 0;
		text-decoration: underline;
		color: var(--black);
		outline-width: 0px;
		transition: all 0.1s;
		overflow-wrap: break-word;
	} */

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
		width: 25px;
		height: 25px;
		background-image: radial-gradient(circle, rgb(134, 134, 134) 40%, rgb(214, 214, 214) 100%);
		background-position: -1px 1px;
		background-size: 26px;
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