<script>
	import TagList from "./TagList.svelte";

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
</script>

<div class="extra-info" bind:this={extraInfo}>
    <button class="dip-button" on:click={handleClick}><svg class="dip" bind:this={dip} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg></button>
    <p>
        <input type="checkbox" name="open" id="open" checked>
        <label for="open">Anyone can edit</label>
    </p>
    <p>
        <input type="checkbox" name="private" id="private" checked>
        <label for="private">Publicly visible</label>
    </p>
    <p>
        <input type="text" name="folder" id="folder">
        <label for="folder">Folder</label>
    </p>
    <br>
    <p>Editors:</p>
    <TagList edit="true" symbol="@" defaultName="new user" tags={[]}/>
    <br>
    <p>Readers:</p>
    <TagList edit="true" symbol="@" defaultName="new user"/>
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
        bottom: -0.5em;
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