<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let symbol = "@"

    let results = []

    let value
    function handleFocusOut() {
        dispatch("closebox", selectedUser)
    }

    async function handleKey(event) {
        if (event.key === "Enter") {
            event.preventDefault()
        } else {
            if (event.target.value.length === 0) {return}

            let response = await fetch("/library/api/user?search=" + event.target.value)
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

<div class="relative">
    <div class="search-container">
        {#each results as result, i}
            <button class="result" id={i} on:click={handleClick} on:mouseover={handleSelect} on:focus={handleSelect} on:mouseout={handleUnselect} on:blur={handleUnselect}>{symbol + result.name}</button>
        {/each}
        <label for="search">{symbol}</label><input type="text" name="search" id="search" on:focusout={handleFocusOut} on:keyup={handleKey} bind:value placeholder="username">
    </div>
</div>

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