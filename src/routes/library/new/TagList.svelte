<script>
    import { onMount } from "svelte";

	export let symbol = "#"
	export let defaultName = "new tag"
    export let tags = [{id: 0, name: defaultName}]
	export let edit = false

    /** @type Element */
	let infoTags
	/** @type HTMLCollection */
	let tagList
	/** @type Element */
	let addButton
	onMount(() => {
		tagList = infoTags.getElementsByClassName("tag-container") // does not include the add button
	})

	let tagElements
	function handleAddTag(event) {
		if (infoTags.getElementsByClassName("editing").length > 0) {return} // do nothing if tag already being edited

		if (tagList.length > 0) { // only add comma if there is a previous element
			let comma = document.createElement("span")
			comma.textContent = ", "
			comma.className = "comma"
			tagList.item(tagList.length - 1).appendChild(comma)
		}

		let tagContainer = document.createElement("span")
		tagContainer.className = "tag-container"

		addButton.insertAdjacentElement("beforebegin", tagContainer)

		let tag = document.createElement("a")
		tag.className = "tag editing" // .editing to show the editable tag
		tag.href = "#"
		tag.contentEditable = true
		tag.textContent = symbol + defaultName
		tag.addEventListener("keydown", handleTagEnter)
        tag.addEventListener("focusout", handleTagAccept)

		tagContainer.appendChild(tag)
	}
    
	/** @param {KeyboardEvent} event */
	function handleTagEnter(event) {
		if (event.key === "Enter") {
            handleTagAccept()
			event.preventDefault()
		}
	}

	function handleDeleteTag(event) { // deletes tag on click, and deletes previous comma
		event.target.parentElement.remove()
		let comma = tagList.item(tagList.length - 1).getElementsByTagName("span")
		if (comma.length > 0) {comma.item(0).remove()}
		event.preventDefault()
	}

    function handleTagAccept() {
        /** @type HTMLSpanElement */
        let tag = tagList.item(tagList.length - 1).getElementsByClassName("tag").item(0)
        tag.className = "tag"
        tag.contentEditable = false
        tag.addEventListener("click", handleDeleteTag)
        if (tag.textContent.charAt(0) !== symbol) {
            tag.textContent = symbol + tag.textContent
        }
    }
</script>

<p id="info-tags" bind:this={infoTags}>
    {#each tags as tag, index}
        <span class="tag-container">
            <a class="tag" href={edit ? "#" : "/library/tag/" + tag.id} on:click={handleDeleteTag} on:focusout={handleTagAccept}>{symbol + tag.name}</a>{#if index !== tags.length - 1}<span class="comma">, </span>{/if}
        </span>
    {/each}
    {#if edit}<button class="add" on:click={handleAddTag} bind:this={addButton}>+</button>{/if}
</p>

<style>
    :global(.tag) {
		margin: 0;
		padding: 0;
		text-decoration: underline;
		color: var(--black);
		outline-width: 0px;
		transition: all 0.1s;
	}

	:global(.tag:last-child) {
		margin-right: 10px;
	}

	:global(.tag:hover) {
		outline: 3px solid var(--coyote);
		border-radius: 5px;
	}

    :global(.editing) {
		min-width: 25px;
		outline: 3px solid var(--moss-green) !important;
		border-radius: 5px;
	}

	:global(.comma) {
		margin-right: 0.4em;
	}

	.tag-container {
		margin: 0;
		padding: 0;
	}

	#info-tags {
		cursor: default;
	}

	.add {
		margin: 0;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		font-weight: 700;
		vertical-align: top;
		color: var(--moss-green);
		scale: 1.5;
		transition: all 0.1s;
		padding-left: 0;
	}

	.add:hover {
		padding-left: 5px;
		scale: 2;
	}

    p {
		display: flex;
		justify-content: start;
		flex-wrap: wrap;
		margin: 0;
        line-height: 1.4;
	}
</style>