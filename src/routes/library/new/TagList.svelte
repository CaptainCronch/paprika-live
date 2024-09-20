<script>
    import { onMount } from "svelte";

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

	let tagElements
	function handleAddTag(event) {
		if (document.getElementsByClassName("editing").length > 0) {return} // do nothing if tag already being edited

		if (tagList.length > 0) { // only add comma if there is a previous element
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
        if (tag.textContent.charAt(0) !== "#") {
            tag.textContent = "#" + tag.textContent
        }
    }
</script>

<p id="info-tags" bind:this={infoTags}>
    {#each tags as tag, index}
        <span class="tag-container">
            <a class="tag" href={edit ? "#" : "/library/tag/" + tag.id} on:click={handleDeleteTag} on:focusout={handleTagAccept}>#{tag.name}</a>{#if index !== tags.length - 1}<span>, </span>{/if}
        </span>
    {/each}
    {#if edit}<button class="add" on:click={handleAddTag}>+</button>{/if}
</p>

<style>
    :global(.tag) {
		margin: 0;
		padding: 0;
		text-decoration: underline;
		color: var(--black);
	}

    :global(.editing) {
		min-width: 25px;
		border: 2px solid var(--moss-green);
		border-radius: 5px;
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

    p {
		margin: 10px 0 0 0;
        line-height: 1.2;
	}
</style>