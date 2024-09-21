<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    export let symbol = "@"

    let results = [{name: "a"}]

    let value
    function handleFocusOut() {
        dispatch("closeBox", {})
    }

    async function handleKey(event) {
        if (event.key === "Enter") {
            dispatch("closeBox",{
                name: value,
            })
            event.preventDefault()
        } else {
            let response = await fetch("/library/api/user?search=" + event.target.value)
            if (response.ok) {
                results = await response.json()
            } else {
                results = []
            }
        }
    }

    function handleClick() {
        dispatch("closeBox",{
            name: value,
        })
    }
</script>

<div class="relative">

    <div class="search-container">
        {#each results as result, i}
            <button class="result" id={"#" + i} on:click={handleClick}>{symbol + result.name}</button>
        {/each}
        <label for="search">{symbol}</label><input type="text" name="search" id="search" on:focusout={handleFocusOut} on:keyup={handleKey} bind:value placeholder="name">
    </div>
</div>

<style>
    .result {
        display: block;
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        margin-bottom: 10px;
        border-radius: 5px;
        transition: all 0.2s;
        cursor: pointer;
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