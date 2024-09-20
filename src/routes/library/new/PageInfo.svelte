<script>

</script>

<form class="extra-info">
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
    <p>thats cool too</p>
</form>

<style>
    .extra-info {
		box-shadow: 0px 10px 20px 10px rgb(0,0,0);
		background-image: url("$lib/images/striped-paper-texture.jpg");
        background-size: 25em;
		border-radius: 3px;
        padding: 1.5em 1.5em;
		width: 18em;
		line-height: 1.4;
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