<script>
    /**
     * @typedef {Object} Props
     * @property {import('svelte').Snippet} [children]
     */

    /** @type {Props} */
    let { children } = $props();

</script>

<div>
    {@render children?.()}
</div>

<style>
    div {
        background-color: black;
        width: 100vw;
        height: 100vh;
        overflow: hidden;
    }
</style>