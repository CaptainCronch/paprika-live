<script>
	import { onMount } from "svelte";
    export let data;

    console.log(data)

    const colors = [
        {main: "#95b087", light: "#a9c29c", dark: "#6a865a", name: "green"},
        {main: "#e2e076", light: "#f5f3a3", dark: "#b3b146", name: "yellow"},
        {main: "#e26f6f", light: "#ec8d8d", dark: "#b94545", name: "red"},
        {main: "#716fe2", light: "#8e8ce6", dark: "#4644c4", name: "purple"},
        {main: "#e26fb2", light: "#e68cc8", dark: "#c44493", name: "pink"},
        {main: "#6fc7e2", light: "#a1d2ee", dark: "#3989ad", name: "cyan"},
        {main: "#e29d6f", light: "#e7b491", dark: "#ad6739", name: "orange"},
        {main: "#eaeaf0", light: "#ffffff", dark: "#bab5c4", name: "white"},
        {main: "#252529", light: "#4e4e4e", dark: "#100f14", name: "black"},
    ]

    let pages = [{type: "page", name: "New page that is really cool trust me plus it talks about game design and other things yeppers", id: 1, author: "cronch", tags: ["awe man theres no room left"]}, {type: "page", name: "some other page i guess. sigh", id: 1, author: "not-cronch", tags: ["whoa", "banger"]}]
    let folders = [{type: "folder", name: "AWESOME folder for gangsters", id: 50}, {type: "folder", name: "awesome 2", id: 51}]

    for (let index = 0; index < 7; index++) { // testing purposes
        folders.push({type: "folder", name: `awesome folder ${index + 3}`, id: 51})
        pages.push({type: "page", name: `page number ${index + 2}!`, id: 5, author: "someone", tags: ["cool", "awesome", "beast mode"]})
    }

    let currentColors = []
    let lights = [] // for some reason i cannot access an object property in svelte html... whole object or nada... its undefined for no reason... maybe its a string value inserting whatever thing like no expressions allowed only variables and functions or something
    let darks = []

    /** @type {HTMLElement} */
    let grid
    /** @type {HTMLCollectionOf<Element>} */
    let items
    let columns
    onMount(() => {
        currentColors = []; lights = []; darks = []; // reset all the picked colors
        for (let index = 0; index < folders.length; index++) {
            const RANDOM_COLOR = colors[randomInt(colors.length)]
            currentColors.push(RANDOM_COLOR.main)
            lights.push(RANDOM_COLOR.light)
            darks.push(RANDOM_COLOR.dark) // so weird why svelte whyyy tell meee too bad i have no internet right now so i cant even look it up lol
        }
        addEventListener('resize', arrange, false)
        items = grid.getElementsByClassName("page")
        arrange()
    })

    /** @param {HTMLElement} masonry */
    function arrange() {
        let currentColumns = getComputedStyle(grid).gridTemplateColumns.split(' ').length
        if (currentColumns !== columns) {
            columns = currentColumns

            Array.from(items).forEach(item => {
                item.style.removeProperty("margin-top")
            });

            if (columns > 1) {
                Array.from(items).slice(columns).forEach((item, index) => {
                    let bottomEdge = items.item(index).getBoundingClientRect().bottom
                    let topEdge = item.getBoundingClientRect().top

                    let gap = getComputedStyle(grid).rowGap
                    item.style.marginTop = `${bottomEdge + parseFloat(gap.substring(0, gap.length - 2)) - topEdge}px`
                })
            }
        }
    }
    
    function randomInt(max) { // exclusive
        return Math.floor(Math.random() * max);
    }
</script>

<main>
    <div class="folders">
        {#each folders as folder, i}
            <a class="folder" href={`/library/browse/${folder.id}`}
                style={`background-color:${currentColors[i]};border-right-color:${lights[i]};border-left-color:${darks[i]};`}
                ><span class="label">{folder.name}</span><span class="ring"><span class="hole"></span></span></a>
        {/each}
    </div>
    <div class="pages" bind:this={grid}>
        {#each pages as page}
            <a class="page" href={`/library/page/${page.id}`}><span class="author">{"@"+page.author}</span><span class="title">{page.name}</span><span class="tags">{#each page.tags as tag, index}<span>#{tag}</span>{#if index+1 !== page.tags.length}, {/if}{/each}</span></a>
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
        justify-content: center;
        grid-template-columns: repeat(auto-fit, 20em);
        grid-gap: 2em;
        margin-top: 4em;
    }

    .page {
        display: flex;
        flex-direction: column;
        color: var(--black);
        background-image: url("$lib/images/linen.png");
        background-size: 50em;
        padding: 1em 1.5em;
        width: 20em;
        min-height: 10em;
        height: fit-content;
        max-height: 20em;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: none;
        align-self: start;
        border: solid 1.5em #eee;
		border-bottom-color: #fff;
		border-left-color: #eee;
		border-radius: 3px;
		border-right-color: #eee;
		border-top-color: #ddd;
        box-shadow: -2px 10px 20px 0px #000000b4, inset 0px 0px 10px -5px #000000b4;
        transition: all 0.2s;
    }

    .page:hover, .page:focus {
        scale: 1.05;
    }

    .author {
        display: block;
        line-height: 1;
        font-size: 0.8em;
        text-decoration: underline;
    }

    .title {
        display: block;
        font-size: 1.8em;
        font-weight: 600;
	    font-family: var(--font-heading);
        line-height: 1.2;
        overflow: hidden;
    }

    .tags {
        display: block;
        line-height: 1.2;
        font-size: 0.8em;
        margin-top: auto;
    }

    .tags span {
        text-decoration: underline;
    }

    .folders {
        display: flex;
        justify-content: start;
        gap: 2em;
        flex-wrap: wrap;
    }

    .folder {
        height: 18em;
        padding: 1em 0.5em;
        background-color: #eaeaf0;
        border-right: 3px solid #ffffff;
        border-left: 3px solid #bab5c4;
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
        box-shadow: -2px 10px 20px 0px #000000b4;
        transition: all 0.2s;
    }

    .folder:hover, .folder:focus {
        scale: 1.05;
        rotate: -1deg;
    }

    .label {
        display: block;
        height: 12em;
        background-color: white;
        padding: 1em;
        overflow: hidden;
        text-overflow: ellipsis;
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