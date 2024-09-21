<script>
	import { flip } from "svelte/animate";
	import TagList from "./TagList.svelte";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    /** @type HTMLDivElement */
    let extraInfo
    let dip
    function handleClick() {
        if (extraInfo.style.bottom == "-0.5em") {
            extraInfo.style.bottom = -extraInfo.offsetHeight + "px"
            dip.style.rotate = "0deg"
        } else {
            extraInfo.style.bottom = "-0.5em"
            dip.style.rotate = "180deg"
        }
    }

    let isPrivate = false
    let isClosed = false
    let folder
    let editors
    let readers
    function handleSubmit() {
        dispatch("submit", {
            private: isPrivate,
            open: !isClosed,
            folder: folder,
            editors: editors,
            readers: readers,
        })
    }
</script>

<div class="extra-info" bind:this={extraInfo} style="bottom: -0.5em;">
    <button class="dip-button" on:click={handleClick}><svg class="dip" bind:this={dip} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg></button>
    {#if isPrivate}
        <p>Add editors:</p>
        <TagList edit="true" symbol="@" defaultName="new user" tags={[]}/>
        <br>
    {/if}
    {#if isClosed}
        <p>Add readers:</p>
        <TagList edit="true" symbol="@" defaultName="new user" tags={[]}/>
        <br>
    {/if}
    <p>
        <input type="checkbox" name="private" id="private" bind:checked={isPrivate}>
        <label for="private">Closed for public editing</label>
    </p>
    <p>
        <input type="checkbox" name="closed" id="closed" bind:checked={isClosed}>
        <label for="closed">Closed for public viewing</label>
    </p>
    
    <p>
        <input type="text" name="folder" id="folder" bind:value={folder} placeholder="name">
        <label for="folder">Folder</label>
    </p>
    <br>
    <button class="submit" on:click={handleSubmit}>Submit New Page</button>
</div>

<style>
    .extra-info {
		box-shadow: 0px 10px 20px 10px rgb(0,0,0);
		background-image: url("$lib/images/striped-paper-texture.jpg");
        background-size: 25em;
		border-radius: 3px;
        padding: 1.5em 1.5em;
		width: 18em;
		line-height: 1.4;
        position: fixed;
        right: 5em;
        transition: all 0.2s;
	}

    .dip-button {
        background-color: #fafafa;
        padding: 10px 15px 10px;
        border: none;
        border-radius: 3px;
        font-weight: 700;
        font-size: 1.5em;
        position: absolute;
        right: 0.5em;
        top: -1.5em;
        cursor: pointer;
    }

    .dip {
        transition: all 0.2s;
        rotate: 180deg;
        width: 1em;
    }

    .submit {
        margin: 0 auto;
        background: none;
        padding: 10px;
        border: none;
        color: var(--black);
        display: block;
        font-size: 1.5em;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.1s;
    }

    .submit:hover {
        scale: 1.05;
    }

    path {
        fill: var(--black);
    }

    p {
        margin: 0;
    }

    input[type="checkbox"] {
        vertical-align: middle;
    }

    input[type="text"] {
        display: inline;
        width: 8em;
        background: none;
        border: none;
        border-bottom: 2px dotted var(--gray);
    }
</style>