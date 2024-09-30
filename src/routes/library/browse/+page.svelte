<script>
    let pages = [{type: "page", name: "new page", id: 1}, {type: "page", name: "new page 2", id: 2}]
    let folders = [{type: "folder", name: "AWESOME folder for gangsters", id: 50}, {type: "folder", name: "awesome 2", id: 51}]
</script>

<main>
    <div class="folders">
        {#each folders as folder}
            <a class="folder" href={`/library/browse/${folder.id}`}><span class="label">{folder.name}</span><span class="ring"><span class="hole"></span></span></a>
        {/each}
    </div>
    <div class="pages">
        {#each pages as page}
            <a class="page" href={`/library/page/${page.id}`}>{page.name}</a>
        {/each}
    </div>
</main>

<style>
    main {
        width: 80%;
        min-height: 30em;
        background-image: linear-gradient(rgb(204, 204, 204), rgb(199, 199, 199)), 
                url("$lib/images/oak-12894-in-architextures.jpg");
        background-blend-mode: multiply;
        padding: 2em;
        box-shadow: 0px 10px 20px 10px rgb(0, 0, 0);
        border-image: url("$lib/images/oak-12894-in-architextures.jpg") 25% repeat;
        border-width: 1em;
    }

    .pages {
        display: grid;
        margin-top: 1.5em;
    }

    .folders {
        display: flex;
        justify-content: start;
        gap: 1.5em;
    }

    .folder {
        height: 18em;
        padding: 1em 0.5em;
        background-color: var(--olivine);
        border-right: 3px solid rgb(169, 194, 156);
        border-left: 3px solid rgb(106, 134, 90);
        border-radius: 5px;
        writing-mode: vertical-lr;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
        text-decoration: none;
        color: var(--black);
        font-weight: 500;
        box-shadow: -2px 10px 20px 0px rgb(48, 48, 48);
    }

    .label {
        display: block;
        height: 12em;
        background-color: white;
        padding: 1em;
        overflow: hidden;
        text-overflow: "-";
    }

    .ring {
        display: block;
        height: 2em;
        width: 2em;
        background-image: radial-gradient(circle, rgb(71, 71, 71) 30%, rgb(255, 255, 255) 100%);
        background-size: 2em;
        background-position: -0.1em -0.1em;
        border-radius: 50%;
        margin-top: 1em;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid white;
    }

    .hole {
        display: block;
        height: 1.6em;
        width: 1.6em;
        background-color: #252321;
        border-radius: 50%;
    }
</style>