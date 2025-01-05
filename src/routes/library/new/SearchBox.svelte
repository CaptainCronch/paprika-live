<script>
    import { createEventDispatcher, onMount } from 'svelte';
    const dispatch = createEventDispatcher();

    /**
     * @typedef {Object} Props
     * @property {string} [symbol]
     */

    /** @type {Props} */
    let { symbol = "@" } = $props();

    let search = $state()
    onMount(() => {
        search.focus()
    })

    let results = $state([])

    let value = $state()
    function handleFocusOut() {
        dispatch("closebox", selectedUser)
    }

    async function handleKey(event) {
        if (event.key === "Enter") {
            event.preventDefault()
        } else {
            if (event.target.value.length === 0) {return}

            let response = await fetch("/library/api/user?search=" + event.target.value, {credentials: 'same-origin'})
            if (response.ok) {
                results = await response.json()
            } else {
                results = []
            }
        }
    }

    let selectedUser = null
    function handleSelect(event) {
        selectedUser = results[parseInt(event.target.id)]
    }

    function handleUnselect() {
        selectedUser = null
    }

    /** @param {Event} event */
    function handleClick(event) {
        console.log(event.target.id)
        dispatch("closebox", results[parseInt(event.target.id)])
    }
</script>

<search class="relative">
    <div class="search-container">
        {#each results as result, i}
            <button class="result" id={i} onclick={handleClick} onmouseover={handleSelect} onfocus={handleSelect} onmouseout={handleUnselect} onblur={handleUnselect}>{symbol + result.name}</button>
        {/each}
        <label for="search">{symbol}</label><input bind:this={search} type="text" name="search" id="search" onfocusout={handleFocusOut} onkeyup={handleKey} bind:value placeholder="username">
    </div>
</search>

<style>
    .result {
        display: inline-block;
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        width: 100%;
        text-align: start;
        margin-bottom: 10px;
        border-radius: 5px;
        transition: all 0.2s;
        cursor: pointer;
        overflow-wrap: break-word;
    }

    .result:hover {
        background-color: lightgrey;
    }

    .relative {
        position: relative;
        width: 0;
        height: 0;
    }

    .search-container {
        width: 12em;
        background-color: white;
        padding: 10px 20px;
        border-radius: 20px;
        box-shadow: 0px 10px 20px -5px rgb(0,0,0);
        position: absolute;
        bottom: 1em;
    }

    input {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        display: inline;
        width: 9em;
        color: var(--black)
    }

    input:focus {
        outline: none;
    }
</style>