<script>
	import { onMount } from "svelte";

    export let author = {id: 0, name: "you"}
    export let title = "New Page"
    export let time = {creation: new Date().toISOString(), edited: new Date().toISOString()}
    export let tags = [{id: 0, name: "new"}]
	export let edit = false

	/** @type Element */
	let infoTags
	/** @type HTMLCollection */
	let tagList
	onMount(() => {
		infoTags = document.getElementById("info-tags")
		tagList = infoTags.getElementsByClassName("tag-container") // does not include the add button
	})

	function handleTitleInput(event) {
		title = event.target.textContent
	}

	let tagElements
	function handleAddTag(event) {
		if (document.getElementsByClassName("editing").length > 0) {return} // do nothing if tag already being edited

		if (tagList.length < 1) { // only add comma if there is a previous element
			let comma = document.createElement("span")
			comma.textContent = ", "
			tagList.item(tagList.length - 1).appendChild(comma)
		}

		let tagContainer = document.createElement("span")
		tagContainer.className = "tag-container"

		tagList.item(tagList.length - 1).insertAdjacentElement("afterend", tagContainer)

		let tag = document.createElement("a")
		tag.className = "tag editing" // .editing to show the editable tag
		tag.href = "#"
		tag.contentEditable = true
		tag.textContent = "#new tag"
		tag.addEventListener("keydown", handleTagEnter)

		tagContainer.appendChild(tag)
	}
	/** @param {KeyboardEvent} event */
	function handleTagEnter(event) {
		if (event.key === "Enter") {
			event.preventDefault()

			// let tag
			// tag.className = "tag"
			// tag.addEventListener("click", handleDeleteTag)
		}
	}

	function handleDeleteTag(event) {
		event.preventDefault()
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
		<p id="info-tags" bind:this={infoTags}>
            {#each tags as tag, index}
				<span class="tag-container">
					<a class="tag" href={edit ? "#" : "/library/tag/" + tag.id} on:click={handleDeleteTag}>#{tag.name}</a>{#if index !== tags.length - 1}<span>, </span>{/if}
				</span>
            {/each}
			{#if edit}<button class="add" on:click={handleAddTag}>+</button>{/if}
		</p>
	</aside>
	<div class="bolt"></div>
</div>

<style>
	:global(.tag.editing) {
		min-width: 25px;
		border: 2px solid var(--black);
		padding: 5px;
	}

	.tag-container {
		margin: 0;
		padding: 0;
	}

	#info-tags {
		cursor: default;
	}

	.add {
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		font-weight: 700;
		vertical-align: top;
		color: var(--moss-green);
		margin-left: 10px;
		scale: 1.5;
	}

    aside p {
		margin: 10px 0 0 0;
	}

	:global(.tag) {
		margin: 0;
		padding: 0;
		text-decoration: underline;
		color: var(--black);
	}

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